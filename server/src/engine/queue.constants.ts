export const WORKFLOW_NODES_QUEUE = 'workflow-nodes'
export const WORKFLOW_SCHEDULES_QUEUE = 'workflow-schedules'

export const EXECUTE_NODE_JOB = 'execute-node'
export const SCHEDULED_TRIGGER_JOB = 'scheduled-trigger'

export const DEFAULT_NODE_JOB_ATTEMPTS = 3
export const DEFAULT_NODE_BACKOFF_MS = 2000
export const DEFAULT_WORKER_LOCK_DURATION_MS = 90_000

export interface NodeJobPayload {
  runId: string
  ownerId: string
  workflowId: string
  workflowVersionId: string
  nodeId: string
}

export interface ScheduleJobPayload {
  ownerId: string
  workflowId: string
  cron: string
  timezone: string
}
