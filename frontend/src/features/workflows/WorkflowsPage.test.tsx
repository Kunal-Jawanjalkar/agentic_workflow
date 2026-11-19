import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { WorkflowsPage } from './WorkflowsPage'

describe('WorkflowsPage', () => {
  it('renders workflow table and filters list', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <WorkflowsPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Workflows' })).toBeInTheDocument()
    expect(screen.getByText('Support triage')).toBeInTheDocument()
    expect(screen.getByText('Published v4')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Drafts' }))
    expect(screen.getByText('Onboarding')).toBeInTheDocument()
    expect(screen.queryByText('Support triage')).not.toBeInTheDocument()
  })
})
