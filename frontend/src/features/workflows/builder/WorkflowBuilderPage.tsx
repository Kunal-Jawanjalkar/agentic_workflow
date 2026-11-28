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
import { removeWorkflowNode } from '@/features/workflows/builder/remove-workflow-node'
import {
  supportTriageEdges,
  supportTriageNodes,
} from '@/features/workflows/builder/support-triage-graph'
import type { BuilderNodeData, NodeType } from '@/features/workflows/builder/types'
import { WorkflowBuilderCanvas } from '@/features/workflows/builder/WorkflowBuilderCanvas'
import { WorkflowBuilderHeader } from '@/features/workflows/builder/WorkflowBuilderHeader'
import { syncWorkflowSchedule, triggerManualRun } from '@/features/runs/api'
import {
  fetchWorkflow,
  isWorkflowUuid,
  publishWorkflow,
  unpublishWorkflow,
  updateWorkflow,
  workflowQueryKeys,
} from '@/features/workflows/api'
import { createDraftWorkflow } from '@/features/workflows/create-draft-workflow'
import {
  formatWorkflowSavedLabel,
  useWorkflowAutosave,
} from '@/features/workflows/use-workflow-autosave'
import { isNewWorkflowRoute } from '@/features/workflows/workflow-route'
import {
  graphSignature,
  parseWorkflowGraph,
  serializeWorkflowGraph,
} from '@/features/workflows/workflow-graph'

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
  const [workflowStatus, setWorkflowStatus] = useState<'draft' | 'active' | 'archived'>('draft')
  const [workflowVersion, setWorkflowVersion] = useState(1)
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
  const [isRunningTest, setIsRunningTest] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [runStatusMessage, setRunStatusMessage] = useState<string | null>(null)
  const [isSyncingSchedule, setIsSyncingSchedule] = useState(false)
  const [scheduleStatus, setScheduleStatus] = useState<string | null>(null)

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
        setWorkflowStatus(workflow.status)
        setWorkflowVersion(workflow.version)
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

  const onDeleteNode = useCallback(
    (nodeId: string) => {
      const current = graphRef.current
      const next = removeWorkflowNode(current.nodes, current.edges, nodeId)
      setNodes(next.nodes)
      setEdges(next.edges)
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null)
      }
    },
    [selectedNodeId, setEdges, setNodes],
  )

  const handleRunTest = useCallback(async () => {
    if (!persistedId || useDemoGraph) {
      return
    }
    setIsRunningTest(true)
    setRunStatusMessage(null)
    try {
      const current = graphRef.current
      await updateWorkflow(persistedId, {
        graph: serializeWorkflowGraph(current.nodes, current.edges),
      })
      const triggerNode = current.nodes.find((node) => node.data.type === 'trigger')
      const defaultInput =
        triggerNode?.data.type === 'trigger' &&
        triggerNode.data.config.default_input &&
        typeof triggerNode.data.config.default_input === 'object'
          ? triggerNode.data.config.default_input
          : {}
      const run = await triggerManualRun(persistedId, defaultInput, true)
      setRunStatusMessage(`Test run ${run.id.slice(0, 8)} (${run.status})`)
    } catch (error) {
      setRunStatusMessage(error instanceof Error ? error.message : 'Failed to start run')
    } finally {
      setIsRunningTest(false)
    }
  }, [persistedId, useDemoGraph])

  const handlePublish = useCallback(async () => {
    if (!persistedId || useDemoGraph) {
      return
    }
    setIsPublishing(true)
    setRunStatusMessage(null)
    try {
      const current = graphRef.current
      await updateWorkflow(persistedId, {
        graph: serializeWorkflowGraph(current.nodes, current.edges),
      })
      const published = await publishWorkflow(persistedId)
      setWorkflowStatus(published.status)
      setWorkflowVersion(published.version)
      await queryClient.invalidateQueries({ queryKey: workflowQueryKeys.list })
      setRunStatusMessage(`Published v${published.version}`)
    } catch (error) {
      setRunStatusMessage(error instanceof Error ? error.message : 'Failed to publish workflow')
    } finally {
      setIsPublishing(false)
    }
  }, [persistedId, queryClient, useDemoGraph])

  const handleUnpublish = useCallback(async () => {
    if (!persistedId || useDemoGraph) {
      return
    }
    setIsPublishing(true)
    setRunStatusMessage(null)
    try {
      const unpublished = await unpublishWorkflow(persistedId)
      setWorkflowStatus(unpublished.status)
      setWorkflowVersion(unpublished.version)
      await queryClient.invalidateQueries({ queryKey: workflowQueryKeys.list })
      setRunStatusMessage('Workflow unpublished (draft)')
    } catch (error) {
      setRunStatusMessage(error instanceof Error ? error.message : 'Failed to unpublish workflow')
    } finally {
      setIsPublishing(false)
    }
  }, [persistedId, queryClient, useDemoGraph])

  const handleSyncSchedule = useCallback(async () => {
    if (!persistedId || useDemoGraph) {
      return
    }
    setIsSyncingSchedule(true)
    setScheduleStatus(null)
    try {
      const current = graphRef.current
      await updateWorkflow(persistedId, {
        graph: serializeWorkflowGraph(current.nodes, current.edges),
      })
      const result = await syncWorkflowSchedule(persistedId)
      setScheduleStatus(
        result.synced
          ? `Synced (${result.schedule_id})`
          : 'Schedule removed (not a scheduler trigger)',
      )
    } catch (error) {
      setScheduleStatus(error instanceof Error ? error.message : 'Failed to sync schedule')
    } finally {
      setIsSyncingSchedule(false)
    }
  }, [persistedId, useDemoGraph])

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

  const statusLabel =
    useDemoGraph || workflowStatus === 'draft'
      ? 'Draft, unpublished edits'
      : workflowStatus === 'active'
        ? `Published v${workflowVersion}`
        : 'Archived'
  const statusTone = !useDemoGraph && workflowStatus === 'active' ? 'published' : 'draft'

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">
      <WorkflowBuilderHeader
        title={title}
        statusLabel={statusLabel}
        statusTone={statusTone}
        savedLabel={savedLabel}
        titleEditable={Boolean(persistedId) && !useDemoGraph}
        onTitleChange={onRenameWorkflow}
        onRunTest={persistedId && !useDemoGraph ? () => void handleRunTest() : undefined}
        isRunningTest={isRunningTest}
        runTestDisabled={!persistedId || useDemoGraph || !workflowHasTrigger(nodes)}
        runStatusMessage={runStatusMessage}
        onPublish={persistedId && !useDemoGraph ? () => void handlePublish() : undefined}
        onUnpublish={persistedId && !useDemoGraph ? () => void handleUnpublish() : undefined}
        isPublishing={isPublishing}
        publishDisabled={!persistedId || useDemoGraph || !workflowHasTrigger(nodes)}
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
        <NodeInspectorPanel
          workflowId={persistedId}
          node={selectedNode}
          nodes={nodes}
          edges={edges}
          onUpdateConfig={onUpdateNodeConfig}
          onDeleteNode={onDeleteNode}
          onRunTest={persistedId && !useDemoGraph ? () => void handleRunTest() : undefined}
          isRunningTest={isRunningTest}
          onSyncSchedule={persistedId && !useDemoGraph ? () => void handleSyncSchedule() : undefined}
          isSyncingSchedule={isSyncingSchedule}
          scheduleStatus={scheduleStatus}
        />
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