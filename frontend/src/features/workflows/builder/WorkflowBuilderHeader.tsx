import { appShellHeaderClassName } from '@/components/app/app-shell-layout'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type WorkflowBuilderHeaderProps = {
  title: string
  statusLabel: string
  statusTone: 'draft' | 'published'
  savedLabel: string
}

export function WorkflowBuilderHeader({
  title,
  statusLabel,
  statusTone,
  savedLabel,
}: WorkflowBuilderHeaderProps) {
  return (
    <header
      className={cn(
        appShellHeaderClassName,
        'justify-between gap-3 bg-background px-4',
        'max-sm:h-auto max-sm:min-h-14 max-sm:flex-col max-sm:items-stretch max-sm:py-3',
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-3 max-sm:w-full">
        <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
        <span
          className={cn(
            'inline-flex rounded-md px-2 py-0.5 text-xs font-medium',
            statusTone === 'draft' && 'bg-amber-500/15 text-amber-400',
            statusTone === 'published' && 'bg-emerald-500/15 text-emerald-400',
          )}
        >
          {statusLabel}
        </span>
        <span className="text-xs text-muted-foreground">{savedLabel}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm">
          Run test
        </Button>
        <Button type="button" variant="outline" size="sm">
          Run evals
        </Button>
        <Button type="button" size="sm">
          Publish
        </Button>
      </div>
    </header>
  )
}
