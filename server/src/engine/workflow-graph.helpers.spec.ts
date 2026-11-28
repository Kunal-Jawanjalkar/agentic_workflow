import { HttpDetailException } from '../common/http-detail.exception'

import {
  areIncomingParentsCompleted,
  buildNodeExecutionInput,
  findNextNodeIds,
  findTriggerNode,
  parseWorkflowGraph,
  WorkflowGraphPayload,
} from './workflow-graph.helpers'

describe('workflow-graph.helpers', () => {
  const sampleGraph: WorkflowGraphPayload = {
    nodes: [
      { id: 'trigger-1', data: { type: 'trigger', version: 1, config: { trigger_type: 'manual' } } },
      { id: 'cond-1', data: { type: 'condition', version: 1, config: { expression: 'true' } } },
      { id: 'llm-yes', data: { type: 'llm', version: 1, config: { model: 'gemini-3.5-flash' } } },
      { id: 'llm-no', data: { type: 'llm', version: 1, config: { model: 'gemini-3.5-flash' } } },
    ],
    edges: [
      { id: 'e1', source: 'trigger-1', target: 'cond-1' },
      { id: 'e2', source: 'cond-1', target: 'llm-yes', sourceHandle: 'yes' },
      { id: 'e3', source: 'cond-1', target: 'llm-no', sourceHandle: 'no' },
    ],
  }

  it('rejects empty or invalid graphs', () => {
    expect(() => parseWorkflowGraph(null)).toThrow(HttpDetailException)
    expect(() => parseWorkflowGraph({ nodes: [], edges: [] })).toThrow(HttpDetailException)
  })

  it('finds trigger node and routes outgoing edges by outputHandle', () => {
    expect(findTriggerNode(sampleGraph).id).toBe('trigger-1')
    expect(findNextNodeIds({ nodeId: 'trigger-1', graph: sampleGraph })).toEqual(['cond-1'])
    expect(
      findNextNodeIds({ nodeId: 'cond-1', outputHandle: 'yes', graph: sampleGraph }),
    ).toEqual(['llm-yes'])
  })

  it('builds downstream node input with trigger output and nodes map', () => {
    const input = buildNodeExecutionInput({
      nodeId: 'cond-1',
      graph: sampleGraph,
      triggerInput: { message: 'hello' },
      outputsByNodeId: {
        'trigger-1': { message: 'hello', trigger_type: 'manual' },
      },
    })

    expect(input).toMatchObject({
      message: 'hello',
      trigger_type: 'manual',
      trigger: { message: 'hello', trigger_type: 'manual' },
      nodes: {
        'trigger-1': { message: 'hello', trigger_type: 'manual' },
      },
    })
  })

  it('checks parent completion for fan-in nodes', () => {
    const fanInGraph: WorkflowGraphPayload = {
      nodes: [
        { id: 'a', data: { type: 'trigger' } },
        { id: 'b', data: { type: 'llm' } },
        { id: 'c', data: { type: 'llm' } },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'c' },
        { id: 'e2', source: 'b', target: 'c' },
      ],
    }

    expect(
      areIncomingParentsCompleted({
        nodeId: 'c',
        graph: fanInGraph,
        completedNodeIds: new Set(['a']),
      }),
    ).toBe(false)

    expect(
      areIncomingParentsCompleted({
        nodeId: 'c',
        graph: fanInGraph,
        completedNodeIds: new Set(['a', 'b']),
      }),
    ).toBe(true)
  })
})
