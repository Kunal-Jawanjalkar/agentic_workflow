import { Job } from 'bullmq'

import { PrismaService } from '../prisma/prisma.service'

import { ScheduleJobPayload } from './queue.constants'
import { WorkflowQueueService } from './workflow-queue.service'
import { WorkflowScheduleProcessor } from './workflow-schedule.processor'

describe('WorkflowScheduleProcessor', () => {
  const prisma = {
    workflow: { findFirst: jest.fn() },
    trigger: { findFirst: jest.fn() },
    workflowVersion: { findUnique: jest.fn() },
    workflowRun: { create: jest.fn() },
  }

  const workflowQueue = {
    enqueueNode: jest.fn(),
  }

  let processor: WorkflowScheduleProcessor

  beforeEach(() => {
    jest.clearAllMocks()
    processor = new WorkflowScheduleProcessor(
      prisma as unknown as PrismaService,
      workflowQueue as unknown as WorkflowQueueService,
    )
  })

  it('skips execution if workflow is draft or has no enabled scheduler trigger', async () => {
    prisma.workflow.findFirst.mockResolvedValue({
      id: 'wf-1',
      owner_id: 'user-1',
      status: 'draft',
      current_version_id: 'ver-1',
    })

    const result = await processor.process({
      data: { ownerId: 'user-1', workflowId: 'wf-1', cron: '*/5 * * * *', timezone: 'UTC' },
    } as unknown as Job<ScheduleJobPayload>)

    expect(result).toBeNull()
    expect(workflowQueue.enqueueNode).not.toHaveBeenCalled()
  })

  it('initiates a run from the enabled scheduler row in triggers table', async () => {
    prisma.workflow.findFirst.mockResolvedValue({
      id: 'wf-1',
      owner_id: 'user-1',
      status: 'active',
      current_version_id: 'ver-1',
    })
    prisma.trigger.findFirst.mockResolvedValue({
      id: 'trig-1',
      workflow_id: 'wf-1',
      type: 'scheduler',
      config: { cron: '*/5 * * * *', timezone: 'Asia/Kolkata' },
      is_enabled: true,
    })
    prisma.workflowVersion.findUnique.mockResolvedValue({
      id: 'ver-1',
      workflow_id: 'wf-1',
      graph: {
        nodes: [{ id: 't1', data: { type: 'trigger', version: 1, config: { trigger_type: 'scheduler' } } }],
        edges: [],
      },
    })
    prisma.workflowRun.create.mockResolvedValue({ id: 'run-sched-1' })

    const result = await processor.process({
      data: { ownerId: 'user-1', workflowId: 'wf-1', cron: '*/5 * * * *', timezone: 'UTC' },
    } as unknown as Job<ScheduleJobPayload>)

    expect(result).toEqual({ runId: 'run-sched-1' })
    expect(prisma.trigger.findFirst).toHaveBeenCalledWith({
      where: { workflow_id: 'wf-1', type: 'scheduler', is_enabled: true },
    })
    expect(workflowQueue.enqueueNode).toHaveBeenCalledWith({
      runId: 'run-sched-1',
      ownerId: 'user-1',
      workflowId: 'wf-1',
      workflowVersionId: 'ver-1',
      nodeId: 't1',
    })
  })
})
