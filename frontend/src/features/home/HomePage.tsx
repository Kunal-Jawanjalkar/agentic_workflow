import { AlertTriangle, Hand, MoreHorizontal, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  attentionItems,
  dashboardStats,
  recentRuns,
  type RunStatus,
} from '@/features/home/home-data'
import { getGreeting } from '@/features/home/get-greeting'
import { cn } from '@/lib/utils'

const statusStyles: Record<RunStatus, string> = {
  waiting: 'bg-amber-500/15 text-amber-400',
  succeeded: 'bg-emerald-500/15 text-emerald-400',
  failed: 'bg-red-500/15 text-red-400',
}

const statusLabels: Record<RunStatus, string> = {
  waiting: 'Waiting',
  succeeded: 'Succeeded',
  failed: 'Failed',
}

export function HomePage() {
  return (
    <div className="flex min-h-full flex-col gap-8 p-6 md:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{getGreeting()}</h1>
        <div className="flex items-center gap-2">
          <Button type="button" className="gap-1.5">
            <Plus className="size-4" />
            New workflow
          </Button>
          <Button type="button" variant="outline" size="icon" aria-label="More actions">
            <MoreHorizontal className="size-4" />
          </Button>
        </div>
      </header>

      <section
        aria-label="Dashboard metrics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {dashboardStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border/60 bg-card px-5 py-4"
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{stat.value}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="attention-heading">
        <h2 id="attention-heading" className="mb-3 text-lg font-medium">
          Needs your attention
        </h2>
        <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-card">
          {attentionItems.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
            >
              <div className="flex min-w-0 items-start gap-3">
                {item.icon === 'approval' ? (
                  <Hand
                    className="mt-0.5 size-4 shrink-0 text-amber-400"
                    aria-hidden
                  />
                ) : (
                  <AlertTriangle
                    className="mt-0.5 size-4 shrink-0 text-red-400"
                    aria-hidden
                  />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug">{item.message}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.workflow}</p>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" className="shrink-0">
                {item.actionLabel}
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="recent-runs-heading">
        <h2 id="recent-runs-heading" className="mb-3 text-lg font-medium">
          Recent runs
        </h2>
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground">
                <th className="px-5 py-3 font-medium">Workflow</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Cost</th>
                <th className="px-5 py-3 font-medium">Started</th>
              </tr>
            </thead>
            <tbody>
              {recentRuns.map((run) => (
                <tr key={run.id} className="border-b border-border/40 last:border-0">
                  <td className="px-5 py-3.5 font-medium">{run.workflow}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={cn(
                        'inline-flex rounded-md px-2 py-0.5 text-xs font-medium',
                        statusStyles[run.status],
                      )}
                    >
                      {statusLabels[run.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 tabular-nums text-muted-foreground">
                    {run.cost}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{run.started}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
