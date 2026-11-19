import { useCallback } from 'react'
import {
  Background,
  Controls,
  ReactFlow,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
} from '@xyflow/react'

import { workflowBuilderNodeTypes } from '@/features/workflows/builder/WorkflowBuilderNode'
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
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((current) => addEdge(connection, current))
    },
    [setEdges],
  )

  return (
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
  )
}
