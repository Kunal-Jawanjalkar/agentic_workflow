import { render, screen } from '@testing-library/react'
import { ReactFlowProvider, type Node, type NodeProps } from '@xyflow/react'
import { describe, expect, it } from 'vitest'

import type { BuilderNodeData } from './types'
import { WorkflowBuilderNode } from './WorkflowBuilderNode'

function renderNode(data: BuilderNodeData) {
  const props = {
    id: 'node-1',
    data,
    selected: false,
    type: 'workflow',
    dragging: false,
    zIndex: 0,
    selectable: true,
    deletable: true,
    draggable: true,
    isConnectable: true,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
  } as NodeProps<Node<BuilderNodeData>>

  return render(
    <ReactFlowProvider>
      <WorkflowBuilderNode {...props} />
    </ReactFlowProvider>,
  )
}

describe('WorkflowBuilderNode', () => {
  it('uses dark amber text for approval nodes so the label stays readable in light mode', () => {
    renderNode({
      label: 'Approval',
      type: 'approval',
      version: 1,
      config: { message: 'Approval required to continue', assignee: null },
    })

    const node = screen.getByText('Approval').closest('div')

    expect(node).toHaveClass('text-amber-950')
    expect(node).toHaveClass('dark:text-amber-100')
    expect(node).toHaveClass('bg-amber-100')
  })

  it('does not render an incoming handle on a trigger', () => {
    const { container } = renderNode({
      label: 'Trigger',
      type: 'trigger',
      version: 1,
      config: { trigger_type: 'manual' },
    })

    expect(container.querySelector('.react-flow__handle-top')).toBeNull()
    expect(container.querySelector('.react-flow__handle-bottom')).not.toBeNull()
  })

  it('hides the incoming handle so the arrow meets the node without a dot', () => {
    const { container } = renderNode({
      label: 'LLM',
      type: 'llm',
      version: 1,
      config: { credential_label: '', model: '', prompt: '', structured_output: false },
    })

    const incoming = container.querySelector('.react-flow__handle-top')

    expect(incoming).not.toBeNull()
    expect(incoming).toHaveClass('!opacity-0')
    expect(container.querySelector('.react-flow__handle-bottom')).not.toBeNull()
  })
})