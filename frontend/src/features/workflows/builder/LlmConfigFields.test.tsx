import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Edge, Node } from '@xyflow/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as credentialsApi from '@/features/credentials/api'
import type { BuilderNodeData } from '@/features/workflows/builder/types'
import { createQueryWrapper } from '@/test/test-utils'

import { buildUpstreamPromptVariables } from './llm-config'
import { LlmConfigFields } from './LlmConfigFields'

vi.mock('@/features/credentials/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/credentials/api')>()
  return {
    ...actual,
    listCredentials: vi.fn(),
  }
})

function renderWithProviders(ui: React.ReactNode) {
  const QueryWrapper = createQueryWrapper()
  return render(
    <MemoryRouter>
      <QueryWrapper>{ui}</QueryWrapper>
    </MemoryRouter>,
  )
}

const sampleNodes: Node<BuilderNodeData>[] = [
  {
    id: 'trigger-1',
    type: 'workflow',
    position: { x: 0, y: 0 },
    data: {
      label: 'Trigger',
      type: 'trigger',
      version: 1,
      config: { trigger_type: 'webhook', webhook_method: 'POST' },
    },
  },
  {
    id: 'llm-1',
    type: 'workflow',
    position: { x: 0, y: 120 },
    data: {
      label: 'Classify',
      type: 'llm',
      version: 1,
      config: {
        credential_label: 'OpenAI Key',
        model: 'gpt-4o-mini',
        prompt: 'Classify: {{ trigger.body }}',
        structured_output: true,
      },
    },
  },
  {
    id: 'llm-2',
    type: 'workflow',
    position: { x: 0, y: 240 },
    data: {
      label: 'Reply',
      type: 'llm',
      version: 1,
      config: {
        credential_label: '',
        model: '',
        prompt: 'Draft reply for: ',
        structured_output: false,
      },
    },
  },
]

const sampleEdges: Edge[] = [
  { id: 'e1', source: 'trigger-1', target: 'llm-1' },
  { id: 'e2', source: 'llm-1', target: 'llm-2' },
]

describe('LlmConfigFields', () => {
  beforeEach(() => {
    vi.mocked(credentialsApi.listCredentials).mockResolvedValue([
      {
        id: 'cred-1',
        name: 'OpenAI Key',
        provider: 'openai',
        created_at: '2026-11-26T17:00:00.000Z',
      },
      {
        id: 'cred-2',
        name: 'Gemini Key',
        provider: 'google',
        created_at: '2026-11-26T17:00:00.000Z',
      },
    ])
  })

  it('collects upstream prompt variables from connected previous nodes', () => {
    const vars = buildUpstreamPromptVariables('llm-2', sampleNodes, sampleEdges)

    expect(vars.map((item) => item.token)).toEqual([
      '{{ text }}',
      '{{ parsed }}',
      '{{ trigger.body }}',
      '{{ trigger.query }}',
      '{{ trigger.headers }}',
    ])
  })

  it('renders credential and model dropdowns and defaults model when picking a credential', async () => {
    const user = userEvent.setup()
    const onPatch = vi.fn()

    renderWithProviders(
      <LlmConfigFields
        nodeId="llm-2"
        config={{
          credential_label: '',
          model: '',
          prompt: '',
          structured_output: false,
        }}
        nodes={sampleNodes}
        edges={sampleEdges}
        onPatch={onPatch}
      />,
    )

    const credentialSelect = await screen.findByLabelText('Credential')
    await screen.findByRole('option', { name: 'Gemini Key (Google (Gemini))' })
    await user.selectOptions(credentialSelect, 'Gemini Key')

    expect(onPatch).toHaveBeenCalledWith({
      credential_label: 'Gemini Key',
      model: 'gemini-3.5-flash',
    })
  })

  it('scopes model dropdown to the selected credential provider and updates model', async () => {
    const user = userEvent.setup()
    const onPatch = vi.fn()

    renderWithProviders(
      <LlmConfigFields
        nodeId="llm-2"
        config={{
          credential_label: 'Gemini Key',
          model: 'gemini-3.5-flash',
          prompt: '',
          structured_output: false,
        }}
        nodes={sampleNodes}
        edges={sampleEdges}
        onPatch={onPatch}
      />,
    )

    await screen.findByRole('option', { name: 'Gemini Key (Google (Gemini))' })
    expect(screen.queryByRole('option', { name: 'gpt-4o-mini' })).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Model'), 'gemini-3.1-pro-preview')
    expect(onPatch).toHaveBeenCalledWith({ model: 'gemini-3.1-pro-preview' })
  })

  it('inserts previous node output tokens into the prompt', async () => {
    const user = userEvent.setup()
    const onPatch = vi.fn()

    renderWithProviders(
      <LlmConfigFields
        nodeId="llm-2"
        config={{
          credential_label: 'OpenAI Key',
          model: 'gpt-4o-mini',
          prompt: 'Reply to: ',
          structured_output: false,
        }}
        nodes={sampleNodes}
        edges={sampleEdges}
        onPatch={onPatch}
      />,
    )

    await user.click(screen.getByRole('button', { name: '{{ trigger.body }}' }))
    expect(onPatch).toHaveBeenCalledWith({ prompt: 'Reply to: {{ trigger.body }}' })
  })
})
