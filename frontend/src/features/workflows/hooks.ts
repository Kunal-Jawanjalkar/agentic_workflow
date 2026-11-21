import { useQuery } from '@tanstack/react-query'

import { listWorkflows, workflowQueryKeys } from '@/features/workflows/api'

export function useWorkflowList() {
  return useQuery({
    queryKey: workflowQueryKeys.list,
    queryFn: listWorkflows,
  })
}