import { apiRequest } from '@/lib/api'

import type { NodeTypeListResponse } from './types'

export const nodeTypesQueryKeys = {
  all: ['node-types'] as const,
}

export function fetchNodeTypes(): Promise<NodeTypeListResponse> {
  return apiRequest<NodeTypeListResponse>('/api/v1/node-types')
}
