import type { Edge, Node } from '@xyflow/react'

import { builderNodeDataFromCatalog } from './node-config'
import { isBuilderNodeKind, type BuilderNodeData, type NodeType } from './types'

export const workflowEdgeOptions = {
  type: 'smoothstep' as const,
  pathOptions: { borderRadius: 16 },
}

const COLUMN_X = 280
const ROW_START_Y = 48
const ROW_GAP = 128
const BRANCH_OFFSET_X = 240

const conditionOutputs = ['yes', 'no'] as const
type ConditionOutput = (typeof conditionOutputs)[number]

type WorkflowStep = {
  id: string
  nodeType: NodeType
  selectedNodeId?: string | null
}

function nextConditionOutput(edges: Edge[], conditionId: string): ConditionOutput | null {
  const used = new Set(
    edges.filter((edge) => edge.source === conditionId).map((edge) => edge.sourceHandle),
  )
  return conditionOutputs.find((output) => !used.has(output)) ?? null
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
  const sourceHandle = nextConditionOutput(edges, parent.id)
  return sourceHandle ? { parent, sourceHandle } : null
}

export function workflowHasTrigger(nodes: Node<BuilderNodeData>[]): boolean {
  return nodes.some((node) => node.data.type === 'trigger')
}

function outgoingFrom(edges: Edge[], nodeId: string): Edge | undefined {
  return edges.find((edge) => edge.source === nodeId)
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

  const selected = nodes.find((node) => node.id === step.selectedNodeId)
  const selectedBranch = branchParent(nodes, edges, step.selectedNodeId)
  const chainParent = selected ?? nodes.at(-1)
  const fallbackBranch =
    selected || !chainParent ? null : branchParent(nodes, edges, chainParent.id)
  const attachment = selectedBranch ?? fallbackBranch
  let parent = attachment?.parent ?? chainParent
  let sourceHandle = attachment?.sourceHandle
  if (parent?.data.type === 'trigger') {
    const existing = outgoingFrom(edges, parent.id)
    const child = existing ? nodes.find((node) => node.id === existing.target) : undefined
    if (child) {
      const childBranch = branchParent(nodes, edges, child.id)
      parent = childBranch?.parent ?? child
      sourceHandle = childBranch?.sourceHandle
    }
  }
  if (step.nodeType.type === 'trigger') {
    parent = undefined
    sourceHandle = undefined
  }

  const node: Node<BuilderNodeData> = {
    id: step.id,
    type: 'workflow',
    position: parent
      ? {
          x: parent.position.x + (sourceHandle === 'yes' ? BRANCH_OFFSET_X : 0),
          y: parent.position.y + (sourceHandle === 'yes' ? 0 : ROW_GAP),
        }
      : { x: COLUMN_X, y: ROW_START_Y },
    data: builderNodeDataFromCatalog({
      ...step.nodeType,
      type: step.nodeType.type,
    }),
  }
  if (!parent) {
    return { nodes: [...nodes, node], edges }
  }

  const edge: Edge = {
    id: `${parent.id}-${node.id}`,
    source: parent.id,
    target: node.id,
    ...workflowEdgeOptions,
    ...(sourceHandle ? { sourceHandle, label: sourceHandle } : {}),
  }

  return { nodes: [...nodes, node], edges: [...edges, edge] }
}
