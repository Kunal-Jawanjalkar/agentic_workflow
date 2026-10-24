import { NodePalettePanel } from '@/components/app/NodePalettePanel'
import { WorkflowCanvas } from '@/features/canvas/WorkflowCanvas'

export function WorkflowEditorPage() {
  return (
    <div className="flex h-full min-h-[calc(100svh-3rem)] flex-col overflow-hidden md:min-h-svh">
      <header className="flex h-12 shrink-0 items-center border-b border-border/60 px-4">
        <h1 className="text-sm font-medium">Untitled workflow</h1>
      </header>
      <div className="relative flex min-h-0 flex-1">
        <NodePalettePanel />
        <div className="relative min-h-0 min-w-0 flex-1">
          <WorkflowCanvas />
        </div>
      </div>
    </div>
  )
}
