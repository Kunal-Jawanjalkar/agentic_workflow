import { HttpStatus, Injectable } from '@nestjs/common'
import { timingSafeEqual } from 'node:crypto'

import { HttpDetailException } from '../common/http-detail.exception'
import {
  findTriggerNode,
  parseWorkflowGraph,
  WorkflowGraphPayload,
} from '../engine/workflow-graph.helpers'
import { WorkflowQueueService } from '../engine/workflow-queue.service'
import { Prisma } from '../generated/prisma/client'
import { TriggerNodeConfig, TriggerNodeExecutor } from '../nodes/trigger-node'
import { PrismaService } from '../prisma/prisma.service'
import { hashTriggerSecret } from '../workflows/workflows.service'

function secretsEqual(expected: string, actual: string): boolean {
  const expectedBuf = Buffer.from(expected, 'utf8')
  const actualBuf = Buffer.from(actual, 'utf8')
  if (expectedBuf.length !== actualBuf.length) {
    return false
  }
  return timingSafeEqual(expectedBuf, actualBuf)
}

function asPlainObject(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

@Injectable()
export class RunsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly triggerNode: TriggerNodeExecutor,
    private readonly workflowQueue: WorkflowQueueService,
  ) {}

  private extractTrigger(graph: WorkflowGraphPayload): {
    nodeId: string
    config: TriggerNodeConfig
  } {
    const trigger = findTriggerNode(graph)
    return {
      nodeId: trigger.id,
      config: this.triggerNode.validateConfig(trigger.data.config),
    }
  }

  private async loadWorkflowWithCurrentVersion(workflowId: string, ownerId?: string) {
    const workflow = await this.prisma.workflow.findFirst({
      where: ownerId ? { id: workflowId, owner_id: ownerId } : { id: workflowId },
    })
    if (!workflow) {
      throw new HttpDetailException(HttpStatus.NOT_FOUND, 'Workflow not found')
    }
    if (!workflow.current_version_id) {
      throw new HttpDetailException(HttpStatus.INTERNAL_SERVER_ERROR, 'Workflow has no version')
    }
    const version = await this.prisma.workflowVersion.findUnique({
      where: { id: workflow.current_version_id },
    })
    if (!version || version.workflow_id !== workflow.id) {
      throw new HttpDetailException(HttpStatus.INTERNAL_SERVER_ERROR, 'Workflow has no version')
    }
    return { workflow, version }
  }

  private async loadEnabledTrigger(workflowId: string) {
    return this.prisma.trigger.findFirst({
      where: { workflow_id: workflowId, is_enabled: true },
    })
  }

  private async enqueueRun(params: {
    workflowId: string
    workflowVersionId: string
    ownerId: string
    triggerType: string
    isTest: boolean
    triggerNodeId: string
    triggerInput: Record<string, unknown>
  }) {
    const run = await this.prisma.workflowRun.create({
      data: {
        workflow_id: params.workflowId,
        workflow_version_id: params.workflowVersionId,
        owner_id: params.ownerId,
        status: 'pending',
        trigger_type: params.triggerType,
        is_test: params.isTest,
        trigger_input: params.triggerInput as Prisma.InputJsonValue,
      },
    })

    try {
      await this.workflowQueue.enqueueNode({
        runId: run.id,
        ownerId: params.ownerId,
        workflowId: params.workflowId,
        workflowVersionId: params.workflowVersionId,
        nodeId: params.triggerNodeId,
      })
      return this.serializeRun(run)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      await this.prisma.workflowRun.update({
        where: { id: run.id },
        data: {
          status: 'failed',
          error: `Failed to enqueue run: ${message}`,
          finished_at: new Date(),
        },
      })
      throw new HttpDetailException(
        HttpStatus.SERVICE_UNAVAILABLE,
        `Could not enqueue workflow run: ${message}`,
      )
    }
  }

  async triggerManualRun(
    ownerId: string,
    workflowId: string,
    input: Record<string, unknown> = {},
    testMode = false,
  ) {
    const { workflow, version } = await this.loadWorkflowWithCurrentVersion(workflowId, ownerId)
    const graph = parseWorkflowGraph(version.graph)
    const triggerNode = this.extractTrigger(graph)

    if (testMode) {
      return this.enqueueRun({
        workflowId: workflow.id,
        workflowVersionId: version.id,
        ownerId,
        triggerType: triggerNode.config.trigger_type,
        isTest: true,
        triggerNodeId: triggerNode.nodeId,
        triggerInput: input,
      })
    }

    if (workflow.status !== 'active') {
      throw new HttpDetailException(
        HttpStatus.BAD_REQUEST,
        'Workflow is in draft mode. Publish the workflow or run in test mode.',
      )
    }

    const publishedTrigger = await this.loadEnabledTrigger(workflow.id)
    if (!publishedTrigger) {
      throw new HttpDetailException(
        HttpStatus.BAD_REQUEST,
        'Workflow has no enabled trigger. Publish the workflow first.',
      )
    }

    return this.enqueueRun({
      workflowId: workflow.id,
      workflowVersionId: version.id,
      ownerId,
      triggerType: publishedTrigger.type,
      isTest: false,
      triggerNodeId: triggerNode.nodeId,
      triggerInput: input,
    })
  }

  async triggerWebhookRun(
    workflowId: string,
    request: {
      method: string
      headers: Record<string, unknown>
      query: Record<string, unknown>
      body: unknown
    },
  ) {
    const { workflow, version } = await this.loadWorkflowWithCurrentVersion(workflowId)
    if (workflow.status !== 'active') {
      throw new HttpDetailException(
        HttpStatus.BAD_REQUEST,
        'Workflow is in draft mode and cannot accept webhook runs until published',
      )
    }

    const publishedTrigger = await this.loadEnabledTrigger(workflow.id)
    if (!publishedTrigger || publishedTrigger.type !== 'webhook') {
      throw new HttpDetailException(
        HttpStatus.BAD_REQUEST,
        'Workflow has no active webhook trigger',
      )
    }

    const graph = parseWorkflowGraph(version.graph)
    const triggerNode = this.extractTrigger(graph)
    const publishedConfig = asPlainObject(publishedTrigger.config)
    const expectedMethod =
      typeof publishedConfig.webhook_method === 'string'
        ? publishedConfig.webhook_method
        : 'POST'

    if (request.method.toUpperCase() !== expectedMethod.toUpperCase()) {
      throw new HttpDetailException(
        HttpStatus.METHOD_NOT_ALLOWED,
        `Webhook expects ${expectedMethod} requests`,
      )
    }

    if (publishedTrigger.secret_hash) {
      const rawHeader = request.headers['x-webhook-secret']
      const provided = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader
      if (
        typeof provided !== 'string' ||
        !secretsEqual(publishedTrigger.secret_hash, hashTriggerSecret(provided))
      ) {
        throw new HttpDetailException(HttpStatus.UNAUTHORIZED, 'Invalid webhook secret')
      }
    }

    return this.enqueueRun({
      workflowId: workflow.id,
      workflowVersionId: version.id,
      ownerId: workflow.owner_id,
      triggerType: 'webhook',
      isTest: false,
      triggerNodeId: triggerNode.nodeId,
      triggerInput: {
        method: request.method.toUpperCase(),
        headers: request.headers,
        query: request.query,
        body: request.body ?? null,
      },
    })
  }

  async syncWorkflowSchedule(ownerId: string, workflowId: string) {
    const { workflow } = await this.loadWorkflowWithCurrentVersion(workflowId, ownerId)
    if (workflow.status !== 'active') {
      throw new HttpDetailException(
        HttpStatus.BAD_REQUEST,
        'Publish the workflow before syncing its schedule',
      )
    }

    const publishedTrigger = await this.loadEnabledTrigger(workflow.id)
    if (!publishedTrigger || publishedTrigger.type !== 'scheduler') {
      await this.workflowQueue.deleteSchedule(workflow.id)
      return { synced: false, schedule_id: null }
    }

    const publishedConfig = asPlainObject(publishedTrigger.config)
    const cron = typeof publishedConfig.cron === 'string' ? publishedConfig.cron.trim() : ''
    if (!cron) {
      throw new HttpDetailException(
        HttpStatus.BAD_REQUEST,
        'Scheduler trigger requires a cron expression',
      )
    }

    const timezone =
      typeof publishedConfig.timezone === 'string' && publishedConfig.timezone.trim().length > 0
        ? publishedConfig.timezone.trim()
        : 'UTC'

    const result = await this.workflowQueue.syncSchedule({
      ownerId,
      workflowId: workflow.id,
      cron,
      timezone,
    })

    return { synced: true, schedule_id: result.scheduleId }
  }

  async listRunsForOwner(ownerId: string, workflowId?: string) {
    const runs = await this.prisma.workflowRun.findMany({
      where: {
        owner_id: ownerId,
        ...(workflowId ? { workflow_id: workflowId } : {}),
      },
      orderBy: { created_at: 'desc' },
      take: 50,
      include: {
        workflow: { select: { name: true } },
        _count: { select: { node_runs: true } },
      },
    })

    return {
      runs: runs.map((run) => ({
        ...this.serializeRun(run),
        workflow_name: run.workflow.name,
        node_run_count: run._count.node_runs,
      })),
    }
  }

  async getRunForOwner(ownerId: string, runId: string) {
    const run = await this.prisma.workflowRun.findFirst({
      where: { id: runId, owner_id: ownerId },
      include: {
        workflow: { select: { name: true } },
        node_runs: { orderBy: { created_at: 'asc' } },
      },
    })
    if (!run) {
      throw new HttpDetailException(HttpStatus.NOT_FOUND, 'Workflow run not found')
    }

    return {
      ...this.serializeRun(run),
      workflow_name: run.workflow.name,
      node_runs: run.node_runs.map((nodeRun) => ({
        id: nodeRun.id,
        run_id: nodeRun.run_id,
        node_id: nodeRun.node_id,
        node_type: nodeRun.node_type,
        status: nodeRun.status,
        input: nodeRun.input,
        output: nodeRun.output,
        error: nodeRun.error,
        attempt: nodeRun.attempt,
        started_at: nodeRun.started_at?.toISOString() ?? null,
        finished_at: nodeRun.finished_at?.toISOString() ?? null,
        created_at: nodeRun.created_at.toISOString(),
      })),
    }
  }

  private serializeRun(run: {
    id: string
    workflow_id: string
    workflow_version_id: string
    status: string
    trigger_type: string
    is_test: boolean
    trigger_input: Prisma.JsonValue
    output: Prisma.JsonValue | null
    error: string | null
    started_at: Date | null
    finished_at: Date | null
    created_at: Date
  }) {
    return {
      id: run.id,
      workflow_id: run.workflow_id,
      workflow_version_id: run.workflow_version_id,
      status: run.status,
      trigger_type: run.trigger_type,
      is_test: run.is_test,
      trigger_input: run.trigger_input,
      output: run.output,
      error: run.error,
      started_at: run.started_at?.toISOString() ?? null,
      finished_at: run.finished_at?.toISOString() ?? null,
      created_at: run.created_at.toISOString(),
    }
  }
}
