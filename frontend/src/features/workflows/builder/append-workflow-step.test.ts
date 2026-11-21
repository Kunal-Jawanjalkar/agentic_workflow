import { describe, expect, it } from 'vitest'

import {
  appendTailNode,
  appendWorkflowStep,
  triggerAllowsConnection,
  workflowHasTrigger,
} from './append-workflow-step'
import type { NodeType } from './types'

const llmSchema: NodeType = {
  type: 'llm',
  version: 1,
  label: 'LLM',
  category: 'ai',
  icon: 'sparkles',
  outputs: ['default'],
  config_schema: {
    properties: {
      credential_label: { type: 'string', default: '' },
      model: { type: 'string' },
      prompt: { type: 'string', default: '' },
      structured_output: { type: 'boolean', default: false },
    },
    required: ['model'],
    type: 'object',
  },
}

const triggerSchema: NodeType = {
  type: 'trigger',
  version: 1,
  label: 'Trigger',
  category: 'trigger',
  icon: 'bolt',
  outputs: ['default'],
  config_schema: {
    properties: {
      trigger_type: { type: 'string', default: 'manual' },
    },
    type: 'object',
  },
}

const conditionSchema: NodeType = {
  type: 'condition',
  version: 1,
  label: 'Condition',
  category: 'logic',
  icon: 'git-branch',
  outputs: ['yes', 'no'],
  config_schema: {
    properties: {
      expression: { type: 'string', default: '' },
    },
    type: 'object',
  },
}

const notifySchema: NodeType = {
  type: 'notify',
  version: 1,
  label: 'Notify',
  category: 'io',
  icon: 'bell',
  outputs: ['default'],
  config_schema: {
    properties: {
      channel: { type: 'string', default: 'email' },
      to: { type: 'string', default: '' },
      subject: { type: 'string', default: '' },
      body: { type: 'string', default: '' },
    },
    type: 'object',
  },
}

describe('appendWorkflowStep', () => {
  it('places the first node with the schema config and version', () => {
    const graph = appendWorkflowStep([], [], {
      id: 'trigger-1',
      nodeType: triggerSchema,
    })

    expect(graph.nodes).toHaveLength(1)
    expect(graph.nodes[0]?.position).toEqual({ x: 280, y: 48 })
    expect(graph.nodes[0]?.data).toEqual({
      label: 'Trigger',
      type: 'trigger',
      version: 1,
      config: { trigger_type: 'manual' },
    })
    expect(graph.edges).toEqual([])
    expect(workflowHasTrigger(graph.nodes)).toBe(true)
  })

  it('rejects a second trigger in the same workflow', () => {
    const first = appendWorkflowStep([], [], {
      id: 'trigger-1',
      nodeType: triggerSchema,
    })
    const graph = appendWorkflowStep(first.nodes, first.edges, {
      id: 'trigger-2',
      nodeType: triggerSchema,
    })

    expect(graph.nodes.map((node) => node.id)).toEqual(['trigger-1'])
    expect(graph.edges).toEqual([])
  })

  it('connects each later node and stores the schema config', () => {
    const first = appendWorkflowStep([], [], {
      id: 'trigger-1',
      nodeType: triggerSchema,
    })
    const graph = appendWorkflowStep(first.nodes, first.edges, {
      id: 'llm-1',
      nodeType: llmSchema,
    })

    expect(graph.nodes.map((node) => node.id)).toEqual(['trigger-1', 'llm-1'])
    expect(graph.nodes[1]?.position.y).toBe(48 + 128)
    expect(graph.nodes[1]?.data).toMatchObject({
      type: 'llm',
      version: 1,
      config: {
        credential_label: '',
        model: '',
        prompt: '',
        structured_output: false,
      },
    })
    expect(graph.edges).toEqual([
      {
        id: 'trigger-1-llm-1',
        source: 'trigger-1',
        target: 'llm-1',
        type: 'smoothstep',
        pathOptions: { borderRadius: 16 },
        style: { strokeWidth: 2 },
        markerEnd: { type: 'arrowclosed', width: 16, height: 16 },
      },
    ])
  })

  it('inserts a new node between the selected node and its child', () => {
    const trigger = appendWorkflowStep([], [], {
      id: 'trigger-1',
      nodeType: triggerSchema,
    })
    const first = appendWorkflowStep(trigger.nodes, trigger.edges, {
      id: 'llm-1',
      nodeType: llmSchema,
      selectedNodeId: 'trigger-1',
    })
    const graph = appendWorkflowStep(first.nodes, first.edges, {
      id: 'notify-1',
      nodeType: notifySchema,
      selectedNodeId: 'trigger-1',
    })

    expect(graph.edges.filter((edge) => edge.source === 'trigger-1')).toHaveLength(1)
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: 'trigger-1', target: 'notify-1' }),
        expect.objectContaining({ source: 'notify-1', target: 'llm-1' }),
      ]),
    )
    expect(graph.nodes.find((node) => node.id === 'llm-1')?.position.y).toBe(48 + 128 + 128)
    expect(
      triggerAllowsConnection(graph.nodes, graph.edges, {
        source: 'trigger-1',
        target: 'notify-1',
      }),
    ).toBe(false)
    expect(
      triggerAllowsConnection(graph.nodes, graph.edges, {
        source: 'notify-1',
        target: 'trigger-1',
      }),
    ).toBe(false)
  })

  it('assigns the first branch output when appending from a condition without a selection', () => {
    const condition = appendWorkflowStep([], [], {
      id: 'condition-1',
      nodeType: conditionSchema,
    })

    const graph = appendWorkflowStep(condition.nodes, condition.edges, {
      id: 'notify-yes',
      nodeType: notifySchema,
      selectedNodeId: null,
    })

    expect(graph.edges[0]).toMatchObject({
      source: 'condition-1',
      target: 'notify-yes',
      sourceHandle: 'yes',
      label: 'yes',
    })
    expect(graph.nodes[1]?.position).toEqual({ x: 280 + 240, y: 48 })
  })

  it('uses the no output when a legacy condition edge had no source handle', () => {
    const notifyNode = {
      id: 'notify-yes',
      type: 'workflow' as const,
      position: { x: 280, y: 176 },
      data: {
        label: 'Notify',
        type: 'notify' as const,
        version: 1,
        config: { channel: 'email', to: '', subject: '', body: '' },
      },
    }
    const nodes = [
      {
        id: 'condition-1',
        type: 'workflow' as const,
        position: { x: 280, y: 48 },
        data: {
          label: 'Condition',
          type: 'condition' as const,
          version: 1,
          config: { expression: '' },
        },
      },
      notifyNode,
    ]
    const edges = [
      {
        id: 'condition-1-notify-yes',
        source: 'condition-1',
        target: 'notify-yes',
        type: 'smoothstep' as const,
      },
    ]

    const graph = appendWorkflowStep(nodes, edges, {
      id: 'http-no',
      nodeType: { ...notifySchema, type: 'http', label: 'HTTP' },
      selectedNodeId: 'condition-1',
    })

    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: 'condition-1',
          target: 'http-no',
          sourceHandle: 'no',
          label: 'no',
        }),
      ]),
    )
  })

  it('attaches the next two nodes to the condition yes and no outputs', () => {
    const condition = appendWorkflowStep([], [], {
      id: 'condition-1',
      nodeType: conditionSchema,
    })
    const yesBranch = appendWorkflowStep(condition.nodes, condition.edges, {
      id: 'notify-yes',
      nodeType: notifySchema,
      selectedNodeId: 'condition-1',
    })
    const graph = appendWorkflowStep(yesBranch.nodes, yesBranch.edges, {
      id: 'http-no',
      nodeType: { ...notifySchema, type: 'http', label: 'HTTP' },
      selectedNodeId: 'condition-1',
    })

    expect(graph.edges).toEqual([
      expect.objectContaining({
        id: 'condition-1-notify-yes',
        source: 'condition-1',
        target: 'notify-yes',
        sourceHandle: 'yes',
        label: 'yes',
      }),
      expect.objectContaining({
        id: 'condition-1-http-no',
        source: 'condition-1',
        target: 'http-no',
        sourceHandle: 'no',
        label: 'no',
      }),
    ])
    expect(graph.nodes[1]?.position).toEqual({ x: 280 + 240, y: 48 })
    expect(graph.nodes[2]?.position).toEqual({ x: 280, y: 48 + 128 })
  })

  it('extends the yes branch when the yes child is still a sink', () => {
    const condition = appendWorkflowStep([], [], {
      id: 'condition-1',
      nodeType: conditionSchema,
    })
    const yesBranch = appendWorkflowStep(condition.nodes, condition.edges, {
      id: 'notify-yes',
      nodeType: notifySchema,
      selectedNodeId: 'condition-1',
    })
    const graph = appendWorkflowStep(yesBranch.nodes, yesBranch.edges, {
      id: 'llm-1',
      nodeType: llmSchema,
      selectedNodeId: 'notify-yes',
    })

    expect(graph.edges).toHaveLength(2)
    expect(graph.edges[1]).toMatchObject({
      source: 'notify-yes',
      target: 'llm-1',
    })
    expect(graph.edges.some((edge) => edge.source === 'condition-1' && edge.sourceHandle === 'no')).toBe(
      false,
    )
  })

  it('chains a later node from the selected branch once both outputs are used', () => {
    const condition = appendWorkflowStep([], [], {
      id: 'condition-1',
      nodeType: conditionSchema,
    })
    const yesBranch = appendWorkflowStep(condition.nodes, condition.edges, {
      id: 'notify-yes',
      nodeType: notifySchema,
      selectedNodeId: 'condition-1',
    })
    const both = appendWorkflowStep(yesBranch.nodes, yesBranch.edges, {
      id: 'http-no',
      nodeType: notifySchema,
      selectedNodeId: 'condition-1',
    })
    const graph = appendWorkflowStep(both.nodes, both.edges, {
      id: 'llm-1',
      nodeType: llmSchema,
      selectedNodeId: 'notify-yes',
    })

    expect(graph.edges[2]).toMatchObject({
      source: 'notify-yes',
      target: 'llm-1',
    })
    expect(graph.edges[2]?.sourceHandle).toBeUndefined()
  })

  it('appends after the graph tail when no node is selected', () => {
    const trigger = appendWorkflowStep([], [], {
      id: 'trigger-1',
      nodeType: triggerSchema,
    })
    const withLlm = appendWorkflowStep(trigger.nodes, trigger.edges, {
      id: 'llm-1',
      nodeType: llmSchema,
      selectedNodeId: 'trigger-1',
    })
    const graph = appendWorkflowStep(withLlm.nodes, withLlm.edges, {
      id: 'notify-1',
      nodeType: notifySchema,
      selectedNodeId: null,
    })

    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: 'llm-1', target: 'notify-1' }),
      ]),
    )
    expect(graph.edges.some((edge) => edge.source === 'trigger-1' && edge.target === 'notify-1')).toBe(
      false,
    )
  })

  it('prefers the last sink in node order for an unselected append', () => {
    const condition = appendWorkflowStep([], [], {
      id: 'condition-1',
      nodeType: conditionSchema,
    })
    const yesBranch = appendWorkflowStep(condition.nodes, condition.edges, {
      id: 'notify-yes',
      nodeType: notifySchema,
      selectedNodeId: 'condition-1',
    })
    const both = appendWorkflowStep(yesBranch.nodes, yesBranch.edges, {
      id: 'http-no',
      nodeType: { ...notifySchema, type: 'http', label: 'HTTP' },
      selectedNodeId: 'condition-1',
    })

    expect(appendTailNode(both.nodes, both.edges)?.id).toBe('http-no')

    const graph = appendWorkflowStep(both.nodes, both.edges, {
      id: 'llm-1',
      nodeType: llmSchema,
      selectedNodeId: null,
    })

    expect(graph.edges).toEqual(
      expect.arrayContaining([expect.objectContaining({ source: 'http-no', target: 'llm-1' })]),
    )
  })

  it('splices between a selected middle node and its downstream step', () => {
    const trigger = appendWorkflowStep([], [], {
      id: 'trigger-1',
      nodeType: triggerSchema,
    })
    const withLlm = appendWorkflowStep(trigger.nodes, trigger.edges, {
      id: 'llm-1',
      nodeType: llmSchema,
      selectedNodeId: 'trigger-1',
    })
    const withNotify = appendWorkflowStep(withLlm.nodes, withLlm.edges, {
      id: 'notify-1',
      nodeType: notifySchema,
      selectedNodeId: 'llm-1',
    })
    const graph = appendWorkflowStep(withNotify.nodes, withNotify.edges, {
      id: 'agent-1',
      nodeType: {
        ...llmSchema,
        type: 'agent',
        label: 'Agent',
        config_schema: {
          properties: {
            credential_label: { type: 'string', default: '' },
            model: { type: 'string', default: 'gpt-4o-mini' },
            system_prompt: { type: 'string', default: '' },
            tools: { type: 'array', items: { type: 'string' } },
          },
          type: 'object',
        },
      },
      selectedNodeId: 'llm-1',
    })

    expect(graph.edges.filter((edge) => edge.source === 'llm-1')).toHaveLength(1)
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: 'llm-1', target: 'agent-1' }),
        expect.objectContaining({ source: 'agent-1', target: 'notify-1' }),
      ]),
    )
  })
})
