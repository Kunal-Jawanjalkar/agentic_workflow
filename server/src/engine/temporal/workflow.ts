import { proxyActivities, workflowInfo } from '@temporalio/workflow'

import type { createWorkflowActivities } from './activities'

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

export interface WorkflowGraphExecutionInput {
  runId?: string
  ownerId: string
  workflowId: string
  workflowVersionId: string
  triggerType: string
  graph: WorkflowGraphPayload
  triggerInput: Record<string, unknown>
}

const activities = proxyActivities<ReturnType<typeof createWorkflowActivities>>({
  startToCloseTimeout: '2 minutes',
  retry: {
    maximumAttempts: 3,
  },
})

function findStartNodes(graph: WorkflowGraphPayload): GraphNodePayload[] {
  const triggerNode = graph.nodes.find((node) => node.data?.type === 'trigger')
  if (triggerNode) {
    return [triggerNode]
  }
  const targets = new Set(graph.edges.map((edge) => edge.target))
  return graph.nodes.filter((node) => !targets.has(node.id))
}

function buildNodeInput(
  node: GraphNodePayload,
  edges: GraphEdgePayload[],
  outputs: Record<string, Record<string, unknown>>,
  triggerOutput: Record<string, unknown> | undefined,
  triggerInput: Record<string, unknown>,
): Record<string, unknown> {
  const incoming = edges.filter((edge) => edge.target === node.id)
  if (incoming.length === 0) {
    return triggerInput
  }

  const merged: Record<string, unknown> = {}
  for (const edge of incoming) {
    const parentOutput = outputs[edge.source]
    if (parentOutput) {
      Object.assign(merged, parentOutput)
    }
  }

  return {
    ...merged,
    ...(triggerOutput ? { trigger: triggerOutput } : {}),
    nodes: outputs,
  }
}

export async function executeWorkflowGraph(
  input: WorkflowGraphExecutionInput,
): Promise<Record<string, unknown>> {
  const info = workflowInfo()
  const runId = await activities.ensureRunStarted({
    runId: input.runId,
    ownerId: input.ownerId,
    workflowId: input.workflowId,
    workflowVersionId: input.workflowVersionId,
    triggerType: input.triggerType,
    triggerInput: input.triggerInput,
    temporalWorkflowId: info.workflowId,
    temporalRunId: info.runId,
  })

  try {
    const nodeById = new Map(input.graph.nodes.map((node) => [node.id, node]))
    const queue = findStartNodes(input.graph).map((node) => node.id)
    const visited = new Set<string>()
    const outputs: Record<string, Record<string, unknown>> = {}
    let triggerOutput: Record<string, unknown> | undefined
    let lastOutput: Record<string, unknown> = {}

    while (queue.length > 0) {
      const nodeId = queue.shift()!
      if (visited.has(nodeId)) {
        continue
      }
      const node = nodeById.get(nodeId)
      if (!node) {
        continue
      }
      visited.add(nodeId)

      const nodeInput = buildNodeInput(
        node,
        input.graph.edges,
        outputs,
        triggerOutput,
        input.triggerInput,
      )

      const result = await activities.executeNode({
        ownerId: input.ownerId,
        workflowId: input.workflowId,
        executionId: runId,
        nodeId: node.id,
        nodeType: node.data.type,
        version: node.data.version ?? 1,
        config: node.data.config ?? {},
        input: nodeInput,
      })

      outputs[node.id] = result.output
      if (node.data.type === 'trigger') {
        triggerOutput = result.output
      }
      lastOutput = result.output

      const activeHandle = result.outputHandle ?? 'default'
      const outgoing = input.graph.edges.filter((edge) => {
        if (edge.source !== node.id) {
          return false
        }
        const edgeHandle = edge.sourceHandle ?? 'default'
        return edgeHandle === activeHandle
      })

      for (const edge of outgoing) {
        if (!visited.has(edge.target)) {
          queue.push(edge.target)
        }
      }
    }

    await activities.markRunCompleted({
      runId,
      output: lastOutput,
    })

    return lastOutput
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await activities.markRunFailed({
      runId,
      error: message,
    })
    throw error
  }
}
