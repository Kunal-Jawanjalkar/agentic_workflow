import type { Edge, Node } from '@xyflow/react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { updateWorkflow } from '@/features/workflows/api'
import type { BuilderNodeData } from '@/features/workflows/builder/types'
import { graphSignature, serializeWorkflowGraph } from '@/features/workflows/workflow-graph'

const AUTOSAVE_DEBOUNCE_MS = 800

export type WorkflowSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

export function useWorkflowAutosave(
  workflowId: string | undefined,
  nodes: Node<BuilderNodeData>[],
  edges: Edge[],
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true
  const [status, setStatus] = useState<WorkflowSaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const lastSavedSignatureRef = useRef<string | null>(null)
  const skipSaveRef = useRef(true)

  const markHydrated = useCallback((signature: string) => {
    lastSavedSignatureRef.current = signature
    skipSaveRef.current = false
  }, [])

  useEffect(() => {
    skipSaveRef.current = true
    lastSavedSignatureRef.current = null
    // Reset save session whenever the user opens a different workflow.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI to workflow id change
    setStatus('idle')
    setLastSavedAt(null)
  }, [workflowId])

  useEffect(() => {
    if (!workflowId || !enabled) {
      return undefined
    }

    const signature = graphSignature(nodes, edges)
    if (skipSaveRef.current || signature === lastSavedSignatureRef.current) {
      return undefined
    }

    setStatus('pending')
    const timer = window.setTimeout(() => {
      setStatus('saving')
      updateWorkflow(workflowId, { graph: serializeWorkflowGraph(nodes, edges) })
        .then((record) => {
          lastSavedSignatureRef.current = signature
          setLastSavedAt(new Date(record.updated_at))
          setStatus('saved')
        })
        .catch(() => {
          setStatus('error')
        })
    }, AUTOSAVE_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [workflowId, nodes, edges, enabled])

  return { status, lastSavedAt, markHydrated }
}

export function formatWorkflowSavedLabel(
  status: WorkflowSaveStatus,
  lastSavedAt: Date | null,
): string {
  if (status === 'saving' || status === 'pending') {
    return 'Saving…'
  }
  if (status === 'error') {
    return 'Could not save'
  }
  if (lastSavedAt) {
    const seconds = Math.max(0, Math.round((Date.now() - lastSavedAt.getTime()) / 1000))
    if (seconds < 10) {
      return 'Saved just now'
    }
    if (seconds < 60) {
      return `Saved ${seconds}s ago`
    }
    const minutes = Math.round(seconds / 60)
    return `Saved ${minutes}m ago`
  }
  return 'Not saved yet'
}