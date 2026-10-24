import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiRequest } from '@/lib/api'

import {
  authQueryKeys,
  fetchCurrentUser,
  loginUser,
  registerUser,
} from './api'

vi.mock('@/lib/api', () => ({
  apiRequest: vi.fn(),
}))

describe('auth api', () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset()
  })

  it('exposes stable me query key', () => {
    expect(authQueryKeys.me).toEqual(['auth', 'me'])
  })

  it('fetchCurrentUser calls me endpoint', async () => {
    vi.mocked(apiRequest).mockResolvedValue({ id: '1' })

    await fetchCurrentUser()

    expect(apiRequest).toHaveBeenCalledWith('/api/v1/auth/me')
  })

  it('registerUser posts registration body', async () => {
    const body = {
      email: 'user@example.com',
      password: 'password123',
      first_name: 'Test',
      last_name: 'User',
    }
    vi.mocked(apiRequest).mockResolvedValue({ id: '1', ...body })

    await registerUser(body)

    expect(apiRequest).toHaveBeenCalledWith('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  })

  it('loginUser posts credentials', async () => {
    const body = { email: 'user@example.com', password: 'password123' }
    vi.mocked(apiRequest).mockResolvedValue({ user: { id: '1' } })

    await loginUser(body)

    expect(apiRequest).toHaveBeenCalledWith('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  })
})
