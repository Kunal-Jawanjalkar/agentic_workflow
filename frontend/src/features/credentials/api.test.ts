import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiRequest } from '@/lib/api'

import {
  createCredential,
  deleteCredential,
  listCredentials,
  providerLabel,
  updateCredential,
} from './api'

vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn(),
}))

describe('credentials api', () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset()
  })

  it('lists credentials from /api/v1/credentials', async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      credentials: [
        {
          id: 'cred-1',
          name: 'OpenAI Main',
          provider: 'openai',
          created_at: '2026-11-26T17:00:00.000Z',
        },
      ],
    })

    const result = await listCredentials()

    expect(apiRequest).toHaveBeenCalledWith('/api/v1/credentials')
    expect(result).toHaveLength(1)
    expect(result[0]?.name).toBe('OpenAI Main')
  })

  it('creates a credential with secret.apiKey', async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      id: 'cred-2',
      name: 'Gemini Key',
      provider: 'google',
      created_at: '2026-11-26T17:00:00.000Z',
    })

    await createCredential({
      name: ' Gemini Key ',
      provider: 'google',
      apiKey: ' AIza-secret ',
    })

    expect(apiRequest).toHaveBeenCalledWith('/api/v1/credentials', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Gemini Key',
        provider: 'google',
        secret: { apiKey: 'AIza-secret' },
      }),
    })
  })

  it('updates and deletes credentials', async () => {
    vi.mocked(apiRequest).mockResolvedValue({})

    await updateCredential({
      credentialId: 'cred-1',
      name: 'Claude Key',
      provider: 'anthropic',
    })
    expect(apiRequest).toHaveBeenCalledWith('/api/v1/credentials/cred-1', {
      method: 'PATCH',
      body: JSON.stringify({
        name: 'Claude Key',
        provider: 'anthropic',
      }),
    })

    await deleteCredential('cred-1')
    expect(apiRequest).toHaveBeenCalledWith('/api/v1/credentials/cred-1', {
      method: 'DELETE',
    })
  })

  it('formats supported provider labels', () => {
    expect(providerLabel('openai')).toBe('OpenAI')
    expect(providerLabel('anthropic')).toBe('Anthropic')
    expect(providerLabel('google')).toBe('Google (Gemini)')
  })
})
