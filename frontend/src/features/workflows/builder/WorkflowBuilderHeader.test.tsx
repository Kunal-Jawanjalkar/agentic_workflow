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

  it('asks for confirmation before publishing and unpublishing', async () => {
    const user = userEvent.setup()
    const onPublish = vi.fn()
    const onUnpublish = vi.fn()
    const onRunTest = vi.fn()

    const { rerender } = render(
      <WorkflowBuilderHeader
        title="Support triage"
        statusLabel="Draft, unpublished edits"
        statusTone="draft"
        savedLabel="Saved just now"
        onPublish={onPublish}
        onUnpublish={onUnpublish}
        onRunTest={onRunTest}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Run test' }))
    expect(onRunTest).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Publish' }))
    expect(onPublish).not.toHaveBeenCalled()
    expect(screen.getByText('Publish workflow?')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Confirm publish' }))
    expect(onPublish).toHaveBeenCalledTimes(1)

    rerender(
      <WorkflowBuilderHeader
        title="Support triage"
        statusLabel="Published v1"
        statusTone="published"
        savedLabel="Saved just now"
        onPublish={onPublish}
        onUnpublish={onUnpublish}
        onRunTest={onRunTest}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Unpublish' }))
    expect(onUnpublish).not.toHaveBeenCalled()
    expect(screen.getByText('Unpublish workflow?')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Confirm unpublish' }))
    expect(onUnpublish).toHaveBeenCalledTimes(1)
  })
})