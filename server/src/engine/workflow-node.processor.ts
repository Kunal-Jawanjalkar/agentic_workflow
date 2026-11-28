import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'

import { Prisma } from '../generated/prisma/client'
import { NodeRegistryService } from '../nodes/node-registry.service'
import { PrismaService } from '../prisma/prisma.service'

import {
  DEFAULT_WORKER_LOCK_DURATION_MS,
  NodeJobPayload,
  WORKFLOW_NODES_QUEUE,
} from './queue.constants'
import {
  areIncomingParentsCompleted,
  buildNodeExecutionInput,
  findNextNodeIds,
  parseWorkflowGraph,
} from './workflow-graph.helpers'
import { WorkflowQueueService } from './workflow-queue.service'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

@Processor(WORKFLOW_NODES_QUEUE, {
  concurrency: 10,
  lockDuration: DEFAULT_WORKER_LOCK_DURATION_MS,
})
export class WorkflowNodeProcessor extends WorkerHost {
  private readonly logger = new Logger(WorkflowNodeProcessor.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly nodeRegistry: NodeRegistryService,
    private readonly workflowQueue: WorkflowQueueService,
  ) {
    super()
  }

  async process(job: Job<NodeJobPayload>): Promise<Record<string, unknown>> {
    const { runId, ownerId, workflowId, workflowVersionId, nodeId } = job.data

    const run = await this.prisma.workflowRun.findUnique({ where: { id: runId } })
    if (!run) {
      throw new Error(`WorkflowRun "${runId}" not found`)
    }

    if (run.status === 'pending') {
      await this.prisma.workflowRun.update({
        where: { id: runId },
        data: {
          status: 'running',
          started_at: run.started_at ?? new Date(),
        },
      })
    }

    const version = await this.prisma.workflowVersion.findUnique({
      where: { id: workflowVersionId },
    })
    if (!version || version.workflow_id !== workflowId) {
      throw new Error(`WorkflowVersion "${workflowVersionId}" not found`)
    }

    const graph = parseWorkflowGraph(version.graph)
    const node = graph.nodes.find((item) => item.id === nodeId)
    if (!node) {
      throw new Error(`Node "${nodeId}" not found in workflow version "${workflowVersionId}"`)
    }

    const completedRuns = await this.prisma.nodeRun.findMany({
      where: { run_id: runId, status: 'completed' },
      orderBy: { created_at: 'asc' },
    })

    const outputsByNodeId: Record<string, Record<string, unknown>> = {}
    const completedNodeIds = new Set<string>()
    for (const completed of completedRuns) {
      completedNodeIds.add(completed.node_id)
      if (isPlainObject(completed.output)) {
        outputsByNodeId[completed.node_id] = completed.output
      }
    }

    const triggerInput = isPlainObject(run.trigger_input) ? run.trigger_input : {}
    const nodeInput = buildNodeExecutionInput({
      nodeId,
      graph,
      triggerInput,
      outputsByNodeId,
    })

    const attempt = job.attemptsMade + 1
    const nodeRun = await this.prisma.nodeRun.create({
      data: {
        run_id: runId,
        node_id: nodeId,
        node_type: node.data.type,
        status: 'running',
        attempt,
        input: nodeInput as Prisma.InputJsonValue,
        started_at: new Date(),
      },
    })

    try {
      const executor = this.nodeRegistry.getExecutorOrThrow(
        node.data.type,
        node.data.version ?? 1,
      )
      const config = executor.validateConfig
        ? executor.validateConfig(node.data.config ?? {})
        : (node.data.config ?? {})

      const result = await executor.execute(config, {
        ownerId,
        workflowId,
        executionId: runId,
        nodeId,
        input: nodeInput,
      })

      await this.prisma.nodeRun.update({
        where: { id: nodeRun.id },
        data: {
          status: result.status === 'waiting_approval' ? 'waiting_approval' : 'completed',
          output: result.output as Prisma.InputJsonValue,
          finished_at: new Date(),
        },
      })

      if (result.status === 'waiting_approval') {
        await this.prisma.workflowRun.update({
          where: { id: runId },
          data: { status: 'waiting_approval' },
        })
        return result.output
      }

      completedNodeIds.add(nodeId)
      const nextIds = findNextNodeIds({
        nodeId,
        outputHandle: result.outputHandle,
        graph,
      })

      let enqueuedNext = false
      for (const nextId of nextIds) {
        if (
          areIncomingParentsCompleted({
            nodeId: nextId,
            graph,
            completedNodeIds,
          })
        ) {
          await this.workflowQueue.enqueueNode({
            runId,
            ownerId,
            workflowId,
            workflowVersionId,
            nodeId: nextId,
          })
          enqueuedNext = true
        }
      }

      if (!enqueuedNext) {
        const activeCount = await this.prisma.nodeRun.count({
          where: {
            run_id: runId,
            status: { in: ['running', 'waiting_approval'] },
          },
        })
        if (activeCount === 0) {
          await this.prisma.workflowRun.update({
            where: { id: runId },
            data: {
              status: 'completed',
              output: result.output as Prisma.InputJsonValue,
              finished_at: new Date(),
            },
          })
        }
      }

      return result.output
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      await this.prisma.nodeRun.update({
        where: { id: nodeRun.id },
        data: {
          status: 'failed',
          error: message,
          finished_at: new Date(),
        },
      })
      throw error
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<NodeJobPayload> | undefined, error: Error): Promise<void> {
    if (!job) {
      return
    }
    const maxAttempts = job.opts.attempts ?? 1
    if (job.attemptsMade < maxAttempts) {
      return
    }

    this.logger.error(
      `Run ${job.data.runId} node ${job.data.nodeId} failed after ${job.attemptsMade} attempt(s): ${error.message}`,
    )

    try {
      await this.prisma.workflowRun.update({
        where: { id: job.data.runId },
        data: {
          status: 'failed',
          error: error.message,
          finished_at: new Date(),
        },
      })
    } catch {
      // Ignore if the run record was deleted before final failure handling.
    }
  }
}
