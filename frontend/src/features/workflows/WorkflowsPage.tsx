import { Hand, Link2, MoreHorizontal, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { filterWorkflows } from '@/features/workflows/filter-workflows'
import {
  workflowFilters,
  workflows,
  type WorkflowFilter,
  type WorkflowListItem,
  type WorkflowStatusKind,
} from '@/features/workflows/workflows-data'
import { cn } from '@/lib/utils'

const statusStyles: Record<WorkflowStatusKind, string> = {
  published: 'bg-emerald-500/15 text-emerald-400',
  unpublished_edits: 'bg-amber-500/15 text-amber-400',
  last_run_failed: 'bg-red-500/15 text-red-400',
  draft: 'border border-border/80 bg-transparent text-muted-foreground',
}

function TriggerCell({ trigger }: { trigger: WorkflowListItem['trigger'] }) {
  const Icon = trigger.type === 'webhook' ? Link2 : Hand
  return (
    <span className="inline-flex items-center gap-2 text-muted-foreground">
      <Icon className="size-4 shrink-0" aria-hidden />
      {trigger.label}
    </span>
  )
}

export function WorkflowsPage() {
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<WorkflowFilter>('all')

  const visibleWorkflows = useMemo(
    () => filterWorkflows(workflows, query, activeFilter),
    [query, activeFilter],
  )

  return (
    <div className="flex min-h-full flex-col gap-6 p-6 md:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Workflows</h1>
        <Button type="button" variant="outline" className="gap-1.5" render={<Link to="/workflows/new" />}>
          <Plus className="size-4" />
          New workflow
        </Button>
      </header>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-md">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Search workflows"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-8"
            aria-label="Search workflows"
          />
        </div>
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Filter workflows"
        >
          {workflowFilters.map((filter) => {
            const selected = activeFilter === filter.value
            return (
              <Button
                key={filter.value}
                type="button"
                size="sm"
                variant={selected ? 'secondary' : 'outline'}
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveFilter(filter.value)}
              >
                {filter.label}
              </Button>
            )
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 text-muted-foreground">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Trigger</th>
              <th className="px-5 py-3 font-medium">Pass rate</th>
              <th className="px-5 py-3 font-medium">Cost / run</th>
              <th className="px-5 py-3 font-medium">Last run</th>
              <th className="px-5 py-3 font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleWorkflows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-10 text-center text-muted-foreground"
                >
                  No workflows match your search.
                </td>
              </tr>
            ) : (
              visibleWorkflows.map((workflow) => (
                <tr
                  key={workflow.id}
                  className="border-b border-border/40 last:border-0"
                >
                  <td className="px-5 py-4">
                    <Link
                      to={`/workflows/${workflow.id}`}
                      className="group block min-w-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="font-medium group-hover:underline">
                        {workflow.name}
                      </span>
                      <span className="mt-0.5 block text-muted-foreground">
                        {workflow.description}
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        'inline-flex rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap',
                        statusStyles[workflow.status.kind],
                      )}
                    >
                      {workflow.status.label}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <TriggerCell trigger={workflow.trigger} />
                  </td>
                  <td className="px-5 py-4 tabular-nums">{workflow.passRate}</td>
                  <td className="px-5 py-4 tabular-nums text-muted-foreground">
                    {workflow.costPerRun}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{workflow.lastRun}</td>
                  <td className="px-5 py-4 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${workflow.name}`}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
