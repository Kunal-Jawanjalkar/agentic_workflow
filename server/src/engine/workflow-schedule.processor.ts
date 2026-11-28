import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'

import { Prisma } from '../generated/prisma/client'
import { PrismaService } from '../prisma/prisma.service'

import { ScheduleJobPayload, WORKFLOW_SCHEDULES_QUEUE } from './queue.constants'
import { findTriggerNode, parseWorkflowGraph } from './workflow-graph.helpers'
import { WorkflowQueueService } from './workflow-queue.service'

@Processor(WORKFLOW_SCHEDULES_QUEUE)
export class WorkflowScheduleProcessor extends WorkerHost {
  private readonly logger = new Logger(WorkflowScheduleProcessor.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowQueue: WorkflowQueueService,
  ) {
    super()
  }

  async process(job: Job<ScheduleJobPayload>): Promise<{ runId: string } | null> {
    const { ownerId, workflowId } = job.data

    const workflow = await this.prisma.workflow.findFirst({
      where: { id: workflowId, owner_id: ownerId },
    })
    if (!workflow || !workflow.current_version_id || workflow.status !== 'active') {
      this.logger.warn(
        `Skipping schedule for workflow "${workflowId}" (missing or not active)`,
      )
      return null
    }

    const publishedTrigger = await this.prisma.trigger.findFirst({
      where: {
        workflow_id: workflow.id,
        type: 'scheduler',
        is_enabled: true,
      },
    })
    if (!publishedTrigger) {
      this.logger.warn(`Skipping schedule for workflow "${workflowId}" (no enabled scheduler trigger)`)
      return null
    }

    const version = await this.prisma.workflowVersion.findUnique({
      where: { id: workflow.current_version_id },
    })
    if (!version || version.workflow_id !== workflow.id) {
      return null
    }

    const graph = parseWorkflowGraph(version.graph)
    const triggerNode = findTriggerNode(graph)

    const config =
      typeof publishedTrigger.config === 'object' &&
      publishedTrigger.config !== null &&
      !Array.isArray(publishedTrigger.config)
        ? (publishedTrigger.config as Record<string, unknown>)
        : {}

    const triggerInput = {
      cron: typeof config.cron === 'string' ? config.cron : job.data.cron,
      timezone: typeof config.timezone === 'string' ? config.timezone : job.data.timezone,
      scheduled_at: new Date().toISOString(),
    }

    const run = await this.prisma.workflowRun.create({
      data: {
        workflow_id: workflow.id,
        workflow_version_id: version.id,
        owner_id: ownerId,
        status: 'pending',
        trigger_type: 'scheduler',
        is_test: false,
        trigger_input: triggerInput as Prisma.InputJsonValue,
      },
    })

    await this.workflowQueue.enqueueNode({
      runId: run.id,
      ownerId,
      workflowId: workflow.id,
      workflowVersionId: version.id,
      nodeId: triggerNode.id,
    })

    return { runId: run.id }
  }
}
