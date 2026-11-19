export type WorkflowFilter = 'all' | 'published' | 'drafts' | 'needs_attention'

export type WorkflowStatusKind =
  | 'published'
  | 'unpublished_edits'
  | 'last_run_failed'
  | 'draft'

export type WorkflowTriggerType = 'webhook' | 'manual'

export type WorkflowListItem = {
  id: string
  name: string
  description: string
  status: { kind: WorkflowStatusKind; label: string }
  trigger: { type: WorkflowTriggerType; label: string }
  passRate: string
  costPerRun: string
  lastRun: string
}

export const workflowFilters: { value: WorkflowFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'drafts', label: 'Drafts' },
  { value: 'needs_attention', label: 'Needs attention' },
]

export const workflows: WorkflowListItem[] = [
  {
    id: 'support-triage',
    name: 'Support triage',
    description: 'Classify, draft, approve, send',
    status: { kind: 'published', label: 'Published v4' },
    trigger: { type: 'webhook', label: 'Webhook' },
    passRate: '87%',
    costPerRun: '$0.012',
    lastRun: '2m ago',
  },
  {
    id: 'pr-summary',
    name: 'PR summary',
    description: 'Summarize pull requests for reviewers',
    status: { kind: 'unpublished_edits', label: 'Unpublished edits' },
    trigger: { type: 'manual', label: 'Manual' },
    passRate: '92%',
    costPerRun: '$0.004',
    lastRun: '9m ago',
  },
  {
    id: 'lead-scoring',
    name: 'Lead scoring',
    description: 'Score inbound leads from CRM events',
    status: { kind: 'last_run_failed', label: 'Last run failed' },
    trigger: { type: 'webhook', label: 'Webhook' },
    passRate: '—',
    costPerRun: '$0.000',
    lastRun: '21m ago',
  },
  {
    id: 'onboarding',
    name: 'Onboarding',
    description: 'Welcome sequence for new accounts',
    status: { kind: 'draft', label: 'Draft' },
    trigger: { type: 'manual', label: 'Manual' },
    passRate: '—',
    costPerRun: '—',
    lastRun: '—',
  },
  {
    id: 'invoice-reminders',
    name: 'Invoice reminders',
    description: 'Nudge overdue invoices via email',
    status: { kind: 'published', label: 'Published v2' },
    trigger: { type: 'webhook', label: 'Webhook' },
    passRate: '96%',
    costPerRun: '$0.008',
    lastRun: '1h ago',
  },
]
