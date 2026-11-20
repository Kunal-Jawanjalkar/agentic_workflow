import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createQueryWrapper } from '@/test/test-utils'

import * as nodeTypesApi from './api'
import { AddNodePanel } from './AddNodePanel'
import type { NodeTypeListResponse } from './types'

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return {
    ...actual,
    fetchNodeTypes: vi.fn(),
  }
})

const catalog: NodeTypeListResponse = {
  node_types: [
    {
      type: 'trigger',
      version: 1,
      label: 'Trigger',
      category: 'trigger',
      icon: 'bolt',
      outputs: ['default'],
      config_schema: { properties: {} },
    },
    {
      type: 'llm',
      version: 1,
      label: 'LLM',
      category: 'ai',
      icon: 'sparkles',
      outputs: ['default'],
      config_schema: { properties: { model: { type: 'string' } }, required: ['model'] },
    },
  ],
}

describe('AddNodePanel', () => {
  beforeEach(() => {
    vi.mocked(nodeTypesApi.fetchNodeTypes).mockReset()
  })

  it('renders node types from the catalog', async () => {
    vi.mocked(nodeTypesApi.fetchNodeTypes).mockResolvedValue(catalog)

    render(<AddNodePanel hasTrigger={false} onAddNode={vi.fn()} />, { wrapper: createQueryWrapper() })

    expect(await screen.findByRole('button', { name: /Trigger/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /LLM/ })).toBeInTheDocument()
    expect(screen.getByText('AI')).toBeInTheDocument()
  })

  it('adds the selected node type', async () => {
    vi.mocked(nodeTypesApi.fetchNodeTypes).mockResolvedValue(catalog)
    const onAddNode = vi.fn()
    const user = userEvent.setup()

    render(<AddNodePanel hasTrigger={false} onAddNode={onAddNode} />, {
      wrapper: createQueryWrapper(),
    })

    await user.click(await screen.findByRole('button', { name: /LLM/ }))

    expect(onAddNode).toHaveBeenCalledWith(catalog.node_types[1])
  })

  it('shows an error when the catalog request fails', async () => {
    vi.mocked(nodeTypesApi.fetchNodeTypes).mockRejectedValue(new Error('offline'))

    render(<AddNodePanel hasTrigger={false} onAddNode={vi.fn()} />, { wrapper: createQueryWrapper() })

    expect(await screen.findByText('Could not load node types.')).toBeInTheDocument()
  })

  it('disables a second trigger', async () => {
    vi.mocked(nodeTypesApi.fetchNodeTypes).mockResolvedValue(catalog)
    const onAddNode = vi.fn()

    render(<AddNodePanel hasTrigger onAddNode={onAddNode} />, { wrapper: createQueryWrapper() })

    const trigger = await screen.findByRole('button', { name: /Trigger/ })
    expect(trigger).toBeDisabled()
    expect(screen.getByText('Only one trigger')).toBeInTheDocument()
    expect(onAddNode).not.toHaveBeenCalled()
  })
})
