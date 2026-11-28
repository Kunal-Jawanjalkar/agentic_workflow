import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { fetchRun, listRuns, type WorkflowRunRecord } from '@/features/runs/api'
import { cn } from '@/lib/utils'

function statusTone(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-emerald-500/15 text-emerald-400'
    case 'failed':
      return 'bg-destructive/15 text-destructive'
    case 'running':
      return 'bg-sky-500/15 text-sky-400'
    default:
      return 'bg-amber-500/15 text-amber-400'
  }
}

export function RunsPage() {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)

  const runsQuery = useQuery({
    queryKey: ['runs', 'list'],
    queryFn: () => listRuns(),
    refetchInterval: 4000,
  })

  const activeRunId = selectedRunId ?? runsQuery.data?.[0]?.id ?? null

  const detailQuery = useQuery({
    queryKey: ['runs', 'detail', activeRunId],
    queryFn: () => fetchRun(activeRunId!),
    enabled: Boolean(activeRunId),
    refetchInterval: 3000,
  })

  const runs: WorkflowRunRecord[] = runsQuery.data ?? []

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Runs</h1>
        <p className="text-sm text-muted-foreground">
          Workflow executions and per-node outputs.
        </p>
      </div>

      {runsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading runs…</p>
      ) : runsQuery.isError ? (
        <p className="text-sm text-destructive">Could not load runs.</p>
      ) : runs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No workflow runs yet. Open a workflow and click Run test to start one.
        </p>
      ) : (
        <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[340px_1fr]">
          <div className="space-y-2 overflow-y-auto rounded-xl border border-border/60 bg-card/30 p-3">
            {runs.map((run) => (
              <button
                key={run.id}
                type="button"
                onClick={() => setSelectedRunId(run.id)}
                className={cn(
                  'flex w-full flex-col gap-1 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors',
                  activeRunId === run.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border/50 hover:bg-muted/40',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">
                    {run.workflow_name ?? 'Workflow'}
                  </span>
                  <span className={cn('rounded px-1.5 py-0.5 text-xs font-medium', statusTone(run.status))}>
                    {run.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {run.trigger_type}
                    {run.is_test ? ' · Test' : ''}
                  </span>
                  <span>{new Date(run.created_at).toLocaleString()}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="overflow-y-auto rounded-xl border border-border/60 bg-card/30 p-4">
            {detailQuery.isPending ? (
              <p className="text-sm text-muted-foreground">Loading run details…</p>
            ) : detailQuery.data ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div>
                    <h2 className="font-semibold">{detailQuery.data.workflow_name ?? 'Workflow Run'}</h2>
                    <p className="text-xs text-muted-foreground">
                      Run ID: {detailQuery.data.id}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'rounded px-2 py-0.5 text-xs font-medium',
                      statusTone(detailQuery.data.status),
                    )}
                  >
                    {detailQuery.data.status}
                  </span>
                </div>

                {detailQuery.data.error ? (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                    {detailQuery.data.error}
                  </div>
                ) : null}

                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Node Executions</h3>
                  {(detailQuery.data.node_runs ?? []).map((nodeRun) => (
                    <div
                      key={nodeRun.id}
                      className="space-y-2 rounded-lg border border-border/60 bg-background/50 p-3 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {nodeRun.node_id} ({nodeRun.node_type})
                        </span>
                        <span className={cn('rounded px-1.5 py-0.5 font-medium', statusTone(nodeRun.status))}>
                          {nodeRun.status}
                        </span>
                      </div>
                      {nodeRun.error ? (
                        <p className="text-destructive">{nodeRun.error}</p>
                      ) : null}
                      {nodeRun.output != null ? (
                        <pre className="max-h-48 overflow-auto rounded bg-muted/40 p-2 font-mono text-[11px]">
                          {JSON.stringify(nodeRun.output, null, 2)}
                        </pre>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
