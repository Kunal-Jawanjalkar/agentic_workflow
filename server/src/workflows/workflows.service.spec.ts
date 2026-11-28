import { Test, TestingModule } from '@nestjs/testing'

import { HttpDetailException } from '../common/http-detail.exception'
import { WorkflowQueueService } from '../engine/workflow-queue.service'
import { TriggerNodeExecutor } from '../nodes/trigger-node'
import { PrismaService } from '../prisma/prisma.service'

import { hashTriggerSecret, WorkflowsService } from './workflows.service'

describe('WorkflowsService', () => {
  let service: WorkflowsService

  const tx = {
    trigger: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    workflow: {
      update: jest.fn(),
    },
  }

  const prisma = {
    workflow: {
      findFirst: jest.fn(),
    },
    workflowVersion: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(async (cb: (client: typeof tx) => unknown) => cb(tx)),
  }

  const workflowQueue = {
    syncSchedule: jest.fn(),
    deleteSchedule: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowsService,
        TriggerNodeExecutor,
        { provide: PrismaService, useValue: prisma },
        { provide: WorkflowQueueService, useValue: workflowQueue },
      ],
    }).compile()

    service = module.get<WorkflowsService>(WorkflowsService)
  })

  it('publishes a webhook workflow, hashes webhook_secret into triggers table, and clears schedules', async () => {
    const graph = {
      nodes: [
        {
          id: 't1',
          data: {
            type: 'trigger',
            version: 1,
            config: {
              trigger_type: 'webhook',
              webhook_method: 'POST',
              webhook_secret: 'my-secret',
            },
          },
        },
      ],
      edges: [],
    }
    prisma.workflow.findFirst.mockResolvedValue({
      id: 'wf-1',
      owner_id: 'user-1',
      name: 'Webhook flow',
      description: null,
      status: 'draft',
      current_version_id: 'ver-1',
      updated_at: new Date('2026-11-28T10:00:00.000Z'),
    })
    prisma.workflowVersion.findUnique.mockResolvedValue({
      id: 'ver-1',
      workflow_id: 'wf-1',
      version: 1,
      graph,
    })
    tx.workflow.update.mockResolvedValue({
      id: 'wf-1',
      name: 'Webhook flow',
      description: null,
      status: 'active',
      current_version_id: 'ver-1',
      updated_at: new Date('2026-11-28T10:05:00.000Z'),
    })

    const result = await service.publishWorkflow('user-1', 'wf-1')

    expect(tx.trigger.deleteMany).toHaveBeenCalledWith({ where: { workflow_id: 'wf-1' } })
    expect(tx.trigger.create).toHaveBeenCalledWith({
      data: {
        workflow_id: 'wf-1',
        type: 'webhook',
        config: {
          trigger_type: 'webhook',
          webhook_method: 'POST',
        },
        secret_hash: hashTriggerSecret('my-secret'),
        is_enabled: true,
      },
    })
    expect(workflowQueue.deleteSchedule).toHaveBeenCalledWith('wf-1')
    expect(result.status).toBe('active')
  })

  it('publishes a scheduler workflow and syncs BullMQ schedule', async () => {
    const graph = {
      nodes: [
        {
          id: 't1',
          data: {
            type: 'trigger',
            version: 1,
            config: {
              trigger_type: 'scheduler',
              cron: '*/5 * * * *',
              timezone: 'UTC',
            },
          },
        },
      ],
      edges: [],
    }
    prisma.workflow.findFirst.mockResolvedValue({
      id: 'wf-2',
      owner_id: 'user-1',
      name: 'Cron flow',
      description: null,
      status: 'draft',
      current_version_id: 'ver-2',
      updated_at: new Date('2026-11-28T10:00:00.000Z'),
    })
    prisma.workflowVersion.findUnique.mockResolvedValue({
      id: 'ver-2',
      workflow_id: 'wf-2',
      version: 1,
      graph,
    })
    tx.workflow.update.mockResolvedValue({
      id: 'wf-2',
      name: 'Cron flow',
      description: null,
      status: 'active',
      current_version_id: 'ver-2',
      updated_at: new Date('2026-11-28T10:05:00.000Z'),
    })

    await service.publishWorkflow('user-1', 'wf-2')

    expect(workflowQueue.syncSchedule).toHaveBeenCalledWith({
      ownerId: 'user-1',
      workflowId: 'wf-2',
      cron: '*/5 * * * *',
      timezone: 'UTC',
    })
  })

  it('rejects publishing a scheduler workflow without a cron expression', async () => {
    prisma.workflow.findFirst.mockResolvedValue({
      id: 'wf-3',
      owner_id: 'user-1',
      name: 'Bad cron flow',
      description: null,
      status: 'draft',
      current_version_id: 'ver-3',
      updated_at: new Date('2026-11-28T10:00:00.000Z'),
    })
    prisma.workflowVersion.findUnique.mockResolvedValue({
      id: 'ver-3',
      workflow_id: 'wf-3',
      version: 1,
      graph: {
        nodes: [{ id: 't1', data: { type: 'trigger', version: 1, config: { trigger_type: 'scheduler' } } }],
        edges: [],
      },
    })

    await expect(service.publishWorkflow('user-1', 'wf-3')).rejects.toThrow(
      HttpDetailException,
    )
  })

  it('unpublishes an active workflow, disables triggers, and removes schedules', async () => {
    prisma.workflow.findFirst.mockResolvedValue({
      id: 'wf-1',
      owner_id: 'user-1',
      name: 'Webhook flow',
      description: null,
      status: 'active',
      current_version_id: 'ver-1',
      updated_at: new Date('2026-11-28T10:00:00.000Z'),
    })
    tx.workflow.update.mockResolvedValue({
      id: 'wf-1',
      name: 'Webhook flow',
      description: null,
      status: 'draft',
      current_version_id: 'ver-1',
      updated_at: new Date('2026-11-28T10:10:00.000Z'),
    })
    prisma.workflowVersion.findUnique.mockResolvedValue({
      id: 'ver-1',
      workflow_id: 'wf-1',
      version: 1,
      graph: { nodes: [], edges: [] },
    })

    const result = await service.unpublishWorkflow('user-1', 'wf-1')

    expect(tx.trigger.updateMany).toHaveBeenCalledWith({
      where: { workflow_id: 'wf-1' },
      data: { is_enabled: false },
    })
    expect(workflowQueue.deleteSchedule).toHaveBeenCalledWith('wf-1')
    expect(result.status).toBe('draft')
  })
})
