import type { Edge, Node } from '@xyflow/react'

import {
  conditionEdgeFields,
  isConditionOutput,
} from '@/features/workflows/builder/append-workflow-step'
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
        labelStyle: edge.labelStyle,
        labelBgStyle: edge.labelBgStyle,
        labelBgPadding: edge.labelBgPadding,
        labelBgBorderRadius: edge.labelBgBorderRadius,
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
    edges: graph.edges.map((edge) => {
      if (!isConditionOutput(edge.sourceHandle)) {
        return edge
      }
      const defaults = conditionEdgeFields(edge.sourceHandle)
      return {
        ...defaults,
        ...edge,
        label: edge.label ?? defaults.label,
        labelStyle: edge.labelStyle ?? defaults.labelStyle,
        labelBgStyle: edge.labelBgStyle ?? defaults.labelBgStyle,
        labelBgPadding: edge.labelBgPadding ?? defaults.labelBgPadding,
        labelBgBorderRadius: edge.labelBgBorderRadius ?? defaults.labelBgBorderRadius,
      }
    }),
  }
}

export function graphSignature(nodes: Node<BuilderNodeData>[], edges: Edge[]): string {
  return JSON.stringify(serializeWorkflowGraph(nodes, edges))
}