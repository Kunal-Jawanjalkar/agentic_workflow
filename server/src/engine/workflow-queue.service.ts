import { InjectQueue } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { Queue } from 'bullmq'

import {
  DEFAULT_NODE_BACKOFF_MS,
  DEFAULT_NODE_JOB_ATTEMPTS,
  EXECUTE_NODE_JOB,
  NodeJobPayload,
  SCHEDULED_TRIGGER_JOB,
  ScheduleJobPayload,
  WORKFLOW_NODES_QUEUE,
  WORKFLOW_SCHEDULES_QUEUE,
} from './queue.constants'

function nodeJobId(runId: string, nodeId: string): string {
  return `${runId}__${nodeId}`
}

function scheduleJobId(workflowId: string): string {
  return `wf-schedule-${workflowId}`
}

@Injectable()
export class WorkflowQueueService {
  constructor(
    @InjectQueue(WORKFLOW_NODES_QUEUE)
    private readonly nodesQueue: Queue<NodeJobPayload>,
    @InjectQueue(WORKFLOW_SCHEDULES_QUEUE)
    private readonly schedulesQueue: Queue<ScheduleJobPayload>,
  ) {}

  async enqueueNode(payload: NodeJobPayload): Promise<void> {
    await this.nodesQueue.add(EXECUTE_NODE_JOB, payload, {
      jobId: nodeJobId(payload.runId, payload.nodeId),
      attempts: DEFAULT_NODE_JOB_ATTEMPTS,
      backoff: {
        type: 'exponential',
        delay: DEFAULT_NODE_BACKOFF_MS,
      },
      removeOnComplete: 1000,
      removeOnFail: 1000,
    })
  }

  async syncSchedule(payload: ScheduleJobPayload): Promise<{ scheduleId: string }> {
    const schedulerId = scheduleJobId(payload.workflowId)
    await this.schedulesQueue.upsertJobScheduler(
      schedulerId,
      {
        pattern: payload.cron,
        tz: payload.timezone,
      },
      {
        name: SCHEDULED_TRIGGER_JOB,
        data: payload,
      },
    )
    return { scheduleId: schedulerId }
  }

  async deleteSchedule(workflowId: string): Promise<void> {
    await this.schedulesQueue.removeJobScheduler(scheduleJobId(workflowId))
  }
}
