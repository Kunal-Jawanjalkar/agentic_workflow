import { Test, TestingModule } from '@nestjs/testing'

import { HttpDetailException } from '../common/http-detail.exception'
import { WorkflowQueueService } from '../engine/workflow-queue.service'
import { TriggerNodeExecutor } from '../nodes/trigger-node'
import { PrismaService } from '../prisma/prisma.service'
import { hashTriggerSecret } from '../workflows/workflows.service'

import { RunsService } from './runs.service'

describe('RunsService', () => {
  let service: RunsService

  const prisma = {
    workflow: { findFirst: jest.fn() },
    workflowVersion: { findUnique: jest.fn() },
    trigger: { findFirst: jest.fn() },
    workflowRun: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  }

  const workflowQueue = {
    enqueueNode: jest.fn(),
    syncSchedule: jest.fn(),
    deleteSchedule: jest.fn(),
  }

  const draftWorkflow = {
    id: 'wf-1',
    owner_id: 'user-1',
    name: 'Test flow',
    status: 'draft',
    current_version_id: 'ver-1',
  }

  const activeWorkflow = {
    ...draftWorkflow,
    status: 'active',
  }

  const manualVersion = {
    id: 'ver-1',
    workflow_id: 'wf-1',
    graph: {
      nodes: [
        { id: 't1', data: { type: 'trigger', version: 1, config: { trigger_type: 'manual' } } },
      ],
      edges: [],
    },
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RunsService,
        TriggerNodeExecutor,
        { provide: PrismaService, useValue: prisma },
        { provide: WorkflowQueueService, useValue: workflowQueue },
      ],
    }).compile()

    service = module.get<RunsService>(RunsService)
  })

  it('rejects running a draft workflow when test_mode is false', async () => {
    prisma.workflow.findFirst.mockResolvedValue(draftWorkflow)
    prisma.workflowVersion.findUnique.mockResolvedValue(manualVersion)

    await expect(service.triggerManualRun('user-1', 'wf-1', {}, false)).rejects.toThrow(
      HttpDetailException,
    )
    expect(workflowQueue.enqueueNode).not.toHaveBeenCalled()
  })

  it('allows running a draft workflow in test_mode', async () => {
    prisma.workflow.findFirst.mockResolvedValue(draftWorkflow)
    prisma.workflowVersion.findUnique.mockResolvedValue(manualVersion)
    prisma.workflowRun.create.mockResolvedValue({
      id: 'run-test-1',
      workflow_id: 'wf-1',
      workflow_version_id: 'ver-1',
      status: 'pending',
      trigger_type: 'manual',
      is_test: true,
      trigger_input: { message: 'hello' },
      output: null,
      error: null,
      started_at: null,
      finished_at: null,
      created_at: new Date('2026-11-28T09:00:00.000Z'),
    })

    const result = await service.triggerManualRun('user-1', 'wf-1', { message: 'hello' }, true)

    expect(result.is_test).toBe(true)
    expect(workflowQueue.enqueueNode).toHaveBeenCalledWith({
      runId: 'run-test-1',
      ownerId: 'user-1',
      workflowId: 'wf-1',
      workflowVersionId: 'ver-1',
      nodeId: 't1',
    })
  })

  it('refers to triggers table when running a published workflow', async () => {
    prisma.workflow.findFirst.mockResolvedValue(activeWorkflow)
    prisma.workflowVersion.findUnique.mockResolvedValue(manualVersion)
    prisma.trigger.findFirst.mockResolvedValue({
      id: 'trig-1',
      workflow_id: 'wf-1',
      type: 'manual',
      config: { trigger_type: 'manual' },
      secret_hash: null,
      is_enabled: true,
    })
    prisma.workflowRun.create.mockResolvedValue({
      id: 'run-prod-1',
      workflow_id: 'wf-1',
      workflow_version_id: 'ver-1',
      status: 'pending',
      trigger_type: 'manual',
      is_test: false,
      trigger_input: {},
      output: null,
      error: null,
      started_at: null,
      finished_at: null,
      created_at: new Date('2026-11-28T09:00:00.000Z'),
    })

    const result = await service.triggerManualRun('user-1', 'wf-1', {}, false)

    expect(prisma.trigger.findFirst).toHaveBeenCalledWith({
      where: { workflow_id: 'wf-1', is_enabled: true },
    })
    expect(result.is_test).toBe(false)
  })

  it('rejects webhook calls when workflow is draft or secret hash does not match', async () => {
    prisma.workflow.findFirst.mockResolvedValue(draftWorkflow)
    prisma.workflowVersion.findUnique.mockResolvedValue(manualVersion)

    await expect(
      service.triggerWebhookRun('wf-1', {
        method: 'POST',
        headers: {},
        query: {},
        body: {},
      }),
    ).rejects.toThrow(HttpDetailException)

    prisma.workflow.findFirst.mockResolvedValue(activeWorkflow)
    prisma.workflowVersion.findUnique.mockResolvedValue({
      id: 'ver-1',
      workflow_id: 'wf-1',
      graph: {
        nodes: [{ id: 't1', data: { type: 'trigger', version: 1, config: { trigger_type: 'webhook' } } }],
        edges: [],
      },
    })
    prisma.trigger.findFirst.mockResolvedValue({
      id: 'trig-2',
      workflow_id: 'wf-1',
      type: 'webhook',
      config: { trigger_type: 'webhook', webhook_method: 'POST' },
      secret_hash: hashTriggerSecret('top-secret'),
      is_enabled: true,
    })

    await expect(
      service.triggerWebhookRun('wf-1', {
        method: 'POST',
        headers: { 'x-webhook-secret': 'wrong' },
        query: {},
        body: {},
      }),
    ).rejects.toThrow(HttpDetailException)
  })

  it('syncs a BullMQ schedule using the enabled trigger in triggers table', async () => {
    prisma.workflow.findFirst.mockResolvedValue(activeWorkflow)
    prisma.workflowVersion.findUnique.mockResolvedValue(manualVersion)
    prisma.trigger.findFirst.mockResolvedValue({
      id: 'trig-3',
      workflow_id: 'wf-1',
      type: 'scheduler',
      config: { trigger_type: 'scheduler', cron: '*/5 * * * *', timezone: 'UTC' },
      secret_hash: null,
      is_enabled: true,
    })
    workflowQueue.syncSchedule.mockResolvedValue({ scheduleId: 'wf-schedule-wf-1' })

    const result = await service.syncWorkflowSchedule('user-1', 'wf-1')

    expect(workflowQueue.syncSchedule).toHaveBeenCalledWith({
      ownerId: 'user-1',
      workflowId: 'wf-1',
      cron: '*/5 * * * *',
      timezone: 'UTC',
    })
    expect(result).toEqual({ synced: true, schedule_id: 'wf-schedule-wf-1' })
  })
})
