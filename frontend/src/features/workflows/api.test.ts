import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiRequest } from '@/lib/api'

import {
  createWorkflow,
  fetchWorkflow,
  isWorkflowUuid,
  listWorkflows,
  updateWorkflow,
} from './api'

vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn(),
}))

describe('workflows api', () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset()
  })

  it('createWorkflow posts default draft name', async () => {
    vi.mocked(apiRequest).mockResolvedValue({ id: 'id-1' })
    await createWorkflow()
    expect(apiRequest).toHaveBeenCalledWith('/api/v1/workflows', {
      method: 'POST',
      body: JSON.stringify({ name: 'Untitled workflow', description: null }),
    })
  })

  it('updateWorkflow patches graph payload', async () => {
    vi.mocked(apiRequest).mockResolvedValue({})
    await updateWorkflow('id-1', { graph: { nodes: [], edges: [] } })
    expect(apiRequest).toHaveBeenCalledWith('/api/v1/workflows/id-1', {
      method: 'PATCH',
      body: JSON.stringify({ graph: { nodes: [], edges: [] } }),
    })
  })

  it('fetchWorkflow loads by id', async () => {
    vi.mocked(apiRequest).mockResolvedValue({})
    await fetchWorkflow('id-1')
    expect(apiRequest).toHaveBeenCalledWith('/api/v1/workflows/id-1')
  })

  it('listWorkflows loads the current user workflows', async () => {
    vi.mocked(apiRequest).mockResolvedValue({ workflows: [{ id: 'w-1' }] })
    const workflows = await listWorkflows()
    expect(apiRequest).toHaveBeenCalledWith('/api/v1/workflows')
    expect(workflows).toEqual([{ id: 'w-1' }])
  })

  it('updateWorkflow patches workflow name', async () => {
    vi.mocked(apiRequest).mockResolvedValue({})
    await updateWorkflow('id-1', { name: 'Renamed' })
    expect(apiRequest).toHaveBeenCalledWith('/api/v1/workflows/id-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Renamed' }),
    })
  })

  it('isWorkflowUuid validates canonical uuids', () => {
    expect(isWorkflowUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
    expect(isWorkflowUuid('support-triage')).toBe(false)
    expect(isWorkflowUuid('new')).toBe(false)
  })
})