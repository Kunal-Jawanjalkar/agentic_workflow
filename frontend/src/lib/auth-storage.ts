import type { UserPublic } from '@/types/auth'

const USER_KEY = 'auth_user'

export function setAuthSession(user: UserPublic): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuthSession(): void {
  localStorage.removeItem(USER_KEY)
}

export function getStoredUser(): UserPublic | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw) as UserPublic
  } catch {
    return null
  }
}
