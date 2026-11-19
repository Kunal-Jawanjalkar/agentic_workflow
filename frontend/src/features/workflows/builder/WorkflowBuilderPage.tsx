import { ReactFlowProvider, useEdgesState, useNodesState, type Node } from '@xyflow/react'
import { useCallback, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import { AddNodePanel } from '@/features/workflows/builder/AddNodePanel'
import { NodeInspectorPanel } from '@/features/workflows/builder/NodeInspectorPanel'
import { defaultLlmConfig } from '@/features/workflows/builder/node-palette'
import {
  supportTriageEdges,
  supportTriageNodes,
} from '@/features/workflows/builder/support-triage-graph'
import type { BuilderNodeData, BuilderNodeKind, LlmNodeConfig } from '@/features/workflows/builder/types'
import { WorkflowBuilderCanvas } from '@/features/workflows/builder/WorkflowBuilderCanvas'
import { WorkflowBuilderHeader } from '@/features/workflows/builder/WorkflowBuilderHeader'

const workflowTitles: Record<string, string> = {
  'support-triage': 'Support triage',
}

function defaultLabelForKind(kind: BuilderNodeKind): string {
  const labels: Record<BuilderNodeKind, string> = {
    trigger: 'Trigger',
    llm: 'LLM step',
    agent: 'Agent',
    condition: 'Condition',
    http: 'HTTP',
    approval: 'Human approval',
    notify: 'Notify',
  }
  return labels[kind]
}

function WorkflowBuilderInner() {
  const { workflowId } = useParams()
  const useDemoGraph = workflowId === 'support-triage' || workflowId === undefined

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<BuilderNodeData>>(
    useDemoGraph ? supportTriageNodes : [],
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    useDemoGraph ? supportTriageEdges : [],
  )
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
    (kind: BuilderNodeKind) => {
      const id = `${kind}-${crypto.randomUUID().slice(0, 8)}`
      const newNode: Node<BuilderNodeData> = {
        id,
        type: 'workflow',
        position: { x: 200 + Math.random() * 80, y: 120 + Math.random() * 80 },
        data: {
          label: defaultLabelForKind(kind),
          kind,
          config: kind === 'llm' ? { ...defaultLlmConfig } : {},
        },
      }
      setNodes((current) => [...current, newNode])
      setSelectedNodeId(id)
    },
    [setNodes],
  )

  const onUpdateLlmConfig = useCallback(
    (nodeId: string, patch: Partial<LlmNodeConfig>) => {
      setNodes((current) =>
        current.map((node) => {
          if (node.id !== nodeId || node.data.kind !== 'llm') {
            return node
          }
          return {
            ...node,
            data: {
              ...node.data,
              config: { ...(node.data.config as LlmNodeConfig), ...patch },
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
        <AddNodePanel onAddNode={onAddNode} />
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
