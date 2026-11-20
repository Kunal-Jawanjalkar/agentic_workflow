import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Node } from '@xyflow/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createQueryWrapper } from '@/test/test-utils'

import * as nodeTypesApi from './api'
import { NodeInspectorPanel } from './NodeInspectorPanel'
import type { BuilderNodeData, NodeTypeListResponse } from './types'

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
      config_schema: {
        properties: {
          trigger_type: {
            default: 'manual',
            description: ['manual', 'webhook', 'schedule'],
            title: 'Trigger Type',
            type: 'string',
          },
        },
        title: 'TriggerConfig',
        type: 'object',
      },
    },
    {
      type: 'notify',
      version: 1,
      label: 'Notify',
      category: 'io',
      icon: 'bell',
      outputs: ['default'],
      config_schema: {
        properties: {
          channel: {
            default: 'email',
            enum: ['email', 'slack', 'webhook'],
            title: 'Channel',
            type: 'string',
          },
          to: { default: '', title: 'To', type: 'string' },
        },
        title: 'NotifyConfig',
        type: 'object',
      },
    },
  ],
}

function triggerNode(): Node<BuilderNodeData> {
  return {
    id: 'trigger-1',
    type: 'workflow',
    position: { x: 0, y: 0 },
    data: {
      label: 'Trigger',
      type: 'trigger',
      version: 1,
      config: { trigger_type: 'manual' },
    },
  }
}

describe('NodeInspectorPanel', () => {
  beforeEach(() => {
    vi.mocked(nodeTypesApi.fetchNodeTypes).mockResolvedValue(catalog)
  })

  it('renders schema-driven fields for the selected node', async () => {
    render(<NodeInspectorPanel node={triggerNode()} onUpdateConfig={vi.fn()} />, {
      wrapper: createQueryWrapper(),
    })

    expect(await screen.findByText('Trigger Type')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveValue('manual')
  })

  it('calls onUpdateConfig when a field changes', async () => {
    const user = userEvent.setup()
    const onUpdateConfig = vi.fn()

    render(<NodeInspectorPanel node={triggerNode()} onUpdateConfig={onUpdateConfig} />, {
      wrapper: createQueryWrapper(),
    })

    await screen.findByText('Trigger Type')
    await user.selectOptions(screen.getByRole('combobox'), 'webhook')

    expect(onUpdateConfig).toHaveBeenCalledWith('trigger-1', { trigger_type: 'webhook' })
  })
})