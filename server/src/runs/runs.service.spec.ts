import { Test, TestingModule } from '@nestjs/testing'

import { HttpDetailException } from '../common/http-detail.exception'
import { TemporalService } from '../engine/temporal.service'
import { TriggerNodeExecutor } from '../nodes/trigger-node'
import { PrismaService } from '../prisma/prisma.service'

import { RunsService } from './runs.service'

describe('RunsService', () => {
  let service: RunsService

  const prisma = {
    workflow: { findFirst: jest.fn() },
    workflowVersion: { findUnique: jest.fn() },
    workflowRun: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  }

  const temporalService = {
    startWorkflowRun: jest.fn(),
    syncSchedule: jest.fn(),
    deleteSchedule: jest.fn(),
  }

  const baseWorkflow = {
    id: 'wf-1',
    owner_id: 'user-1',
    name: 'Test flow',
    current_version_id: 'ver-1',
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RunsService,
        TriggerNodeExecutor,
        { provide: PrismaService, useValue: prisma },
        { provide: TemporalService, useValue: temporalService },
      ],
    }).compile()

    service = module.get<RunsService>(RunsService)
  })

  it('creates a WorkflowRun and starts Temporal execution for manual runs', async () => {
    prisma.workflow.findFirst.mockResolvedValue(baseWorkflow)
    prisma.workflowVersion.findUnique.mockResolvedValue({
      id: 'ver-1',
      workflow_id: 'wf-1',
      graph: {
        nodes: [{ id: 't1', data: { type: 'trigger', version: 1, config: { trigger_type: 'manual' } } }],
        edges: [],
      },
    })
    prisma.workflowRun.create.mockResolvedValue({
      id: 'run-1',
      workflow_id: 'wf-1',
      workflow_version_id: 'ver-1',
      status: 'pending',
      trigger_type: 'manual',
      trigger_input: { text: 'hello' },
      output: null,
      error: null,
      temporal_workflow_id: null,
      temporal_run_id: null,
      started_at: null,
      finished_at: null,
      created_at: new Date('2026-11-26T17:00:00.000Z'),
    })
    temporalService.startWorkflowRun.mockResolvedValue({
      temporalWorkflowId: 'wf-run-run-1',
      temporalRunId: 'temporal-exec-1',
    })
    prisma.workflowRun.update.mockResolvedValue({
      id: 'run-1',
      workflow_id: 'wf-1',
      workflow_version_id: 'ver-1',
      status: 'pending',
      trigger_type: 'manual',
      trigger_input: { text: 'hello' },
      output: null,
      error: null,
      temporal_workflow_id: 'wf-run-run-1',
      temporal_run_id: 'temporal-exec-1',
      started_at: null,
      finished_at: null,
      created_at: new Date('2026-11-26T17:00:00.000Z'),
    })

    const result = await service.triggerManualRun('user-1', 'wf-1', { text: 'hello' })

    expect(temporalService.startWorkflowRun).toHaveBeenCalledWith(
      expect.objectContaining({
        runId: 'run-1',
        ownerId: 'user-1',
        workflowId: 'wf-1',
        triggerType: 'manual',
      }),
    )
    expect(result.temporal_workflow_id).toBe('wf-run-run-1')
  })

  it('rejects webhook calls when secret does not match', async () => {
    prisma.workflow.findFirst.mockResolvedValue(baseWorkflow)
    prisma.workflowVersion.findUnique.mockResolvedValue({
      id: 'ver-1',
      workflow_id: 'wf-1',
      graph: {
        nodes: [
          {
            id: 't1',
            data: {
              type: 'trigger',
              version: 1,
              config: { trigger_type: 'webhook', webhook_method: 'POST', webhook_secret: 'top-secret' },
            },
          },
        ],
        edges: [],
      },
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

  it('syncs a Temporal schedule when trigger_type is scheduler', async () => {
    prisma.workflow.findFirst.mockResolvedValue(baseWorkflow)
    prisma.workflowVersion.findUnique.mockResolvedValue({
      id: 'ver-1',
      workflow_id: 'wf-1',
      graph: {
        nodes: [
          {
            id: 't1',
            data: {
              type: 'trigger',
              version: 1,
              config: { trigger_type: 'scheduler', cron: '*/5 * * * *', timezone: 'UTC' },
            },
          },
        ],
        edges: [],
      },
    })
    temporalService.syncSchedule.mockResolvedValue({ scheduleId: 'wf-schedule-wf-1' })

    const result = await service.syncWorkflowSchedule('user-1', 'wf-1')

    expect(temporalService.syncSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: 'user-1',
        workflowId: 'wf-1',
        cron: '*/5 * * * *',
        timezone: 'UTC',
      }),
    )
    expect(result).toEqual({ synced: true, schedule_id: 'wf-schedule-wf-1' })
  })
})
