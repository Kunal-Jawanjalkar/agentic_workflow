import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { memo } from 'react'

import { nodeKindIcon } from '@/features/workflows/builder/node-icons'
import type { BuilderNodeData } from '@/features/workflows/builder/types'
import { cn } from '@/lib/utils'

function WorkflowBuilderNodeComponent({
  data,
  selected,
}: NodeProps<Node<BuilderNodeData>>) {
  const isTrigger = data.type === 'trigger'
  const isApproval = data.type === 'approval'
  const isCondition = data.type === 'condition'
  const Icon = nodeKindIcon(data.type)

  return (
    <div
      className={cn(
        'min-w-[148px] rounded-xl border bg-card px-4 py-2.5 text-center text-sm font-medium shadow-sm',
        selected && 'border-primary ring-2 ring-primary/40',
        isApproval &&
          'border-amber-700/40 bg-amber-100 text-amber-950 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-100',
        !selected && !isApproval && 'border-border/70',
      )}
    >
      {isTrigger ? null : (
        <Handle type="target" position={Position.Top} className="!bg-muted-foreground !w-2 !h-2" />
      )}
      <span className="flex items-center justify-center gap-1.5">
        <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        {data.label}
      </span>
      {isCondition ? (
        <>
          <Handle
            id="yes"
            type="source"
            position={Position.Right}
            className="!bg-muted-foreground !w-2 !h-2"
          />
          <Handle
            id="no"
            type="source"
            position={Position.Bottom}
            className="!bg-muted-foreground !w-2 !h-2"
          />
        </>
      ) : (
        <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground !w-2 !h-2" />
      )}
    </div>
  )
}

export const WorkflowBuilderNode = memo(WorkflowBuilderNodeComponent)

export const workflowBuilderNodeTypes = {
  workflow: WorkflowBuilderNode,
}
