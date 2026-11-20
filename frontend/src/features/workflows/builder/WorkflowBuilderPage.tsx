import { ReactFlowProvider, useEdgesState, useNodesState, type Node } from '@xyflow/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import { AddNodePanel } from '@/features/workflows/builder/AddNodePanel'
import {
  appendWorkflowStep,
  workflowHasTrigger,
} from '@/features/workflows/builder/append-workflow-step'
import { NodeInspectorPanel } from '@/features/workflows/builder/NodeInspectorPanel'
import {
  supportTriageEdges,
  supportTriageNodes,
} from '@/features/workflows/builder/support-triage-graph'
import type { BuilderNodeData, LlmNodeConfig, NodeType } from '@/features/workflows/builder/types'
import { WorkflowBuilderCanvas } from '@/features/workflows/builder/WorkflowBuilderCanvas'
import { WorkflowBuilderHeader } from '@/features/workflows/builder/WorkflowBuilderHeader'

const workflowTitles: Record<string, string> = {
  'support-triage': 'Support triage',
}

function WorkflowBuilderInner() {
  const { workflowId } = useParams()
  const useDemoGraph = workflowId === 'support-triage'

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<BuilderNodeData>>(
    useDemoGraph ? supportTriageNodes : [],
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    useDemoGraph ? supportTriageEdges : [],
  )
  const graphRef = useRef({ nodes, edges })
  useEffect(() => {
    graphRef.current = { nodes, edges }
  }, [nodes, edges])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    useDemoGraph ? 'classify-ticket' : null,
  )

  const title =
    (workflowId && workflowTitles[workflowId]) ||
    (workflowId ? 'Untitled workflow' : 'Untitled workflow')

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  )

  const onAddNode = useCallback(
    (nodeType: NodeType) => {
      const current = graphRef.current
      if (nodeType.type === 'trigger' && workflowHasTrigger(current.nodes)) {
        return
      }
      const id = `${nodeType.type}-${crypto.randomUUID().slice(0, 8)}`
      const next = appendWorkflowStep(current.nodes, current.edges, {
        id,
        nodeType,
        selectedNodeId,
      })
      setNodes(next.nodes)
      setEdges(next.edges)
      setSelectedNodeId(id)
    },
    [selectedNodeId, setEdges, setNodes],
  )

  const onUpdateLlmConfig = useCallback(
    (nodeId: string, patch: Partial<LlmNodeConfig>) => {
      setNodes((current) =>
        current.map((node) => {
          if (node.id !== nodeId || node.data.type !== 'llm') {
            return node
          }
          return {
            ...node,
            data: {
              ...node.data,
              config: { ...node.data.config, ...patch },
            },
          }
        }),
      )
    },
    [setNodes],
  )

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">
      <WorkflowBuilderHeader
        title={title}
        statusLabel="Draft, unpublished edits"
        statusTone="draft"
        savedLabel="Saved 5s ago"
      />
      <div className="flex min-h-0 flex-1">
        <AddNodePanel hasTrigger={workflowHasTrigger(nodes)} onAddNode={onAddNode} />
        <div className="relative min-h-0 min-w-0 flex-1">
          <WorkflowBuilderCanvas
            nodes={nodes}
            edges={edges}
            setEdges={setEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
          />
        </div>
        <NodeInspectorPanel node={selectedNode} onUpdateLlmConfig={onUpdateLlmConfig} />
      </div>
    </div>
  )
}

export function WorkflowBuilderPage() {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderInner />
    </ReactFlowProvider>
  )
}
