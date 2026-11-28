import type { Edge, Node } from '@xyflow/react'

import type { BuilderNodeData } from './types'

export function removeWorkflowNode(
  nodes: Node<BuilderNodeData>[],
  edges: Edge[],
  nodeId: string,
): { nodes: Node<BuilderNodeData>[]; edges: Edge[] } {
  return {
    nodes: nodes.filter((node) => node.id !== nodeId),
    edges: edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
  }
}
