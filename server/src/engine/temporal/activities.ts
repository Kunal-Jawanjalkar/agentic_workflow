import { Prisma } from '../../generated/prisma/client'
import { NodeRegistryService } from '../../nodes/node-registry.service'
import { NodeExecutionResult } from '../../nodes/node.types'
import { PrismaService } from '../../prisma/prisma.service'

export interface ExecuteNodeActivityInput {
  ownerId: string
  workflowId: string
  executionId: string
  nodeId: string
  nodeType: string
  version: number
  config: Record<string, unknown>
  input: Record<string, unknown>
}

export function createWorkflowActivities(
  prisma: PrismaService,
  nodeRegistry: NodeRegistryService,
) {
  return {
    async ensureRunStarted(params: {
      runId?: string
      ownerId: string
      workflowId: string
      workflowVersionId: string
      triggerType: string
      triggerInput: Record<string, unknown>
      temporalWorkflowId: string
      temporalRunId: string
    }): Promise<string> {
      if (params.runId) {
        await prisma.workflowRun.update({
          where: { id: params.runId },
          data: {
            status: 'running',
            temporal_workflow_id: params.temporalWorkflowId,
            temporal_run_id: params.temporalRunId,
            started_at: new Date(),
          },
        })
        return params.runId
      }

      const created = await prisma.workflowRun.create({
        data: {
          workflow_id: params.workflowId,
          workflow_version_id: params.workflowVersionId,
          owner_id: params.ownerId,
          status: 'running',
          trigger_type: params.triggerType,
          trigger_input: params.triggerInput as Prisma.InputJsonValue,
          temporal_workflow_id: params.temporalWorkflowId,
          temporal_run_id: params.temporalRunId,
          started_at: new Date(),
        },
        select: { id: true },
      })
      return created.id
    },

    async executeNode(params: ExecuteNodeActivityInput): Promise<NodeExecutionResult> {
      const nodeRun = await prisma.nodeRun.create({
        data: {
          run_id: params.executionId,
          node_id: params.nodeId,
          node_type: params.nodeType,
          status: 'running',
          input: params.input as Prisma.InputJsonValue,
          started_at: new Date(),
        },
      })

      try {
        const executor = nodeRegistry.getExecutorOrThrow(params.nodeType, params.version)
        const config = executor.validateConfig
          ? executor.validateConfig(params.config)
          : params.config
        const result = await executor.execute(config, {
          ownerId: params.ownerId,
          workflowId: params.workflowId,
          executionId: params.executionId,
          nodeId: params.nodeId,
          input: params.input,
        })

        await prisma.nodeRun.update({
          where: { id: nodeRun.id },
          data: {
            status: result.status === 'waiting_approval' ? 'waiting_approval' : 'completed',
            output: result.output as Prisma.InputJsonValue,
            finished_at: new Date(),
          },
        })

        return result
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        await prisma.nodeRun.update({
          where: { id: nodeRun.id },
          data: {
            status: 'failed',
            error: message,
            finished_at: new Date(),
          },
        })
        throw error
      }
    },

    async markRunCompleted(params: {
      runId: string
      output: Record<string, unknown>
    }): Promise<void> {
      await prisma.workflowRun.update({
        where: { id: params.runId },
        data: {
          status: 'completed',
          output: params.output as Prisma.InputJsonValue,
          finished_at: new Date(),
        },
      })
    },

    async markRunFailed(params: { runId: string; error: string }): Promise<void> {
      await prisma.workflowRun.update({
        where: { id: params.runId },
        data: {
          status: 'failed',
          error: params.error,
          finished_at: new Date(),
        },
      })
    },
  }
}
