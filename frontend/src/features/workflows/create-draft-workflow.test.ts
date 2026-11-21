import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as workflowApi from '@/features/workflows/api'

import { createDraftWorkflow } from './create-draft-workflow'

vi.mock('@/features/workflows/api', () => ({
  createWorkflow: vi.fn(),
}))

describe('createDraftWorkflow', () => {
  beforeEach(() => {
    vi.mocked(workflowApi.createWorkflow).mockReset()
    vi.mocked(workflowApi.createWorkflow).mockResolvedValue({
      id: 'w-1',
      name: 'Untitled workflow',
      description: null,
      status: 'draft',
      version: 1,
      graph: { nodes: [], edges: [] },
      updated_at: new Date().toISOString(),
    })
  })

  it('reuses one in-flight create request', async () => {
    const first = createDraftWorkflow()
    const second = createDraftWorkflow()

    await Promise.all([first, second])

    expect(workflowApi.createWorkflow).toHaveBeenCalledTimes(1)
    expect(await first).toMatchObject({ id: 'w-1' })
    expect(await second).toMatchObject({ id: 'w-1' })
  })
})