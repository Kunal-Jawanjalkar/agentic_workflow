import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError, apiRequest } from './api'

describe('apiRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns parsed JSON on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: '1' }),
      }),
    )

    const data = await apiRequest<{ id: string }>('/api/v1/test')

    expect(data).toEqual({ id: '1' })
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/test',
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('returns undefined for 204 responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        json: async () => ({}),
      }),
    )

    const data = await apiRequest<void>('/api/v1/logout', { method: 'POST' })

    expect(data).toBeUndefined()
  })

  it('throws ApiError with string detail from error body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ detail: 'Not authenticated' }),
      }),
    )

    await expect(apiRequest('/api/v1/auth/me')).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: 'Not authenticated',
    })
  })

  it('throws ApiError with validation detail message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        statusText: 'Unprocessable',
        json: async () => ({
          detail: [{ msg: 'Invalid email' }],
        }),
      }),
    )

    await expect(apiRequest('/api/v1/auth/register')).rejects.toEqual(
      new ApiError(422, 'Invalid email'),
    )
  })

  it('sets Content-Type when body is provided', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      }),
    )

    await apiRequest('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'a@b.co', password: 'x' }),
    })

    const [, options] = vi.mocked(fetch).mock.calls[0]
    const headers = options?.headers as Headers
    expect(headers.get('Content-Type')).toBe('application/json')
  })
})
