import type { Edge, Node } from '@xyflow/react'
import { describe, expect, it } from 'vitest'

import { removeWorkflowNode } from './remove-workflow-node'
import type { BuilderNodeData } from './types'

describe('removeWorkflowNode', () => {
  it('removes the target node and all connected incoming and outgoing edges', () => {
    const nodes: Node<BuilderNodeData>[] = [
      {
        id: 'trigger-1',
        type: 'workflow',
        position: { x: 0, y: 0 },
        data: { label: 'Trigger', type: 'trigger', version: 1, config: { trigger_type: 'manual' } },
      },
      {
        id: 'llm-1',
        type: 'workflow',
        position: { x: 0, y: 120 },
        data: {
          label: 'LLM',
          type: 'llm',
          version: 1,
          config: { credential_label: '', model: 'gpt-4o-mini', prompt: '', structured_output: false },
        },
      },
      {
        id: 'notify-1',
        type: 'workflow',
        position: { x: 0, y: 240 },
        data: {
          label: 'Notify',
          type: 'notify',
          version: 1,
          config: { channel: 'email', to: '', subject: '', body: '' },
        },
      },
    ]
    const edges: Edge[] = [
      { id: 'e1', source: 'trigger-1', target: 'llm-1' },
      { id: 'e2', source: 'llm-1', target: 'notify-1' },
      { id: 'e3', source: 'trigger-1', target: 'notify-1' },
    ]

    const result = removeWorkflowNode(nodes, edges, 'llm-1')

    expect(result.nodes.map((node) => node.id)).toEqual(['trigger-1', 'notify-1'])
    expect(result.edges.map((edge) => edge.id)).toEqual(['e3'])
  })
})
