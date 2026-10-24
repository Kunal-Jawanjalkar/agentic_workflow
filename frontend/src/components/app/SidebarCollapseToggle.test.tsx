import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { SidebarProvider } from '@/components/ui/sidebar'

import { SidebarCollapseToggle } from './SidebarCollapseToggle'

describe('SidebarCollapseToggle', () => {
  it('toggles sidebar expanded state', async () => {
    const user = userEvent.setup()

    render(
      <SidebarProvider defaultOpen>
        <SidebarCollapseToggle />
      </SidebarProvider>,
    )

    const button = screen.getByRole('button', { name: 'Collapse sidebar' })
    expect(button).toHaveAttribute('aria-expanded', 'true')

    await user.click(button)

    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })
})
