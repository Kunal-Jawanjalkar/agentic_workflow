import { addNodePalette } from '@/features/workflows/builder/node-palette'
import type { BuilderNodeKind } from '@/features/workflows/builder/types'
import { cn } from '@/lib/utils'

type AddNodePanelProps = {
  onAddNode: (kind: BuilderNodeKind) => void
}

export function AddNodePanel({ onAddNode }: AddNodePanelProps) {
  return (
    <aside
      className="flex w-44 shrink-0 flex-col border-r border-border/60 bg-card/30"
      aria-label="Add node"
    >
      <div className="border-b border-border/60 px-4 py-3 text-sm font-medium">Add node</div>
      <ul className="flex flex-col gap-2 p-3">
        {addNodePalette.map((item) => (
          <li key={item.kind}>
            <button
              type="button"
              onClick={() => onAddNode(item.kind)}
              className={cn(
                'w-full rounded-lg border border-border/60 bg-card/80 px-3 py-2 text-left text-sm font-medium',
                'transition-colors hover:bg-muted/60',
              )}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
