import { createWorkflow, type WorkflowRecord } from '@/features/workflows/api'

let createDraftInFlight: Promise<WorkflowRecord> | null = null

/** One POST per draft-open burst (e.g. React Strict Mode remount on /workflows/new). */
export function createDraftWorkflow(): Promise<WorkflowRecord> {
  if (createDraftInFlight == null) {
    createDraftInFlight = createWorkflow({ name: 'Untitled workflow' }).finally(() => {
      createDraftInFlight = null
    })
  }
  return createDraftInFlight
}