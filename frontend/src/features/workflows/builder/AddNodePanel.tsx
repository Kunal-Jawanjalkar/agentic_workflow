import { useNodeTypes } from '@/features/workflows/builder/hooks'
import { formatNodeCategory, nodeTypeIcon } from '@/features/workflows/builder/node-icons'
import { isBuilderNodeKind, type NodeType } from '@/features/workflows/builder/types'
import { cn } from '@/lib/utils'

type AddNodePanelProps = {
  hasTrigger: boolean
  onAddNode: (nodeType: NodeType) => void
}

export function AddNodePanel({ hasTrigger, onAddNode }: AddNodePanelProps) {
  const { data, isPending, isError } = useNodeTypes()
  const nodeTypes = data?.node_types ?? []

  return (
    <aside
      className="flex w-44 shrink-0 flex-col border-r border-border/60 bg-card/30"
      aria-label="Add node"
    >
      <div className="border-b border-border/60 px-4 py-3 text-sm font-medium">Add node</div>
      {isPending ? (
        <p className="px-4 py-3 text-sm text-muted-foreground">Loading node types…</p>
      ) : null}
      {isError ? (
        <p className="px-4 py-3 text-sm text-destructive">Could not load node types.</p>
      ) : null}
      {!isPending && !isError && nodeTypes.length === 0 ? (
        <p className="px-4 py-3 text-sm text-muted-foreground">No node types available.</p>
      ) : null}
      <ul className="flex flex-col gap-2 p-3">
        {nodeTypes.map((nodeType) => {
          const triggerTaken = hasTrigger && nodeType.type === 'trigger'
          const canAdd = isBuilderNodeKind(nodeType.type) && !triggerTaken
          const Icon = nodeTypeIcon(nodeType.icon)
          return (
            <li key={nodeType.type}>
              <button
                type="button"
                disabled={!canAdd}
                aria-describedby={triggerTaken ? 'trigger-limit' : undefined}
                onClick={() => {
                  if (isBuilderNodeKind(nodeType.type)) {
                    onAddNode(nodeType)
                  }
                }}
                className={cn(
                  'w-full rounded-lg border border-border/60 bg-card/80 px-3 py-2 text-left text-sm font-medium',
                  'transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60',
                )}
              >
                <span className="flex items-center gap-2">
                  <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  {nodeType.label}
                </span>
                <span
                  id={triggerTaken ? 'trigger-limit' : undefined}
                  className="block pl-6 text-xs font-normal text-muted-foreground"
                >
                  {triggerTaken ? 'Only one trigger' : formatNodeCategory(nodeType.category)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
