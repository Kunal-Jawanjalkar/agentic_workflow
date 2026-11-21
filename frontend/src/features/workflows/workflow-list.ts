import type { WorkflowSummary } from '@/features/workflows/api'
import type { WorkflowListItem, WorkflowStatusKind } from '@/features/workflows/workflows-data'

const TRIGGER_LABELS: Record<string, string> = {
  manual: 'Manual',
  webhook: 'Webhook',
  schedule: 'Schedule',
}

function statusForRecord(
  status: WorkflowSummary['status'],
  version: number,
): { kind: WorkflowStatusKind; label: string } {
  if (status === 'active') {
    return { kind: 'published', label: `Published v${version}` }
  }
  if (status === 'archived') {
    return { kind: 'draft', label: 'Archived' }
  }
  return { kind: 'draft', label: 'Draft' }
}

function formatRelativeTime(iso: string): string {
  const updated = new Date(iso)
  const seconds = Math.round((Date.now() - updated.getTime()) / 1000)
  if (seconds < 60) {
    return 'Just now'
  }
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) {
    return `${minutes}m ago`
  }
  const hours = Math.round(minutes / 60)
  if (hours < 24) {
    return `${hours}h ago`
  }
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

export function mapWorkflowSummaryToListItem(summary: WorkflowSummary): WorkflowListItem {
  const triggerType =
    summary.trigger_type === 'webhook' || summary.trigger_type === 'manual'
      ? summary.trigger_type
      : 'manual'
  const triggerLabel =
    (summary.trigger_type && TRIGGER_LABELS[summary.trigger_type]) ?? 'Manual'

  return {
    id: summary.id,
    name: summary.name,
    description: summary.description?.trim() || 'No description',
    status: statusForRecord(summary.status, summary.version),
    trigger: { type: triggerType, label: triggerLabel },
    passRate: '—',
    costPerRun: '—',
    lastRun: formatRelativeTime(summary.updated_at),
  }
}