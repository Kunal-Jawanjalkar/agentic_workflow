import { describe, expect, it } from 'vitest'

import { appendWorkflowStep, triggerAllowsConnection, workflowHasTrigger } from './append-workflow-step'
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
      },
    ])
  })

  it('keeps a single outgoing edge on the trigger', () => {
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
    expect(graph.edges[1]).toMatchObject({ source: 'llm-1', target: 'notify-1' })
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
      selectedNodeId: 'notify-yes',
    })

    expect(graph.edges).toEqual([
      {
        id: 'condition-1-notify-yes',
        source: 'condition-1',
        target: 'notify-yes',
        sourceHandle: 'yes',
        label: 'yes',
        type: 'smoothstep',
        pathOptions: { borderRadius: 16 },
      },
      {
        id: 'condition-1-http-no',
        source: 'condition-1',
        target: 'http-no',
        sourceHandle: 'no',
        label: 'no',
        type: 'smoothstep',
        pathOptions: { borderRadius: 16 },
      },
    ])
    expect(graph.nodes[1]?.position).toEqual({ x: 280 + 240, y: 48 })
    expect(graph.nodes[2]?.position).toEqual({ x: 280, y: 48 + 128 })
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
      selectedNodeId: 'notify-yes',
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
})
