import { Trash2 } from 'lucide-react'
import type { Edge, Node } from '@xyflow/react'

import { Button } from '@/components/ui/button'
import { ConfigSchemaFields } from '@/features/workflows/builder/ConfigSchemaFields'
import { useNodeTypes } from '@/features/workflows/builder/hooks'
import { LlmConfigFields } from '@/features/workflows/builder/LlmConfigFields'
import { TriggerConfigFields } from '@/features/workflows/builder/TriggerConfigFields'
import type {
  BuilderNodeData,
  LlmNodeConfig,
  TriggerNodeConfig,
} from '@/features/workflows/builder/types'

type NodeInspectorPanelProps = {
  workflowId?: string
  node: Node<BuilderNodeData> | null
  nodes?: Node<BuilderNodeData>[]
  edges?: Edge[]
  onUpdateConfig: (nodeId: string, patch: Record<string, unknown>) => void
  onDeleteNode?: (nodeId: string) => void
  onRunTest?: () => void
  isRunningTest?: boolean
  onSyncSchedule?: () => void
  isSyncingSchedule?: boolean
  scheduleStatus?: string | null
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

export function NodeInspectorPanel({
  workflowId,
  node,
  nodes = [],
  edges = [],
  onUpdateConfig,
  onDeleteNode,
  onRunTest,
  isRunningTest,
  onSyncSchedule,
  isSyncingSchedule,
  scheduleStatus,
}: NodeInspectorPanelProps) {
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
      <div className="flex items-start justify-between gap-2 border-b border-border/60 px-4 py-4">
        <div className="min-w-0">
          <h2 className="truncate font-semibold">{data.label}</h2>
          <p className="text-sm text-muted-foreground">{kindLabels[data.type]}</p>
        </div>
        {onDeleteNode ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            aria-label="Delete node"
            onClick={() => onDeleteNode(node.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {isPending ? (
          <p className="text-sm text-muted-foreground">Loading configuration schema…</p>
        ) : null}
        {isError ? (
          <p className="text-sm text-destructive">Could not load node types.</p>
        ) : null}
        {nodeType && data.type === 'trigger' ? (
          <TriggerConfigFields
            workflowId={workflowId}
            config={data.config as TriggerNodeConfig}
            onPatch={(patch) => onUpdateConfig(node.id, patch)}
            onRunTest={onRunTest}
            isRunningTest={isRunningTest}
            onSyncSchedule={onSyncSchedule}
            isSyncingSchedule={isSyncingSchedule}
            scheduleStatus={scheduleStatus}
          />
        ) : null}
        {nodeType && data.type === 'llm' ? (
          <LlmConfigFields
            nodeId={node.id}
            config={data.config as LlmNodeConfig}
            nodes={nodes}
            edges={edges}
            onPatch={(patch) => onUpdateConfig(node.id, patch)}
          />
        ) : null}
        {nodeType && data.type !== 'trigger' && data.type !== 'llm' ? (
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