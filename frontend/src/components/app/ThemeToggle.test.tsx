import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { ThemeProvider } from '@/providers/ThemeProvider'

import { ThemeToggle } from './ThemeToggle'

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  )
}

describe('ThemeToggle', () => {
  it('switches theme from the dropdown menu', async () => {
    const user = userEvent.setup()
    renderToggle()

    await user.click(screen.getByRole('button', { name: /^Theme:/ }))

    await user.click(screen.getByRole('option', { name: 'Dark' }))
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    await user.click(screen.getByRole('button', { name: /^Theme:/ }))
    await user.click(screen.getByRole('option', { name: 'Light' }))
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    await user.click(screen.getByRole('button', { name: /^Theme:/ }))
    await user.click(screen.getByRole('option', { name: 'Default' }))
    expect(screen.getByRole('button', { name: 'Theme: Default' })).toBeInTheDocument()
  })

  it('portals the menu beside the icon trigger when expand is set', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <ThemeToggle iconOnly menuAlign="expand" />
      </ThemeProvider>,
    )

    await user.click(screen.getByRole('button', { name: /^Theme:/ }))

    const listbox = screen.getByRole('listbox', { name: 'Theme options' })
    expect(listbox.parentElement).toBe(document.body)
    expect(screen.getByRole('option', { name: 'Dark' })).toBeInTheDocument()
  })
})
