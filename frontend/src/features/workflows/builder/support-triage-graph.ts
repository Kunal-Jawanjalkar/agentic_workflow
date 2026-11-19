import type { Edge, Node } from '@xyflow/react'

import { defaultLlmConfig } from './node-palette'
import type { BuilderNodeData } from './types'

export const supportTriageNodes: Node<BuilderNodeData>[] = [
  {
    id: 'webhook',
    type: 'workflow',
    position: { x: 280, y: 40 },
    data: { label: 'Webhook', kind: 'trigger', config: {} },
  },
  {
    id: 'classify-ticket',
    type: 'workflow',
    position: { x: 240, y: 150 },
    data: {
      label: 'Classify ticket',
      kind: 'llm',
      config: { ...defaultLlmConfig },
    },
  },
  {
    id: 'is-urgent',
    type: 'workflow',
    position: { x: 248, y: 280 },
    data: { label: 'Is urgent?', kind: 'condition', config: {} },
  },
  {
    id: 'alert',
    type: 'workflow',
    position: { x: 480, y: 280 },
    data: { label: 'Alert', kind: 'notify', config: {} },
  },
  {
    id: 'draft-reply',
    type: 'workflow',
    position: { x: 248, y: 400 },
    data: { label: 'Draft reply', kind: 'llm', config: { ...defaultLlmConfig, prompt: 'Draft a reply for: {{ classify.output }}' } },
  },
  {
    id: 'human-approval',
    type: 'workflow',
    position: { x: 232, y: 520 },
    data: { label: 'Human approval', kind: 'approval', config: {} },
  },
  {
    id: 'send-email',
    type: 'workflow',
    position: { x: 248, y: 640 },
    data: { label: 'Send email', kind: 'http', config: {} },
  },
]

export const supportTriageEdges: Edge[] = [
  { id: 'e-webhook-classify', source: 'webhook', target: 'classify-ticket' },
  { id: 'e-classify-urgent', source: 'classify-ticket', target: 'is-urgent' },
  { id: 'e-urgent-alert', source: 'is-urgent', target: 'alert', sourceHandle: 'yes', label: 'yes' },
  { id: 'e-urgent-draft', source: 'is-urgent', target: 'draft-reply', sourceHandle: 'no', label: 'no' },
  { id: 'e-draft-approval', source: 'draft-reply', target: 'human-approval' },
  { id: 'e-approval-send', source: 'human-approval', target: 'send-email' },
]
