import type { Node } from '@xyflow/react'
import { describe, expect, it } from 'vitest'

import type { BuilderNodeData } from '@/features/workflows/builder/types'

import { graphSignature, parseWorkflowGraph, serializeWorkflowGraph } from './workflow-graph'

describe('workflow-graph', () => {
  it('round-trips nodes and edges for persistence', () => {
    const nodes: Node<BuilderNodeData>[] = [
      {
        id: 'trigger-1',
        type: 'workflow',
        position: { x: 10, y: 20 },
        data: {
          label: 'Trigger',
          type: 'trigger',
          version: 1,
          config: { trigger_type: 'manual' },
        },
      },
    ]
    const edges = [
      {
        id: 'e1',
        source: 'trigger-1',
        target: 'llm-1',
        type: 'smoothstep',
      },
    ]

    const serialized = serializeWorkflowGraph(nodes, edges)
    const parsed = parseWorkflowGraph(serialized)

    expect(parsed.nodes[0]?.data.type).toBe('trigger')
    expect(parsed.edges[0]?.target).toBe('llm-1')
    expect(graphSignature(nodes, edges)).toBe(graphSignature(parsed.nodes, parsed.edges))
  })

  it('restores yes/no labels and contrast styles on condition branch edges when parsing', () => {
    const parsed = parseWorkflowGraph({
      nodes: [],
      edges: [
        {
          id: 'e-yes',
          source: 'cond-1',
          target: 'llm-1',
          sourceHandle: 'yes',
        },
        {
          id: 'e-no',
          source: 'cond-1',
          target: 'llm-2',
          sourceHandle: 'no',
        },
      ],
    })

    expect(parsed.edges[0]).toMatchObject({
      sourceHandle: 'yes',
      label: 'yes',
      labelStyle: expect.objectContaining({ fill: 'var(--foreground)' }),
      labelBgStyle: expect.objectContaining({ fill: 'var(--card)' }),
    })
    expect(parsed.edges[1]).toMatchObject({
      sourceHandle: 'no',
      label: 'no',
    })
  })
})