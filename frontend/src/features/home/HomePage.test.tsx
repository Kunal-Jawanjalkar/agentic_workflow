import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { HomePage } from './HomePage'

vi.mock('@/features/home/get-greeting', () => ({
  getGreeting: () => 'Good morning',
}))

describe('HomePage', () => {
  it('renders dashboard sections from mock data', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Good morning' })).toBeInTheDocument()
    expect(screen.getByText('Runs today')).toBeInTheDocument()
    expect(screen.getByText('128')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Needs your attention' })).toBeInTheDocument()
    expect(
      screen.getByText('Refund of $240 for order #8821 needs approval'),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Recent runs' })).toBeInTheDocument()
    expect(screen.getAllByText('Lead scoring').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('link', { name: 'New workflow' })).toHaveAttribute(
      'href',
      '/workflows/new',
    )
  })
})
