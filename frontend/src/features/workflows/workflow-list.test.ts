import { describe, expect, it, vi } from 'vitest'

import type { WorkflowSummary } from '@/features/workflows/api'

import { mapWorkflowSummaryToListItem } from './workflow-list'

describe('mapWorkflowSummaryToListItem', () => {
  it('maps draft workflows with trigger type from the API', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-02T12:00:00.000Z'))

    const summary: WorkflowSummary = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Onboarding',
      description: null,
      status: 'draft',
      version: 2,
      trigger_type: 'webhook',
      updated_at: '2026-01-02T11:58:00.000Z',
    }

    expect(mapWorkflowSummaryToListItem(summary)).toMatchObject({
      id: summary.id,
      name: 'Onboarding',
      description: 'No description',
      status: { kind: 'draft', label: 'Draft' },
      trigger: { type: 'webhook', label: 'Webhook' },
      lastRun: '2m ago',
    })

    vi.useRealTimers()
  })

  it('maps scheduler trigger type cleanly', () => {
    const item = mapWorkflowSummaryToListItem({
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Daily Digest',
      description: null,
      status: 'active',
      version: 1,
      trigger_type: 'scheduler',
      updated_at: '2026-01-02T11:58:00.000Z',
    })

    expect(item.trigger).toEqual({ type: 'scheduler', label: 'Scheduler' })
  })
})