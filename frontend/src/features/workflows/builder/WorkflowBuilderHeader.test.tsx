import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { WorkflowBuilderHeader } from './WorkflowBuilderHeader'

describe('WorkflowBuilderHeader', () => {
  it('renders title, status, and action buttons', () => {
    render(
      <WorkflowBuilderHeader
        title="Support triage"
        statusLabel="Draft, unpublished edits"
        statusTone="draft"
        savedLabel="Saved 5s ago"
      />,
    )

    expect(screen.getByRole('heading', { name: 'Support triage' })).toBeInTheDocument()
    expect(screen.getByText('Draft, unpublished edits')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument()
  })
})
