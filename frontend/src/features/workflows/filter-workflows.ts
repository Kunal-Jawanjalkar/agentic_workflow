import type { WorkflowFilter, WorkflowListItem } from './workflows-data'

function matchesFilter(item: WorkflowListItem, filter: WorkflowFilter): boolean {
  switch (filter) {
    case 'all':
      return true
    case 'published':
      return item.status.kind === 'published'
    case 'drafts':
      return item.status.kind === 'draft'
    case 'needs_attention':
      return (
        item.status.kind === 'last_run_failed' ||
        item.status.kind === 'unpublished_edits'
      )
    default:
      return true
  }
}

function matchesQuery(item: WorkflowListItem, query: string): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return true
  }
  return (
    item.name.toLowerCase().includes(normalized) ||
    item.description.toLowerCase().includes(normalized)
  )
}

export function filterWorkflows(
  items: WorkflowListItem[],
  query: string,
  filter: WorkflowFilter,
): WorkflowListItem[] {
  return items.filter(
    (item) => matchesQuery(item, query) && matchesFilter(item, filter),
  )
}
