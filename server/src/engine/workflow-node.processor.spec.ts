import { Job } from 'bullmq'

import { NodeRegistryService } from '../nodes/node-registry.service'
import { PrismaService } from '../prisma/prisma.service'

import { NodeJobPayload } from './queue.constants'
import { WorkflowNodeProcessor } from './workflow-node.processor'
import { WorkflowQueueService } from './workflow-queue.service'

describe('WorkflowNodeProcessor', () => {
  const prisma = {
    workflowRun: { findUnique: jest.fn(), update: jest.fn() },
    workflowVersion: { findUnique: jest.fn() },
    nodeRun: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  }

  const nodeRegistry = { getExecutorOrThrow: jest.fn() }
  const workflowQueue = { enqueueNode: jest.fn() }

  let processor: WorkflowNodeProcessor

  const graph = {
    nodes: [
      { id: 't1', data: { type: 'trigger', version: 1, config: { trigger_type: 'manual' } } },
      { id: 'l1', data: { type: 'llm', version: 1, config: { model: 'gemini-3.5-flash' } } },
    ],
    edges: [{ id: 'e1', source: 't1', target: 'l1' }],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    prisma.workflowRun.update.mockResolvedValue({})
    prisma.nodeRun.update.mockResolvedValue({})
    processor = new WorkflowNodeProcessor(
      prisma as unknown as PrismaService,
      nodeRegistry as unknown as NodeRegistryService,
      workflowQueue as unknown as WorkflowQueueService,
    )
  })

  it('executes a node and enqueues downstream nodes', async () => {
    prisma.workflowRun.findUnique.mockResolvedValue({
      id: 'run-1',
      status: 'pending',
      trigger_input: { message: 'hello' },
      started_at: null,
    })
    prisma.workflowVersion.findUnique.mockResolvedValue({
      id: 'ver-1',
      workflow_id: 'wf-1',
      graph,
    })
    prisma.nodeRun.findMany.mockResolvedValue([])
    prisma.nodeRun.create.mockResolvedValue({ id: 'nr-1' })
    nodeRegistry.getExecutorOrThrow.mockReturnValue({
      execute: jest.fn().mockResolvedValue({
        output: { message: 'hello', trigger_type: 'manual' },
        outputHandle: 'default',
        status: 'completed',
      }),
    })

    await processor.process({
      data: {
        runId: 'run-1',
        ownerId: 'user-1',
        workflowId: 'wf-1',
        workflowVersionId: 'ver-1',
        nodeId: 't1',
      },
      attemptsMade: 0,
    } as unknown as Job<NodeJobPayload>)

    expect(prisma.workflowRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'run-1' },
        data: expect.objectContaining({ status: 'running' }),
      }),
    )
    expect(workflowQueue.enqueueNode).toHaveBeenCalledWith({
      runId: 'run-1',
      ownerId: 'user-1',
      workflowId: 'wf-1',
      workflowVersionId: 'ver-1',
      nodeId: 'l1',
    })
  })

  it('marks WorkflowRun completed when a leaf node finishes', async () => {
    prisma.workflowRun.findUnique.mockResolvedValue({
      id: 'run-1',
      status: 'running',
      trigger_input: { message: 'hello' },
      started_at: new Date(),
    })
    prisma.workflowVersion.findUnique.mockResolvedValue({
      id: 'ver-1',
      workflow_id: 'wf-1',
      graph,
    })
    prisma.nodeRun.findMany.mockResolvedValue([
      { node_id: 't1', output: { message: 'hello', trigger_type: 'manual' } },
    ])
    prisma.nodeRun.create.mockResolvedValue({ id: 'nr-2' })
    prisma.nodeRun.count.mockResolvedValue(0)
    nodeRegistry.getExecutorOrThrow.mockReturnValue({
      execute: jest.fn().mockResolvedValue({
        output: { text: 'Tigers are big cats.' },
        outputHandle: 'default',
        status: 'completed',
      }),
    })

    await processor.process({
      data: {
        runId: 'run-1',
        ownerId: 'user-1',
        workflowId: 'wf-1',
        workflowVersionId: 'ver-1',
        nodeId: 'l1',
      },
      attemptsMade: 0,
    } as unknown as Job<NodeJobPayload>)

    expect(workflowQueue.enqueueNode).not.toHaveBeenCalled()
    expect(prisma.workflowRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'run-1' },
        data: expect.objectContaining({
          status: 'completed',
          output: { text: 'Tigers are big cats.' },
        }),
      }),
    )
  })

  it('records NodeRun error and marks WorkflowRun failed after final attempt', async () => {
    prisma.workflowRun.findUnique.mockResolvedValue({
      id: 'run-1',
      status: 'running',
      trigger_input: {},
      started_at: new Date(),
    })
    prisma.workflowVersion.findUnique.mockResolvedValue({
      id: 'ver-1',
      workflow_id: 'wf-1',
      graph,
    })
    prisma.nodeRun.findMany.mockResolvedValue([])
    prisma.nodeRun.create.mockResolvedValue({ id: 'nr-3' })
    nodeRegistry.getExecutorOrThrow.mockReturnValue({
      execute: jest.fn().mockRejectedValue(new Error('Model 503')),
    })

    await expect(
      processor.process({
        data: {
          runId: 'run-1',
          ownerId: 'user-1',
          workflowId: 'wf-1',
          workflowVersionId: 'ver-1',
          nodeId: 'l1',
        },
        attemptsMade: 2,
      } as unknown as Job<NodeJobPayload>),
    ).rejects.toThrow('Model 503')

    expect(prisma.nodeRun.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ attempt: 3 }),
      }),
    )
    expect(prisma.nodeRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'nr-3' },
        data: expect.objectContaining({ status: 'failed', error: 'Model 503' }),
      }),
    )

    await processor.onFailed(
      {
        data: {
          runId: 'run-1',
          ownerId: 'user-1',
          workflowId: 'wf-1',
          workflowVersionId: 'ver-1',
          nodeId: 'l1',
        },
        attemptsMade: 3,
        opts: { attempts: 3 },
      } as unknown as Job<NodeJobPayload>,
      new Error('Model 503'),
    )

    expect(prisma.workflowRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'run-1' },
        data: expect.objectContaining({ status: 'failed', error: 'Model 503' }),
      }),
    )
  })
})
