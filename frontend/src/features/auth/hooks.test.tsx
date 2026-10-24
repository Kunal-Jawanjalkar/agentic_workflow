import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createQueryWrapper } from '@/test/test-utils'
import type { UserPublic } from '@/types/auth'

import * as authApi from './api'
import { useLoginMutation, useRegisterMutation } from './hooks'

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return {
    ...actual,
    loginUser: vi.fn(),
    registerUser: vi.fn(),
  }
})

describe('auth hooks', () => {
  it('useLoginMutation caches user on success', async () => {
    const user: UserPublic = {
      id: '1',
      email: 'user@example.com',
      first_name: 'Test',
      last_name: 'User',
      created_at: '2026-01-01T00:00:00.000Z',
    }
    vi.mocked(authApi.loginUser).mockResolvedValue({ user })

    const wrapper = createQueryWrapper()
    const { result } = renderHook(() => useLoginMutation(), { wrapper })

    result.current.mutate({
      email: 'user@example.com',
      password: 'password123',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.user).toEqual(user)
  })

  it('useRegisterMutation omits password_confirm from API payload', async () => {
    const user: UserPublic = {
      id: '1',
      email: 'user@example.com',
      first_name: 'Test',
      last_name: 'User',
      created_at: '2026-01-01T00:00:00.000Z',
    }
    vi.mocked(authApi.registerUser).mockResolvedValue(user)

    const { result } = renderHook(() => useRegisterMutation(), {
      wrapper: createQueryWrapper(),
    })

    result.current.mutate({
      email: 'user@example.com',
      password: 'password123',
      password_confirm: 'password123',
      first_name: 'Test',
      last_name: 'User',
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(authApi.registerUser).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
      first_name: 'Test',
      last_name: 'User',
    })
  })
})
