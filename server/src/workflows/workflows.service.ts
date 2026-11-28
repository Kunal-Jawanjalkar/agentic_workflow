import { HttpStatus, Injectable } from '@nestjs/common'
import { createHash } from 'node:crypto'

import { HttpDetailException } from '../common/http-detail.exception'
import { findTriggerNode, parseWorkflowGraph } from '../engine/workflow-graph.helpers'
import { WorkflowQueueService } from '../engine/workflow-queue.service'
import { Prisma } from '../generated/prisma/client'
import { TriggerNodeExecutor } from '../nodes/trigger-node'
import { PrismaService } from '../prisma/prisma.service'

import { CreateWorkflowDto, UpdateWorkflowDto, WorkflowGraphDto } from './workflows.dto'

export function hashTriggerSecret(secret: string): string {
  return createHash('sha256').update(secret, 'utf8').digest('hex')
}

const EMPTY_GRAPH: WorkflowGraphDto = { nodes: [], edges: [] }

function triggerTypeFromGraph(graph: Prisma.JsonValue): string | null {
  if (!graph || typeof graph !== 'object' || Array.isArray(graph)) {
    return null
  }
  const nodes = (graph as { nodes?: unknown }).nodes
  if (!Array.isArray(nodes)) {
    return null
  }
  for (const node of nodes) {
    if (!node || typeof node !== 'object') {
      continue
    }
    const data = (node as { data?: unknown }).data
    if (!data || typeof data !== 'object') {
      continue
    }
    const nodeType = (data as { type?: unknown }).type
    if (nodeType !== 'trigger') {
      continue
    }
    const config = (data as { config?: unknown }).config
    if (config && typeof config === 'object' && !Array.isArray(config)) {
      const triggerType = (config as { trigger_type?: unknown }).trigger_type
      if (typeof triggerType === 'string' && triggerType.length > 0) {
        return triggerType
      }
    }
    return 'manual'
  }
  return null
}

@Injectable()
export class WorkflowsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly triggerNode: TriggerNodeExecutor,
    private readonly workflowQueue: WorkflowQueueService,
  ) {}

  private async currentVersion(workflowId: string, currentVersionId: string | null) {
    if (currentVersionId == null) {
      throw new HttpDetailException(500, 'Workflow has no current version')
    }
    const version = await this.prisma.workflowVersion.findUnique({
      where: { id: currentVersionId },
    })
    if (version == null || version.workflow_id !== workflowId) {
      throw new HttpDetailException(500, 'Workflow has no current version')
    }
    return version
  }

  private async workflowResponse(workflow: {
    id: string
    name: string
    description: string | null
    status: string
    current_version_id: string | null
    updated_at: Date
  }) {
    const version = await this.currentVersion(workflow.id, workflow.current_version_id)
    return {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      status: workflow.status,
      version: version.version,
      graph: version.graph,
      updated_at: workflow.updated_at.toISOString(),
    }
  }

  private async workflowSummary(workflow: {
    id: string
    name: string
    description: string | null
    status: string
    current_version_id: string | null
    updated_at: Date
  }) {
    const version = await this.currentVersion(workflow.id, workflow.current_version_id)
    return {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      status: workflow.status,
      version: version.version,
      trigger_type: triggerTypeFromGraph(version.graph),
      updated_at: workflow.updated_at.toISOString(),
    }
  }

  async listForOwner(ownerId: string) {
    const workflows = await this.prisma.workflow.findMany({
      where: { owner_id: ownerId },
      orderBy: { updated_at: 'desc' },
    })
    const summaries = await Promise.all(workflows.map((w) => this.workflowSummary(w)))
    return { workflows: summaries }
  }

  async getForOwner(ownerId: string, workflowId: string) {
    const workflow = await this.prisma.workflow.findFirst({
      where: { id: workflowId, owner_id: ownerId },
    })
    if (workflow == null) {
      throw new HttpDetailException(404, 'Workflow not found')
    }
    return this.workflowResponse(workflow)
  }

  async createDraft(ownerId: string, body: CreateWorkflowDto) {
    const workflow = await this.prisma.$transaction(async (tx) => {
      const created = await tx.workflow.create({
        data: {
          owner_id: ownerId,
          name: body.name,
          description: body.description,
          status: 'draft',
        },
      })
      const version = await tx.workflowVersion.create({
        data: {
          workflow_id: created.id,
          version: 1,
          graph: EMPTY_GRAPH as unknown as Prisma.InputJsonValue,
          settings: {},
          created_by: ownerId,
        },
      })
      return tx.workflow.update({
        where: { id: created.id },
        data: {
          current_version_id: version.id,
          updated_at: new Date(),
        },
      })
    })
    return this.workflowResponse(workflow)
  }

  async updateDraft(ownerId: string, workflowId: string, body: UpdateWorkflowDto) {
    const existing = await this.prisma.workflow.findFirst({
      where: { id: workflowId, owner_id: ownerId },
    })
    if (existing == null) {
      throw new HttpDetailException(404, 'Workflow not found')
    }

    const touchedGraph = body.graph != null
    const touchedMeta = body.name != null || body.description !== undefined

    if (touchedGraph) {
      const version = await this.currentVersion(existing.id, existing.current_version_id)
      await this.prisma.workflowVersion.update({
        where: { id: version.id },
        data: { graph: body.graph as unknown as Prisma.InputJsonValue },
      })
    }

    if (touchedMeta || touchedGraph) {
      const updated = await this.prisma.workflow.update({
        where: { id: existing.id },
        data: {
          ...(body.name != null ? { name: body.name } : {}),
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(touchedGraph || touchedMeta ? { updated_at: new Date() } : {}),
        },
      })
      return this.workflowResponse(updated)
    }

    return this.workflowResponse(existing)
  }

  async publishWorkflow(ownerId: string, workflowId: string) {
    const existing = await this.prisma.workflow.findFirst({
      where: { id: workflowId, owner_id: ownerId },
    })
    if (existing == null) {
      throw new HttpDetailException(HttpStatus.NOT_FOUND, 'Workflow not found')
    }

    const version = await this.currentVersion(existing.id, existing.current_version_id)
    const graph = parseWorkflowGraph(version.graph)
    const triggerNode = findTriggerNode(graph)
    const triggerConfig = this.triggerNode.validateConfig(triggerNode.data.config)

    if (triggerConfig.trigger_type === 'scheduler' && !triggerConfig.cron) {
      throw new HttpDetailException(
        HttpStatus.BAD_REQUEST,
        'Scheduler trigger requires a cron expression before publishing',
      )
    }

    const { webhook_secret, ...publicConfig } = triggerConfig
    const secretHash = webhook_secret ? hashTriggerSecret(webhook_secret) : null

    const published = await this.prisma.$transaction(async (tx) => {
      await tx.trigger.deleteMany({
        where: { workflow_id: existing.id },
      })

      await tx.trigger.create({
        data: {
          workflow_id: existing.id,
          type: triggerConfig.trigger_type,
          config: publicConfig as Prisma.InputJsonValue,
          secret_hash: secretHash,
          is_enabled: true,
        },
      })

      return tx.workflow.update({
        where: { id: existing.id },
        data: {
          status: 'active',
          updated_at: new Date(),
        },
      })
    })

    if (triggerConfig.trigger_type === 'scheduler' && triggerConfig.cron) {
      await this.workflowQueue.syncSchedule({
        ownerId,
        workflowId: existing.id,
        cron: triggerConfig.cron,
        timezone: triggerConfig.timezone ?? 'UTC',
      })
    } else {
      await this.workflowQueue.deleteSchedule(existing.id)
    }

    return this.workflowResponse(published)
  }

  async unpublishWorkflow(ownerId: string, workflowId: string) {
    const existing = await this.prisma.workflow.findFirst({
      where: { id: workflowId, owner_id: ownerId },
    })
    if (existing == null) {
      throw new HttpDetailException(HttpStatus.NOT_FOUND, 'Workflow not found')
    }

    const unpublished = await this.prisma.$transaction(async (tx) => {
      await tx.trigger.updateMany({
        where: { workflow_id: existing.id },
        data: { is_enabled: false },
      })

      return tx.workflow.update({
        where: { id: existing.id },
        data: {
          status: 'draft',
          updated_at: new Date(),
        },
      })
    })

    await this.workflowQueue.deleteSchedule(existing.id)

    return this.workflowResponse(unpublished)
  }
}