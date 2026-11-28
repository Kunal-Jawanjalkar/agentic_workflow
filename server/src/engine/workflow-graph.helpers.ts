import { HttpStatus } from '@nestjs/common'

import { HttpDetailException } from '../common/http-detail.exception'
import { Prisma } from '../generated/prisma/client'

export interface GraphNodePayload {
  id: string
  data: {
    type: string
    version?: number
    label?: string
    config?: Record<string, unknown>
  }
}

export interface GraphEdgePayload {
  id: string
  source: string
  target: string
  sourceHandle?: string | null
}

export interface WorkflowGraphPayload {
  nodes: GraphNodePayload[]
  edges: GraphEdgePayload[]
}

export function parseWorkflowGraph(graph: Prisma.JsonValue): WorkflowGraphPayload {
  if (!graph || typeof graph !== 'object' || Array.isArray(graph)) {
    throw new HttpDetailException(HttpStatus.BAD_REQUEST, 'Workflow graph is empty or invalid')
  }
  const rawNodes = (graph as { nodes?: unknown }).nodes
  const rawEdges = (graph as { edges?: unknown }).edges
  if (!Array.isArray(rawNodes) || rawNodes.length === 0) {
    throw new HttpDetailException(HttpStatus.BAD_REQUEST, 'Workflow graph has no nodes to run')
  }
  return {
    nodes: rawNodes as GraphNodePayload[],
    edges: Array.isArray(rawEdges) ? (rawEdges as GraphEdgePayload[]) : [],
  }
}

export function findTriggerNode(graph: WorkflowGraphPayload): GraphNodePayload {
  const trigger = graph.nodes.find((node) => node.data?.type === 'trigger')
  if (!trigger) {
    throw new HttpDetailException(
      HttpStatus.BAD_REQUEST,
      'Workflow must contain a Trigger node to run',
    )
  }
  return trigger
}

export function buildNodeExecutionInput(params: {
  nodeId: string
  graph: WorkflowGraphPayload
  triggerInput: Record<string, unknown>
  outputsByNodeId: Record<string, Record<string, unknown>>
}): Record<string, unknown> {
  const incoming = params.graph.edges.filter((edge) => edge.target === params.nodeId)
  if (incoming.length === 0) {
    return params.triggerInput
  }

  const merged: Record<string, unknown> = {}
  for (const edge of incoming) {
    const parentOutput = params.outputsByNodeId[edge.source]
    if (parentOutput) {
      Object.assign(merged, parentOutput)
    }
  }

  const triggerNode = params.graph.nodes.find((node) => node.data?.type === 'trigger')
  const triggerOutput = triggerNode ? params.outputsByNodeId[triggerNode.id] : undefined

  return {
    ...merged,
    ...(triggerOutput ? { trigger: triggerOutput } : {}),
    nodes: params.outputsByNodeId,
  }
}

export function findNextNodeIds(params: {
  nodeId: string
  outputHandle?: string
  graph: WorkflowGraphPayload
}): string[] {
  const activeHandle = params.outputHandle ?? 'default'
  const nextIds = new Set<string>()
  for (const edge of params.graph.edges) {
    if (edge.source !== params.nodeId) {
      continue
    }
    const edgeHandle = edge.sourceHandle ?? 'default'
    if (edgeHandle === activeHandle) {
      nextIds.add(edge.target)
    }
  }
  return [...nextIds]
}

export function areIncomingParentsCompleted(params: {
  nodeId: string
  graph: WorkflowGraphPayload
  completedNodeIds: Set<string>
}): boolean {
  const incoming = params.graph.edges.filter((edge) => edge.target === params.nodeId)
  return incoming.every((edge) => params.completedNodeIds.has(edge.source))
}
