import type { Edge, Node } from '@xyflow/react'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { BuilderNodeData } from '@/features/workflows/builder/types'
import * as workflowApi from '@/features/workflows/api'

import { graphSignature } from './workflow-graph'
import { useWorkflowAutosave } from './use-workflow-autosave'

vi.mock('@/features/workflows/api', () => ({
  updateWorkflow: vi.fn(),
}))

const node: Node<BuilderNodeData> = {
  id: 'trigger-1',
  type: 'workflow' as const,
  position: { x: 0, y: 0 },
  data: {
    label: 'Trigger',
    type: 'trigger' as const,
    version: 1,
    config: { trigger_type: 'manual' },
  },
}

describe('useWorkflowAutosave', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(workflowApi.updateWorkflow).mockReset()
    vi.mocked(workflowApi.updateWorkflow).mockResolvedValue({
      id: 'w1',
      name: 'Untitled workflow',
      description: null,
      status: 'draft',
      version: 1,
      graph: { nodes: [node], edges: [] },
      updated_at: new Date().toISOString(),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('debounces graph saves', async () => {
    const { result, rerender } = renderHook(
      ({ nodes, edges }: { nodes: Node<BuilderNodeData>[]; edges: Edge[] }) =>
        useWorkflowAutosave('w1', nodes, edges),
      {
        initialProps: { nodes: [] as Node<BuilderNodeData>[], edges: [] as Edge[] },
      },
    )

    act(() => {
      result.current.markHydrated(graphSignature([], []))
    })
    rerender({ nodes: [node], edges: [] })

    expect(workflowApi.updateWorkflow).not.toHaveBeenCalled()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(799)
    })
    expect(workflowApi.updateWorkflow).not.toHaveBeenCalled()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(workflowApi.updateWorkflow).toHaveBeenCalledTimes(1)
    expect(result.current.status).toBe('saved')
  })

  it('resets hydrated state when workflow id changes', async () => {
    const { result, rerender } = renderHook(
      ({
        workflowId,
        nodes,
        edges,
      }: {
        workflowId: string
        nodes: Node<BuilderNodeData>[]
        edges: Edge[]
      }) => useWorkflowAutosave(workflowId, nodes, edges),
      {
        initialProps: {
          workflowId: 'w1',
          nodes: [] as Node<BuilderNodeData>[],
          edges: [] as Edge[],
        },
      },
    )

    act(() => {
      result.current.markHydrated(graphSignature([], []))
    })
    rerender({ workflowId: 'w2', nodes: [node], edges: [] })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(801)
    })

    expect(workflowApi.updateWorkflow).not.toHaveBeenCalled()
  })
})