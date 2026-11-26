import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createQueryWrapper } from '@/test/test-utils'

import * as credentialsApi from './api'
import { CredentialsPage } from './CredentialsPage'

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return {
    ...actual,
    listCredentials: vi.fn(),
    createCredential: vi.fn(),
    updateCredential: vi.fn(),
    deleteCredential: vi.fn(),
  }
})

describe('CredentialsPage', () => {
  beforeEach(() => {
    vi.mocked(credentialsApi.listCredentials).mockReset()
    vi.mocked(credentialsApi.createCredential).mockReset()
    vi.mocked(credentialsApi.updateCredential).mockReset()
    vi.mocked(credentialsApi.deleteCredential).mockReset()
  })

  it('renders empty state when no credentials exist', async () => {
    vi.mocked(credentialsApi.listCredentials).mockResolvedValue([])

    render(<CredentialsPage />, { wrapper: createQueryWrapper() })

    expect(await screen.findByText('No credentials yet')).toBeInTheDocument()
  })

  it('allows adding a Google, OpenAI, or Anthropic credential', async () => {
    const user = userEvent.setup()
    vi.mocked(credentialsApi.listCredentials).mockResolvedValue([])
    vi.mocked(credentialsApi.createCredential).mockResolvedValue({
      id: 'cred-1',
      name: 'Gemini Key',
      provider: 'google',
      created_at: '2026-11-26T17:00:00.000Z',
    })

    render(<CredentialsPage />, { wrapper: createQueryWrapper() })

    await screen.findByText('No credentials yet')
    await user.click(screen.getByRole('button', { name: /Add credential/i }))

    const providerSelect = screen.getByLabelText('Provider')
    expect(screen.getByRole('option', { name: 'OpenAI' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Anthropic' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Google (Gemini)' })).toBeInTheDocument()

    await user.selectOptions(providerSelect, 'google')
    await user.type(screen.getByLabelText('Credential name'), 'Gemini Key')
    await user.type(screen.getByLabelText('API key'), 'AIza-test-key')
    await user.click(screen.getByRole('button', { name: 'Save credential' }))

    await waitFor(() => {
      expect(credentialsApi.createCredential).toHaveBeenCalledWith({
        name: 'Gemini Key',
        provider: 'google',
        apiKey: 'AIza-test-key',
      })
    })
  })

  it('validates required name and API key before submitting', async () => {
    const user = userEvent.setup()
    vi.mocked(credentialsApi.listCredentials).mockResolvedValue([])

    render(<CredentialsPage />, { wrapper: createQueryWrapper() })

    await screen.findByText('No credentials yet')
    await user.click(screen.getByRole('button', { name: /Add credential/i }))
    await user.click(screen.getByRole('button', { name: 'Save credential' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Credential name is required.')
    expect(credentialsApi.createCredential).not.toHaveBeenCalled()
  })

  it('supports editing and deleting an existing credential', async () => {
    const user = userEvent.setup()
    vi.mocked(credentialsApi.listCredentials).mockResolvedValue([
      {
        id: 'cred-1',
        name: 'Claude Main',
        provider: 'anthropic',
        created_at: '2026-11-26T17:00:00.000Z',
      },
    ])
    vi.mocked(credentialsApi.updateCredential).mockResolvedValue({
      id: 'cred-1',
      name: 'Claude Prod',
      provider: 'anthropic',
      created_at: '2026-11-26T17:00:00.000Z',
    })
    vi.mocked(credentialsApi.deleteCredential).mockResolvedValue(undefined)

    render(<CredentialsPage />, { wrapper: createQueryWrapper() })

    expect(await screen.findByText('Claude Main')).toBeInTheDocument()
    expect(screen.getByText('Anthropic')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit Claude Main' }))
    const nameInput = screen.getByLabelText('Credential name')
    await user.clear(nameInput)
    await user.type(nameInput, 'Claude Prod')
    await user.click(screen.getByRole('button', { name: 'Update credential' }))

    await waitFor(() => {
      expect(credentialsApi.updateCredential).toHaveBeenCalledWith({
        credentialId: 'cred-1',
        name: 'Claude Prod',
        provider: 'anthropic',
      })
    })

    await user.click(screen.getByRole('button', { name: 'Delete Claude Main' }))
    await waitFor(() => {
      expect(credentialsApi.deleteCredential).toHaveBeenCalledWith('cred-1')
    })
  })
})
