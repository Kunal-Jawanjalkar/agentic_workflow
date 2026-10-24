import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { createQueryWrapper } from '@/test/test-utils'
import type { UserPublic } from '@/types/auth'

import * as authApi from './api'
import { ProtectedRoute } from './ProtectedRoute'

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return {
    ...actual,
    fetchCurrentUser: vi.fn(),
  }
})

const user: UserPublic = {
  id: '1',
  email: 'user@example.com',
  first_name: 'Test',
  last_name: 'User',
  created_at: '2026-01-01T00:00:00.000Z',
}

function renderProtected(initialPath = '/app') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <div>Protected content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>,
    { wrapper: createQueryWrapper() },
  )
}

describe('ProtectedRoute', () => {
  it('shows loading while session is fetched', () => {
    vi.mocked(authApi.fetchCurrentUser).mockReturnValue(new Promise(() => {}))

    renderProtected()

    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('redirects to login when unauthenticated', async () => {
    vi.mocked(authApi.fetchCurrentUser).mockRejectedValue(new Error('401'))

    renderProtected()

    expect(await screen.findByText('Login page')).toBeInTheDocument()
  })

  it('renders children when user is authenticated', async () => {
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValue(user)

    renderProtected()

    expect(await screen.findByText('Protected content')).toBeInTheDocument()
  })
})
