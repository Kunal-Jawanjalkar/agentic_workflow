import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiRequest } from '@/lib/api'

import { fetchNodeTypes, nodeTypesQueryKeys } from './api'

vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn(),
}))

describe('node types api', () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset()
  })

  it('exposes a stable query key', () => {
    expect(nodeTypesQueryKeys.all).toEqual(['node-types'])
  })

  it('fetchNodeTypes calls the catalog endpoint', async () => {
    vi.mocked(apiRequest).mockResolvedValue({ node_types: [] })

    await fetchNodeTypes()

    expect(apiRequest).toHaveBeenCalledWith('/api/v1/node-types')
  })
})
