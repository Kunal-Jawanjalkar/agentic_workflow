import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { memo } from 'react'

import type { BuilderNodeData } from '@/features/workflows/builder/types'
import { cn } from '@/lib/utils'

function WorkflowBuilderNodeComponent({
  data,
  selected,
}: NodeProps<Node<BuilderNodeData>>) {
  const isApproval = data.kind === 'approval'
  const isCondition = data.kind === 'condition'

  return (
    <div
      className={cn(
        'min-w-[148px] rounded-xl border bg-card px-4 py-2.5 text-center text-sm font-medium shadow-sm',
        selected && 'border-primary ring-2 ring-primary/40',
        isApproval && 'border-amber-500/50 bg-amber-500/10 text-amber-100',
        !selected && !isApproval && 'border-border/70',
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground !w-2 !h-2" />
      <span>{data.label}</span>
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
