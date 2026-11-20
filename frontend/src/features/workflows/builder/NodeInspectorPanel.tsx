import type { Node } from '@xyflow/react'

import { ConfigSchemaFields } from '@/features/workflows/builder/ConfigSchemaFields'
import { useNodeTypes } from '@/features/workflows/builder/hooks'
import type { BuilderNodeData } from '@/features/workflows/builder/types'

type NodeInspectorPanelProps = {
  node: Node<BuilderNodeData> | null
  onUpdateConfig: (nodeId: string, patch: Record<string, unknown>) => void
}

const kindLabels: Record<BuilderNodeData['type'], string> = {
  trigger: 'Trigger node',
  llm: 'LLM node',
  agent: 'Agent node',
  condition: 'Condition node',
  http: 'HTTP node',
  approval: 'Approval node',
  notify: 'Notify node',
}

export function NodeInspectorPanel({ node, onUpdateConfig }: NodeInspectorPanelProps) {
  const { data: catalog, isPending, isError } = useNodeTypes()

  if (!node) {
    return (
      <aside
        className="flex w-80 shrink-0 flex-col border-l border-border/60 bg-card/20 p-4"
        aria-label="Node configuration"
      >
        <p className="text-sm text-muted-foreground">Select a node to configure it.</p>
      </aside>
    )
  }

  const { data } = node
  const nodeType = catalog?.node_types.find((item) => item.type === data.type)

  return (
    <aside
      className="flex w-80 shrink-0 flex-col border-l border-border/60 bg-card/20"
      aria-label="Node configuration"
    >
      <div className="border-b border-border/60 px-4 py-4">
        <h2 className="font-semibold">{data.label}</h2>
        <p className="text-sm text-muted-foreground">{kindLabels[data.type]}</p>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {isPending ? (
          <p className="text-sm text-muted-foreground">Loading configuration schema…</p>
        ) : null}
        {isError ? (
          <p className="text-sm text-destructive">Could not load node types.</p>
        ) : null}
        {nodeType ? (
          <ConfigSchemaFields
            configSchema={nodeType.config_schema}
            config={data.config as Record<string, unknown>}
            onPatch={(patch) => onUpdateConfig(node.id, patch)}
          />
        ) : null}
        {!isPending && !isError && !nodeType ? (
          <p className="text-sm text-muted-foreground">
            No schema found for {kindLabels[data.type].toLowerCase()}.
          </p>
        ) : null}
      </div>
    </aside>
  )
}