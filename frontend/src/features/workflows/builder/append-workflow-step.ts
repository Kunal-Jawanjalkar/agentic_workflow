import { MarkerType, type Edge, type Node } from '@xyflow/react'

import { builderNodeDataFromCatalog } from './node-config'
import { isBuilderNodeKind, type BuilderNodeData, type NodeType } from './types'

export const workflowEdgeOptions = {
  type: 'smoothstep' as const,
  pathOptions: { borderRadius: 16 },
  style: { strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
}

const COLUMN_X = 280
const ROW_START_Y = 48
const ROW_GAP = 128
const BRANCH_OFFSET_X = 240

const conditionOutputs = ['yes', 'no'] as const
export type ConditionOutput = (typeof conditionOutputs)[number]

export function isConditionOutput(value: unknown): value is ConditionOutput {
  return value === 'yes' || value === 'no'
}

type WorkflowStep = {
  id: string
  nodeType: NodeType
  selectedNodeId?: string | null
}

function usedConditionOutputs(edges: Edge[], conditionId: string): Set<ConditionOutput> {
  const used = new Set<ConditionOutput>()
  const outgoing = edges.filter((edge) => edge.source === conditionId)

  for (const edge of outgoing) {
    if (edge.sourceHandle === 'yes' || edge.sourceHandle === 'no') {
      used.add(edge.sourceHandle)
    }
  }

  for (const edge of outgoing) {
    if (edge.sourceHandle !== 'yes' && edge.sourceHandle !== 'no') {
      if (!used.has('yes')) {
        used.add('yes')
      } else if (!used.has('no')) {
        used.add('no')
      }
    }
  }

  return used
}

function nextConditionOutput(edges: Edge[], conditionId: string): ConditionOutput | null {
  const used = usedConditionOutputs(edges, conditionId)
  return conditionOutputs.find((output) => !used.has(output)) ?? null
}

export function conditionEdgeFields(sourceHandle: ConditionOutput) {
  return {
    sourceHandle,
    label: sourceHandle,
    labelStyle: { fill: 'var(--foreground)', fontSize: 11, fontWeight: 600 },
    labelBgStyle: { fill: 'var(--card)', fillOpacity: 0.95 },
    labelBgPadding: [4, 6] as [number, number],
    labelBgBorderRadius: 4,
  }
}

function branchParent(
  nodes: Node<BuilderNodeData>[],
  edges: Edge[],
  nodeId: string | null | undefined,
): { parent: Node<BuilderNodeData>; sourceHandle: ConditionOutput } | null {
  if (!nodeId) {
    return null
  }
  const node = nodes.find((item) => item.id === nodeId)
  if (!node) {
    return null
  }
  if (node.data.type === 'condition') {
    const sourceHandle = nextConditionOutput(edges, node.id)
    return sourceHandle ? { parent: node, sourceHandle } : null
  }
  const incoming = edges.find((edge) => edge.target === node.id)
  const parent = incoming ? nodes.find((item) => item.id === incoming.source) : undefined
  if (!parent || parent.data.type !== 'condition') {
    return null
  }
  if (!hasOutgoingEdge(edges, node.id)) {
    return null
  }
  const sourceHandle = nextConditionOutput(edges, parent.id)
  return sourceHandle ? { parent, sourceHandle } : null
}

export function workflowHasTrigger(nodes: Node<BuilderNodeData>[]): boolean {
  return nodes.some((node) => node.data.type === 'trigger')
}

function outgoingFrom(edges: Edge[], nodeId: string): Edge | undefined {
  return edges.find((edge) => edge.source === nodeId)
}

function outgoingFromHandle(
  edges: Edge[],
  nodeId: string,
  sourceHandle?: ConditionOutput,
): Edge | undefined {
  return edges.find((edge) => {
    if (edge.source !== nodeId) {
      return false
    }
    if (sourceHandle) {
      return edge.sourceHandle === sourceHandle
    }
    return edge.sourceHandle == null
  })
}

function hasOutgoingEdge(edges: Edge[], nodeId: string): boolean {
  return edges.some((edge) => edge.source === nodeId)
}

/** When nothing is selected, append after the last sink in node list order. */
export function appendTailNode(
  nodes: Node<BuilderNodeData>[],
  edges: Edge[],
): Node<BuilderNodeData> | undefined {
  for (let index = nodes.length - 1; index >= 0; index -= 1) {
    const node = nodes[index]
    if (node != null && !hasOutgoingEdge(edges, node.id)) {
      return node
    }
  }
  return nodes.at(-1)
}

function collectDescendantIds(edges: Edge[], rootId: string): Set<string> {
  const descendants = new Set<string>()
  const queue = [rootId]
  while (queue.length > 0) {
    const id = queue.shift()!
    for (const edge of edges) {
      if (edge.source === id && !descendants.has(edge.target)) {
        descendants.add(edge.target)
        queue.push(edge.target)
      }
    }
  }
  return descendants
}

export function triggerAllowsConnection(
  nodes: Node<BuilderNodeData>[],
  edges: Edge[],
  connection: { source: string | null; target: string | null },
): boolean {
  if (!connection.source || !connection.target || connection.source === connection.target) {
    return false
  }
  const source = nodes.find((node) => node.id === connection.source)
  const target = nodes.find((node) => node.id === connection.target)
  if (target?.data.type === 'trigger') {
    return false
  }
  if (source?.data.type === 'trigger' && outgoingFrom(edges, source.id)) {
    return false
  }
  return true
}

export function appendWorkflowStep(
  nodes: Node<BuilderNodeData>[],
  edges: Edge[],
  step: WorkflowStep,
): { nodes: Node<BuilderNodeData>[]; edges: Edge[] } {
  if (!isBuilderNodeKind(step.nodeType.type)) {
    return { nodes, edges }
  }
  if (step.nodeType.type === 'trigger' && workflowHasTrigger(nodes)) {
    return { nodes, edges }
  }

  const hasSelection = step.selectedNodeId != null && step.selectedNodeId !== ''
  const selected = hasSelection
    ? nodes.find((node) => node.id === step.selectedNodeId)
    : undefined
  const selectedBranch = hasSelection
    ? branchParent(nodes, edges, step.selectedNodeId)
    : null
  const chainParent = selected ?? (hasSelection ? nodes.at(-1) : appendTailNode(nodes, edges))
  const fallbackBranch =
    hasSelection && !selected && chainParent
      ? branchParent(nodes, edges, chainParent.id)
      : null
  const attachment = selectedBranch ?? fallbackBranch
  let parent = attachment?.parent ?? chainParent
  let sourceHandle = attachment?.sourceHandle
  if (step.nodeType.type === 'trigger') {
    parent = undefined
    sourceHandle = undefined
  }

  if (parent?.data.type === 'condition') {
    const resolved = sourceHandle ?? nextConditionOutput(edges, parent.id)
    if (!resolved) {
      return { nodes, edges }
    }
    sourceHandle = resolved
  }

  const existingOutgoing =
    parent != null ? outgoingFromHandle(edges, parent.id, sourceHandle) : undefined
  const existingChild =
    existingOutgoing != null
      ? nodes.find((item) => item.id === existingOutgoing.target)
      : undefined

  let position = parent
    ? {
        x: parent.position.x + (sourceHandle === 'yes' ? BRANCH_OFFSET_X : 0),
        y: parent.position.y + (sourceHandle === 'yes' ? 0 : ROW_GAP),
      }
    : { x: COLUMN_X, y: ROW_START_Y }

  if (parent != null && existingChild != null) {
    position = { ...existingChild.position }
  }

  const node: Node<BuilderNodeData> = {
    id: step.id,
    type: 'workflow',
    position,
    data: builderNodeDataFromCatalog({
      ...step.nodeType,
      type: step.nodeType.type,
    }),
  }
  if (!parent) {
    return { nodes: [...nodes, node], edges }
  }

  const edgeIn: Edge = {
    id: `${parent.id}-${node.id}`,
    source: parent.id,
    target: node.id,
    ...workflowEdgeOptions,
    ...(sourceHandle ? conditionEdgeFields(sourceHandle) : {}),
  }

  if (existingOutgoing != null && existingChild != null) {
    const shiftIds = collectDescendantIds(edges, existingChild.id)
    shiftIds.add(existingChild.id)
    const shiftedNodes = nodes.map((item) =>
      shiftIds.has(item.id)
        ? { ...item, position: { ...item.position, y: item.position.y + ROW_GAP } }
        : item,
    )
    const edgeThrough: Edge = {
      id: `${node.id}-${existingChild.id}`,
      source: node.id,
      target: existingChild.id,
      ...workflowEdgeOptions,
    }
    const keptEdges = edges.filter((item) => item.id !== existingOutgoing.id)
    return {
      nodes: [...shiftedNodes, node],
      edges: [...keptEdges, edgeIn, edgeThrough],
    }
  }

  return { nodes: [...nodes, node], edges: [...edges, edgeIn] }
}
