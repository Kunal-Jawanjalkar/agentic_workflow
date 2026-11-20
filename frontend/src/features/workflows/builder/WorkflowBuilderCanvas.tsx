import { useCallback, useEffect } from 'react'
import {
  Background,
  Controls,
  ReactFlow,
  addEdge,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
} from '@xyflow/react'

import {
  triggerAllowsConnection,
  workflowEdgeOptions,
} from '@/features/workflows/builder/append-workflow-step'
import { CanvasEmptyState } from '@/features/workflows/builder/CanvasEmptyState'
import { workflowBuilderNodeTypes } from '@/features/workflows/builder/workflow-builder-node-types'
import type { BuilderNodeData } from '@/features/workflows/builder/types'

type WorkflowBuilderCanvasProps = {
  nodes: Node<BuilderNodeData>[]
  edges: Edge[]
  onNodesChange: OnNodesChange<Node<BuilderNodeData>>
  onEdgesChange: OnEdgesChange<Edge>
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
  selectedNodeId: string | null
  onSelectNode: (nodeId: string | null) => void
}

export function WorkflowBuilderCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  setEdges,
  selectedNodeId,
  onSelectNode,
}: WorkflowBuilderCanvasProps) {
  const { fitView } = useReactFlow()
  const nodeLayout = nodes.map((node) => node.id).join('|')

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((current) => {
        if (!triggerAllowsConnection(nodes, current, connection)) {
          return current
        }
        return addEdge({ ...connection, ...workflowEdgeOptions }, current)
      })
    },
    [nodes, setEdges],
  )

  useEffect(() => {
    if (nodes.length === 0) {
      return
    }
    const frame = requestAnimationFrame(() => {
      void fitView({ padding: 0.35, duration: 200 })
    })
    return () => cancelAnimationFrame(frame)
  }, [fitView, nodeLayout, nodes.length])

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes.map((node) => ({
          ...node,
          selected: node.id === selectedNodeId,
        }))}
        edges={edges}
        nodeTypes={workflowBuilderNodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={(connection) => triggerAllowsConnection(nodes, edges, connection)}
        defaultEdgeOptions={workflowEdgeOptions}
        onPaneClick={() => onSelectNode(null)}
        onNodeClick={(_, node) => onSelectNode(node.id)}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        className="bg-muted/20"
      >
        <Background gap={20} size={1} color="var(--border)" />
        <Controls
          showInteractive={false}
          position="bottom-left"
          className="!shadow-md [&>button]:border-border/60 [&>button]:bg-card"
        />
      </ReactFlow>
      {nodes.length === 0 ? <CanvasEmptyState /> : null}
    </div>
  )
}
