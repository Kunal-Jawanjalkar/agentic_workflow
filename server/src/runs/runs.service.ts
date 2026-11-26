import { HttpStatus, Injectable } from '@nestjs/common'
import { timingSafeEqual } from 'node:crypto'

import { HttpDetailException } from '../common/http-detail.exception'
import { TemporalService } from '../engine/temporal.service'
import type { WorkflowGraphPayload } from '../engine/temporal/workflow'
import { Prisma } from '../generated/prisma/client'
import { TriggerNodeConfig, TriggerNodeExecutor } from '../nodes/trigger-node'
import { PrismaService } from '../prisma/prisma.service'

function parseGraphPayload(graph: Prisma.JsonValue): WorkflowGraphPayload {
  if (!graph || typeof graph !== 'object' || Array.isArray(graph)) {
    throw new HttpDetailException(HttpStatus.BAD_REQUEST, 'Workflow graph is empty or invalid')
  }
  const rawNodes = (graph as { nodes?: unknown }).nodes
  const rawEdges = (graph as { edges?: unknown }).edges
  if (!Array.isArray(rawNodes) || rawNodes.length === 0) {
    throw new HttpDetailException(HttpStatus.BAD_REQUEST, 'Workflow graph has no nodes to run')
  }
  return {
    nodes: rawNodes as WorkflowGraphPayload['nodes'],
    edges: Array.isArray(rawEdges) ? (rawEdges as WorkflowGraphPayload['edges']) : [],
  }
}

function secretsEqual(expected: string, actual: string): boolean {
  const expectedBuf = Buffer.from(expected, 'utf8')
  const actualBuf = Buffer.from(actual, 'utf8')
  if (expectedBuf.length !== actualBuf.length) {
    return false
  }
  return timingSafeEqual(expectedBuf, actualBuf)
}

@Injectable()
export class RunsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly temporalService: TemporalService,
    private readonly triggerNode: TriggerNodeExecutor,
  ) {}

  private extractTriggerConfig(graph: WorkflowGraphPayload): TriggerNodeConfig {
    const trigger = graph.nodes.find((node) => node.data?.type === 'trigger')
    if (!trigger) {
      throw new HttpDetailException(
        HttpStatus.BAD_REQUEST,
        'Workflow must contain a Trigger node to run',
      )
    }
    return this.triggerNode.validateConfig(trigger.data.config)
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

  private async startRun(params: {
    workflowId: string
    workflowVersionId: string
    ownerId: string
    triggerType: string
    graph: WorkflowGraphPayload
    triggerInput: Record<string, unknown>
  }) {
    const run = await this.prisma.workflowRun.create({
      data: {
        workflow_id: params.workflowId,
        workflow_version_id: params.workflowVersionId,
        owner_id: params.ownerId,
        status: 'pending',
        trigger_type: params.triggerType,
        trigger_input: params.triggerInput as Prisma.InputJsonValue,
      },
    })

    try {
      const started = await this.temporalService.startWorkflowRun({
        runId: run.id,
        ownerId: params.ownerId,
        workflowId: params.workflowId,
        workflowVersionId: params.workflowVersionId,
        triggerType: params.triggerType,
        graph: params.graph,
        triggerInput: params.triggerInput,
      })

      const updated = await this.prisma.workflowRun.update({
        where: { id: run.id },
        data: {
          temporal_workflow_id: started.temporalWorkflowId,
          temporal_run_id: started.temporalRunId,
        },
      })
      return this.serializeRun(updated)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      await this.prisma.workflowRun.update({
        where: { id: run.id },
        data: {
          status: 'failed',
          error: message,
          finished_at: new Date(),
        },
      })
      throw error
    }
  }

  async triggerManualRun(
    ownerId: string,
    workflowId: string,
    input: Record<string, unknown> = {},
  ) {
    const { workflow, version } = await this.loadWorkflowWithCurrentVersion(workflowId, ownerId)
    const graph = parseGraphPayload(version.graph)
    const triggerConfig = this.extractTriggerConfig(graph)

    return this.startRun({
      workflowId: workflow.id,
      workflowVersionId: version.id,
      ownerId,
      triggerType: triggerConfig.trigger_type,
      graph,
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
    const graph = parseGraphPayload(version.graph)
    const triggerConfig = this.extractTriggerConfig(graph)

    if (triggerConfig.trigger_type !== 'webhook') {
      throw new HttpDetailException(
        HttpStatus.BAD_REQUEST,
        'Workflow trigger is not configured as a webhook',
      )
    }

    const expectedMethod = triggerConfig.webhook_method ?? 'POST'
    if (request.method.toUpperCase() !== expectedMethod.toUpperCase()) {
      throw new HttpDetailException(
        HttpStatus.METHOD_NOT_ALLOWED,
        `Webhook expects ${expectedMethod} requests`,
      )
    }

    if (triggerConfig.webhook_secret) {
      const rawHeader = request.headers['x-webhook-secret']
      const provided = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader
      if (typeof provided !== 'string' || !secretsEqual(triggerConfig.webhook_secret, provided)) {
        throw new HttpDetailException(HttpStatus.UNAUTHORIZED, 'Invalid webhook secret')
      }
    }

    return this.startRun({
      workflowId: workflow.id,
      workflowVersionId: version.id,
      ownerId: workflow.owner_id,
      triggerType: 'webhook',
      graph,
      triggerInput: {
        method: request.method.toUpperCase(),
        headers: request.headers,
        query: request.query,
        body: request.body ?? null,
      },
    })
  }

  async syncWorkflowSchedule(ownerId: string, workflowId: string) {
    const { workflow, version } = await this.loadWorkflowWithCurrentVersion(workflowId, ownerId)
    const graph = parseGraphPayload(version.graph)
    const triggerConfig = this.extractTriggerConfig(graph)

    if (triggerConfig.trigger_type !== 'scheduler') {
      await this.temporalService.deleteSchedule(workflow.id)
      return { synced: false, schedule_id: null }
    }

    if (!triggerConfig.cron) {
      throw new HttpDetailException(
        HttpStatus.BAD_REQUEST,
        'Scheduler trigger requires a cron expression',
      )
    }

    const result = await this.temporalService.syncSchedule({
      ownerId,
      workflowId: workflow.id,
      workflowVersionId: version.id,
      graph,
      cron: triggerConfig.cron,
      timezone: triggerConfig.timezone ?? 'UTC',
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
    trigger_input: Prisma.JsonValue
    output: Prisma.JsonValue | null
    error: string | null
    temporal_workflow_id: string | null
    temporal_run_id: string | null
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
      trigger_input: run.trigger_input,
      output: run.output,
      error: run.error,
      temporal_workflow_id: run.temporal_workflow_id,
      temporal_run_id: run.temporal_run_id,
      started_at: run.started_at?.toISOString() ?? null,
      finished_at: run.finished_at?.toISOString() ?? null,
      created_at: run.created_at.toISOString(),
    }
  }
}
