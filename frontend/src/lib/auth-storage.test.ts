import { afterEach, describe, expect, it } from 'vitest'

import type { UserPublic } from '@/types/auth'

import {
  clearAuthSession,
  getStoredUser,
  setAuthSession,
} from './auth-storage'

const sampleUser: UserPublic = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'user@example.com',
  first_name: 'Test',
  last_name: 'User',
  created_at: '2026-01-01T00:00:00.000Z',
}

describe('auth-storage', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('stores and retrieves user from localStorage', () => {
    setAuthSession(sampleUser)

    expect(getStoredUser()).toEqual(sampleUser)
  })

  it('returns null when no session is stored', () => {
    expect(getStoredUser()).toBeNull()
  })

  it('returns null when stored JSON is invalid', () => {
    localStorage.setItem('auth_user', '{not-json')

    expect(getStoredUser()).toBeNull()
  })

  it('clears stored session', () => {
    setAuthSession(sampleUser)
    clearAuthSession()

    expect(getStoredUser()).toBeNull()
  })
})
