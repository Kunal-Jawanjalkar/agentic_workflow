import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AppBrand } from './AppBrand'

describe('AppBrand', () => {
  it('links to home with visible wordmark and logo mark', () => {
    render(
      <MemoryRouter>
        <AppBrand />
      </MemoryRouter>,
    )

    const link = screen.getByRole('link', { name: /handoff/i })
    expect(link).toHaveAttribute('href', '/')
    expect(screen.getByText('Handoff')).toBeInTheDocument()
    expect(link.querySelector('[aria-hidden="true"]')).toHaveTextContent('H')
  })
})
