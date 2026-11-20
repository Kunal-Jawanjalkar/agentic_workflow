import { useQuery } from '@tanstack/react-query'

import { fetchNodeTypes, nodeTypesQueryKeys } from './api'

export function useNodeTypes() {
  return useQuery({
    queryKey: nodeTypesQueryKeys.all,
    queryFn: fetchNodeTypes,
  })
}
