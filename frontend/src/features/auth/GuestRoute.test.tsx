import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { createQueryWrapper } from '@/test/test-utils'
import type { UserPublic } from '@/types/auth'

import * as authApi from './api'
import { GuestRoute } from './GuestRoute'

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

function renderGuest(initialPath = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestRoute>
              <div>Login form</div>
            </GuestRoute>
          }
        />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>,
    { wrapper: createQueryWrapper() },
  )
}

describe('GuestRoute', () => {
  it('shows login page for guests', async () => {
    vi.mocked(authApi.fetchCurrentUser).mockRejectedValue(new Error('401'))

    renderGuest()

    expect(await screen.findByText('Login form')).toBeInTheDocument()
  })

  it('redirects authenticated users to home', async () => {
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValue(user)

    renderGuest()

    expect(await screen.findByText('Home')).toBeInTheDocument()
  })
})
