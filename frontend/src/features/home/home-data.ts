export type DashboardStat = {
  label: string
  value: string
}

export type AttentionItem = {
  id: string
  icon: 'approval' | 'alert'
  message: string
  workflow: string
  actionLabel: string
}

export type RunStatus = 'waiting' | 'succeeded' | 'failed'

export type RecentRun = {
  id: string
  workflow: string
  status: RunStatus
  cost: string
  started: string
}

export const dashboardStats: DashboardStat[] = [
  { label: 'Runs today', value: '128' },
  { label: 'Success rate', value: '94%' },
  { label: 'Awaiting approval', value: '3' },
  { label: 'Spend today', value: '$1.82' },
]

export const attentionItems: AttentionItem[] = [
  {
    id: '1',
    icon: 'approval',
    message: 'Refund of $240 for order #8821 needs approval',
    workflow: 'Support triage',
    actionLabel: 'Review',
  },
  {
    id: '2',
    icon: 'approval',
    message: 'Draft reply to Acme Corp awaiting approval',
    workflow: 'Support triage',
    actionLabel: 'Review',
  },
  {
    id: '3',
    icon: 'alert',
    message: 'Run failed: Slack key is invalid',
    workflow: 'Lead scoring',
    actionLabel: 'Fix key',
  },
]

export const recentRuns: RecentRun[] = [
  {
    id: '1',
    workflow: 'Support triage',
    status: 'waiting',
    cost: '$0.012',
    started: '2m ago',
  },
  {
    id: '2',
    workflow: 'PR summary',
    status: 'succeeded',
    cost: '$0.004',
    started: '9m ago',
  },
  {
    id: '3',
    workflow: 'Lead scoring',
    status: 'failed',
    cost: '$0.000',
    started: '21m ago',
  },
]
