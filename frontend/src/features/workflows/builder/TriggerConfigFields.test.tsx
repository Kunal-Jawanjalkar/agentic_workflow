import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TriggerConfigFields } from './TriggerConfigFields'

describe('TriggerConfigFields', () => {
  it('renders manual trigger config and triggers test run', async () => {
    const user = userEvent.setup()
    const onPatch = vi.fn()
    const onRunTest = vi.fn()

    render(
      <TriggerConfigFields
        workflowId="wf-1"
        config={{ trigger_type: 'manual', default_input: { text: 'hi' } }}
        onPatch={onPatch}
        onRunTest={onRunTest}
      />,
    )

    expect(screen.getByLabelText('Trigger Type')).toHaveValue('manual')
    expect(screen.getByLabelText('Default Input (JSON)')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Run manual trigger/i }))
    expect(onRunTest).toHaveBeenCalledTimes(1)
  })

  it('renders webhook URL, method, and secret fields for webhook triggers', async () => {
    const user = userEvent.setup()
    const onPatch = vi.fn()

    render(
      <TriggerConfigFields
        workflowId="550e8400-e29b-41d4-a716-446655440000"
        config={{ trigger_type: 'webhook', webhook_method: 'POST' }}
        onPatch={onPatch}
      />,
    )

    const urlInput = screen.getByLabelText('Webhook URL') as HTMLInputElement
    expect(urlInput.value).toContain('/api/v1/webhooks/550e8400-e29b-41d4-a716-446655440000')

    await user.selectOptions(screen.getByLabelText('HTTP Method'), 'GET')
    expect(onPatch).toHaveBeenCalledWith({ webhook_method: 'GET' })
  })

  it('renders scheduler preset, cron, timezone, and sync button for scheduler triggers', async () => {
    const user = userEvent.setup()
    const onPatch = vi.fn()
    const onSyncSchedule = vi.fn()

    render(
      <TriggerConfigFields
        workflowId="wf-1"
        config={{ trigger_type: 'scheduler', cron: '*/5 * * * *', timezone: 'UTC' }}
        onPatch={onPatch}
        onSyncSchedule={onSyncSchedule}
      />,
    )

    await user.selectOptions(screen.getByLabelText('Schedule Preset'), '0 * * * *')
    expect(onPatch).toHaveBeenCalledWith({ cron: '0 * * * *' })

    await user.click(screen.getByRole('button', { name: /Sync Temporal schedule/i }))
    expect(onSyncSchedule).toHaveBeenCalledTimes(1)
  })
})
