import { apiRequest } from '@/lib/api'

import type { WorkflowGraphPayload } from './workflow-graph'

export type WorkflowRecord = {
  id: string
  name: string
  description: string | null
  status: 'draft' | 'active' | 'archived'
  version: number
  graph: WorkflowGraphPayload
  updated_at: string
}

export type WorkflowSummary = {
  id: string
  name: string
  description: string | null
  status: 'draft' | 'active' | 'archived'
  version: number
  trigger_type: string | null
  updated_at: string
}

type WorkflowListResponse = {
  workflows: WorkflowSummary[]
}

export type CreateWorkflowBody = {
  name?: string
  description?: string | null
}

export type UpdateWorkflowBody = {
  name?: string
  description?: string | null
  graph?: WorkflowGraphPayload
}

export const workflowQueryKeys = {
  list: ['workflows', 'list'] as const,
  detail: (id: string) => ['workflows', id] as const,
}

export function createWorkflow(body: CreateWorkflowBody = {}): Promise<WorkflowRecord> {
  return apiRequest<WorkflowRecord>('/api/v1/workflows', {
    method: 'POST',
    body: JSON.stringify({
      name: body.name ?? 'Untitled workflow',
      description: body.description ?? null,
    }),
  })
}

export function listWorkflows(): Promise<WorkflowSummary[]> {
  return apiRequest<WorkflowListResponse>('/api/v1/workflows').then(
    (response) => response.workflows,
  )
}

export function fetchWorkflow(workflowId: string): Promise<WorkflowRecord> {
  return apiRequest<WorkflowRecord>(`/api/v1/workflows/${workflowId}`)
}

export function updateWorkflow(
  workflowId: string,
  body: UpdateWorkflowBody,
): Promise<WorkflowRecord> {
  return apiRequest<WorkflowRecord>(`/api/v1/workflows/${workflowId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function publishWorkflow(workflowId: string): Promise<WorkflowRecord> {
  return apiRequest<WorkflowRecord>(`/api/v1/workflows/${workflowId}/publish`, {
    method: 'POST',
  })
}

export function unpublishWorkflow(workflowId: string): Promise<WorkflowRecord> {
  return apiRequest<WorkflowRecord>(`/api/v1/workflows/${workflowId}/unpublish`, {
    method: 'POST',
  })
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isWorkflowUuid(value: string | undefined): boolean {
  return value != null && uuidPattern.test(value)
}