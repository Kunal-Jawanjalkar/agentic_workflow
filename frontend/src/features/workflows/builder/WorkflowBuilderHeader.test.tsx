import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

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

  it('renames the workflow when the pencil edit flow is used', async () => {
    const user = userEvent.setup()
    const onTitleChange = vi.fn().mockResolvedValue(undefined)

    render(
      <WorkflowBuilderHeader
        title="Untitled workflow"
        statusLabel="Draft"
        statusTone="draft"
        savedLabel="Saved just now"
        titleEditable
        onTitleChange={onTitleChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Edit workflow name' }))
    const input = screen.getByLabelText('Workflow name')
    await user.clear(input)
    await user.type(input, 'Lead scoring')
    await user.click(screen.getByRole('button', { name: 'Save workflow name' }))

    expect(onTitleChange).toHaveBeenCalledWith('Lead scoring')
  })

  it('calls onPublish and onRunTest when clicked', async () => {
    const user = userEvent.setup()
    const onPublish = vi.fn()
    const onRunTest = vi.fn()

    render(
      <WorkflowBuilderHeader
        title="Support triage"
        statusLabel="Draft, unpublished edits"
        statusTone="draft"
        savedLabel="Saved just now"
        onPublish={onPublish}
        onRunTest={onRunTest}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Run test' }))
    await user.click(screen.getByRole('button', { name: 'Publish' }))

    expect(onRunTest).toHaveBeenCalledTimes(1)
    expect(onPublish).toHaveBeenCalledTimes(1)
  })
})