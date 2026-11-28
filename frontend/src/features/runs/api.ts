import { apiRequest } from '@/lib/api'

export type NodeRunRecord = {
  id: string
  run_id: string
  node_id: string
  node_type: string
  status: string
  input: unknown
  output: unknown
  error: string | null
  attempt: number
  started_at: string | null
  finished_at: string | null
  created_at: string
}

export type WorkflowRunRecord = {
  id: string
  workflow_id: string
  workflow_version_id: string
  workflow_name?: string
  status: string
  trigger_type: string
  is_test?: boolean
  trigger_input: unknown
  output: unknown
  error: string | null
  node_run_count?: number
  node_runs?: NodeRunRecord[]
  started_at: string | null
  finished_at: string | null
  created_at: string
}

export function triggerManualRun(
  workflowId: string,
  input: Record<string, unknown> = {},
  testMode = false,
): Promise<WorkflowRunRecord> {
  return apiRequest<WorkflowRunRecord>(`/api/v1/workflows/${workflowId}/runs`, {
    method: 'POST',
    body: JSON.stringify({ input, test_mode: testMode }),
  })
}

export function syncWorkflowSchedule(
  workflowId: string,
): Promise<{ synced: boolean; schedule_id: string | null }> {
  return apiRequest<{ synced: boolean; schedule_id: string | null }>(
    `/api/v1/workflows/${workflowId}/schedule`,
    { method: 'POST' },
  )
}

export function listRuns(workflowId?: string): Promise<WorkflowRunRecord[]> {
  const path = workflowId ? `/api/v1/workflows/${workflowId}/runs` : '/api/v1/runs'
  return apiRequest<{ runs: WorkflowRunRecord[] }>(path).then((res) => res.runs)
}

export function fetchRun(runId: string): Promise<WorkflowRunRecord> {
  return apiRequest<WorkflowRunRecord>(`/api/v1/runs/${runId}`)
}
