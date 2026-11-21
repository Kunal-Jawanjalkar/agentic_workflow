import { useQueryClient } from '@tanstack/react-query'
import { ReactFlowProvider, useEdgesState, useNodesState, type Node } from '@xyflow/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

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
import type { BuilderNodeData, NodeType } from '@/features/workflows/builder/types'
import { WorkflowBuilderCanvas } from '@/features/workflows/builder/WorkflowBuilderCanvas'
import { WorkflowBuilderHeader } from '@/features/workflows/builder/WorkflowBuilderHeader'
import {
  fetchWorkflow,
  isWorkflowUuid,
  updateWorkflow,
  workflowQueryKeys,
} from '@/features/workflows/api'
import { createDraftWorkflow } from '@/features/workflows/create-draft-workflow'
import {
  formatWorkflowSavedLabel,
  useWorkflowAutosave,
} from '@/features/workflows/use-workflow-autosave'
import { isNewWorkflowRoute } from '@/features/workflows/workflow-route'
import { graphSignature, parseWorkflowGraph } from '@/features/workflows/workflow-graph'

const workflowTitles: Record<string, string> = {
  'support-triage': 'Support triage',
}

function WorkflowBuilderInner() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { workflowId } = useParams()
  const useDemoGraph = workflowId === 'support-triage'
  const isNewRoute = isNewWorkflowRoute(workflowId)
  const persistedId = isWorkflowUuid(workflowId) ? workflowId : undefined

  const [workflowName, setWorkflowName] = useState('Untitled workflow')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [createPhase, setCreatePhase] = useState<'idle' | 'creating' | 'error'>(
    isNewRoute ? 'creating' : 'idle',
  )
  const [hydratedWorkflowId, setHydratedWorkflowId] = useState<string | null>(null)

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

  const { status: saveStatus, lastSavedAt, markHydrated } = useWorkflowAutosave(
    persistedId,
    nodes,
    edges,
    { enabled: !useDemoGraph && Boolean(persistedId) },
  )

  useEffect(() => {
    if (!isNewRoute) {
      return
    }
    void createDraftWorkflow()
      .then(async (workflow) => {
        await queryClient.invalidateQueries({ queryKey: workflowQueryKeys.list })
        navigate(`/workflows/${workflow.id}`, { replace: true })
      })
      .catch(() => {
        setLoadError('Could not create workflow.')
        setCreatePhase('error')
      })
  }, [isNewRoute, navigate, queryClient])

  useEffect(() => {
    if (!persistedId || useDemoGraph) {
      return
    }

    let cancelled = false
    fetchWorkflow(persistedId)
      .then((workflow) => {
        if (cancelled) {
          return
        }
        const { nodes: loadedNodes, edges: loadedEdges } = parseWorkflowGraph(workflow.graph)
        setWorkflowName(workflow.name)
        setNodes(loadedNodes)
        setEdges(loadedEdges)
        markHydrated(graphSignature(loadedNodes, loadedEdges))
        setHydratedWorkflowId(persistedId)
        setLoadError(null)
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError('Could not load workflow.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [persistedId, setEdges, setNodes, useDemoGraph, markHydrated])

  const title =
    (workflowId && workflowTitles[workflowId]) ||
    workflowName

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

  const onRenameWorkflow = useCallback(
    async (name: string) => {
      if (!persistedId || useDemoGraph) {
        return
      }
      const previousName = workflowName
      setWorkflowName(name)
      try {
        const record = await updateWorkflow(persistedId, { name })
        setWorkflowName(record.name)
        await queryClient.invalidateQueries({ queryKey: workflowQueryKeys.list })
      } catch {
        setWorkflowName(previousName)
        throw new Error('Could not rename workflow')
      }
    },
    [persistedId, queryClient, useDemoGraph, workflowName],
  )

  const onUpdateNodeConfig = useCallback(
    (nodeId: string, patch: Record<string, unknown>) => {
      setNodes((current) =>
        current.map((node) => {
          if (node.id !== nodeId) {
            return node
          }
          return {
            ...node,
            data: {
              ...node.data,
              config: {
                ...(node.data.config as Record<string, unknown>),
                ...patch,
              },
            } as BuilderNodeData,
          }
        }),
      )
    },
    [setNodes],
  )

  const isBootstrapping =
    (isNewRoute && createPhase === 'creating') ||
    (persistedId != null && hydratedWorkflowId !== persistedId && loadError == null)

  const savedLabel = useDemoGraph
    ? 'Saved 5s ago'
    : formatWorkflowSavedLabel(saveStatus, lastSavedAt)

  if (loadError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-6 text-sm text-destructive">
        {loadError}
      </div>
    )
  }

  if (isBootstrapping && !useDemoGraph) {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-6 text-sm text-muted-foreground">
        {isNewRoute ? 'Creating workflow…' : 'Loading workflow…'}
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">
      <WorkflowBuilderHeader
        title={title}
        statusLabel="Draft, unpublished edits"
        statusTone="draft"
        savedLabel={savedLabel}
        titleEditable={Boolean(persistedId) && !useDemoGraph}
        onTitleChange={onRenameWorkflow}
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
        <NodeInspectorPanel node={selectedNode} onUpdateConfig={onUpdateNodeConfig} />
      </div>
    </div>
  )
}

function WorkflowBuilderKeyed() {
  const { workflowId } = useParams()
  return <WorkflowBuilderInner key={workflowId ?? 'unknown'} />
}

export function WorkflowBuilderPage() {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderKeyed />
    </ReactFlowProvider>
  )
}