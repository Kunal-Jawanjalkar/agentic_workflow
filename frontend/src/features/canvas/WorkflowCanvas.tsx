import { useCallback } from 'react'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react'

const initialNodes: Node[] = [
  {
    id: 'trigger-1',
    type: 'input',
    position: { x: 80, y: 120 },
    data: { label: 'Manual trigger' },
  },
  {
    id: 'agent-1',
    position: { x: 320, y: 100 },
    data: { label: 'AI agent' },
  },
]

const initialEdges: Edge[] = [
  { id: 'e-trigger-agent', source: 'trigger-1', target: 'agent-1' },
]

function WorkflowCanvasInner() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((current) => addEdge(connection, current))
    },
    [setEdges],
  )

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={16} size={1} />
      <Controls />
      <MiniMap zoomable pannable />
    </ReactFlow>
  )
}

export function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <div className="absolute inset-0">
        <WorkflowCanvasInner />
      </div>
    </ReactFlowProvider>
  )
}
