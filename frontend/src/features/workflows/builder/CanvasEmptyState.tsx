import { Workflow } from 'lucide-react'

export function CanvasEmptyState() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6">
      <div className="flex max-w-sm flex-col items-center gap-3 rounded-xl border border-dashed border-border/80 bg-card/80 px-6 py-8 text-center shadow-sm">
        <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Workflow className="size-5" aria-hidden />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium">This workflow is empty</p>
          <p className="text-sm text-muted-foreground">
            Add a step from the left. Each new step is placed on the canvas and connected to the
            previous one.
          </p>
        </div>
      </div>
    </div>
  )
}
