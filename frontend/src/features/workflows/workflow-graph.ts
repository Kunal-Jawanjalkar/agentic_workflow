import type { Edge, Node } from '@xyflow/react'

import type { BuilderNodeData } from '@/features/workflows/builder/types'

export type PersistedWorkflowGraph = {
  nodes: Node<BuilderNodeData>[]
  edges: Edge[]
}

export type WorkflowGraphPayload = {
  nodes: Node<BuilderNodeData>[]
  edges: Edge[]
}

export function serializeWorkflowGraph(
  nodes: Node<BuilderNodeData>[],
  edges: Edge[],
): WorkflowGraphPayload {
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
    })),
    edges: edges.map((edge) => {
      const extra = edge as Edge & { pathOptions?: unknown }
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: edge.type,
        label: edge.label,
        pathOptions: extra.pathOptions,
        style: edge.style,
        markerEnd: edge.markerEnd,
      }
    }),
  }
}

export function parseWorkflowGraph(graph: WorkflowGraphPayload): PersistedWorkflowGraph {
  return {
    nodes: graph.nodes.map((node) => ({
      ...node,
      type: node.type ?? 'workflow',
    })),
    edges: graph.edges,
  }
}

export function graphSignature(nodes: Node<BuilderNodeData>[], edges: Edge[]): string {
  return JSON.stringify(serializeWorkflowGraph(nodes, edges))
}