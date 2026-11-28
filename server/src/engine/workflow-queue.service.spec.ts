import { Queue } from 'bullmq'

import {
  DEFAULT_NODE_BACKOFF_MS,
  DEFAULT_NODE_JOB_ATTEMPTS,
  EXECUTE_NODE_JOB,
  SCHEDULED_TRIGGER_JOB,
} from './queue.constants'
import { WorkflowQueueService } from './workflow-queue.service'

describe('WorkflowQueueService', () => {
  const nodesQueue = { add: jest.fn() }
  const schedulesQueue = {
    upsertJobScheduler: jest.fn(),
    removeJobScheduler: jest.fn(),
  }

  let service: WorkflowQueueService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new WorkflowQueueService(
      nodesQueue as unknown as Queue,
      schedulesQueue as unknown as Queue,
    )
  })

  it('enqueues node jobs with 3 attempts and exponential backoff', async () => {
    await service.enqueueNode({
      runId: 'run-1',
      ownerId: 'user-1',
      workflowId: 'wf-1',
      workflowVersionId: 'ver-1',
      nodeId: 'trigger-1',
    })

    expect(nodesQueue.add).toHaveBeenCalledWith(
      EXECUTE_NODE_JOB,
      {
        runId: 'run-1',
        ownerId: 'user-1',
        workflowId: 'wf-1',
        workflowVersionId: 'ver-1',
        nodeId: 'trigger-1',
      },
      expect.objectContaining({
        jobId: 'run-1__trigger-1',
        attempts: DEFAULT_NODE_JOB_ATTEMPTS,
        backoff: {
          type: 'exponential',
          delay: DEFAULT_NODE_BACKOFF_MS,
        },
      }),
    )
  })

  it('upserts and removes BullMQ job schedulers for workflows', async () => {
    const result = await service.syncSchedule({
      ownerId: 'user-1',
      workflowId: 'wf-1',
      cron: '*/5 * * * *',
      timezone: 'UTC',
    })

    expect(result).toEqual({ scheduleId: 'wf-schedule-wf-1' })
    expect(schedulesQueue.upsertJobScheduler).toHaveBeenCalledWith(
      'wf-schedule-wf-1',
      { pattern: '*/5 * * * *', tz: 'UTC' },
      {
        name: SCHEDULED_TRIGGER_JOB,
        data: {
          ownerId: 'user-1',
          workflowId: 'wf-1',
          cron: '*/5 * * * *',
          timezone: 'UTC',
        },
      },
    )

    await service.deleteSchedule('wf-1')
    expect(schedulesQueue.removeJobScheduler).toHaveBeenCalledWith('wf-schedule-wf-1')
  })
})
