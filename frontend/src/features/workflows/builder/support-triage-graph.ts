import type { Edge, Node } from '@xyflow/react'

import { workflowEdgeOptions } from './append-workflow-step'
import type { BuilderNodeData, LlmNodeConfig } from './types'

const classifyConfig: LlmNodeConfig = {
  credential_label: 'My OpenAI key (…)',
  model: 'gpt-4o-mini',
  prompt: 'Classify this ticket: {{ trigger.body.text }}',
  structured_output: true,
}

export const supportTriageNodes: Node<BuilderNodeData>[] = [
  {
    id: 'webhook',
    type: 'workflow',
    position: { x: 280, y: 40 },
    data: {
      label: 'Webhook',
      type: 'trigger',
      version: 1,
      config: { trigger_type: 'webhook' },
    },
  },
  {
    id: 'classify-ticket',
    type: 'workflow',
    position: { x: 240, y: 150 },
    data: {
      label: 'Classify ticket',
      type: 'llm',
      version: 1,
      config: classifyConfig,
    },
  },
  {
    id: 'is-urgent',
    type: 'workflow',
    position: { x: 248, y: 280 },
    data: {
      label: 'Is urgent?',
      type: 'condition',
      version: 1,
      config: { expression: '' },
    },
  },
  {
    id: 'alert',
    type: 'workflow',
    position: { x: 480, y: 280 },
    data: {
      label: 'Alert',
      type: 'notify',
      version: 1,
      config: { channel: 'slack', to: '#support', subject: '', body: '' },
    },
  },
  {
    id: 'draft-reply',
    type: 'workflow',
    position: { x: 248, y: 400 },
    data: {
      label: 'Draft reply',
      type: 'llm',
      version: 1,
      config: { ...classifyConfig, prompt: 'Draft a reply for: {{ classify.output }}' },
    },
  },
  {
    id: 'human-approval',
    type: 'workflow',
    position: { x: 232, y: 520 },
    data: {
      label: 'Human approval',
      type: 'approval',
      version: 1,
      config: { message: 'Approval required to continue', assignee: null },
    },
  },
  {
    id: 'send-email',
    type: 'workflow',
    position: { x: 248, y: 640 },
    data: {
      label: 'Send email',
      type: 'http',
      version: 1,
      config: { url: '', method: 'POST', headers: {}, body: null },
    },
  },
]

export const supportTriageEdges: Edge[] = [
  { id: 'e-webhook-classify', source: 'webhook', target: 'classify-ticket', ...workflowEdgeOptions },
  { id: 'e-classify-urgent', source: 'classify-ticket', target: 'is-urgent', ...workflowEdgeOptions },
  {
    id: 'e-urgent-alert',
    source: 'is-urgent',
    target: 'alert',
    sourceHandle: 'yes',
    label: 'yes',
    ...workflowEdgeOptions,
  },
  {
    id: 'e-urgent-draft',
    source: 'is-urgent',
    target: 'draft-reply',
    sourceHandle: 'no',
    label: 'no',
    ...workflowEdgeOptions,
  },
  { id: 'e-draft-approval', source: 'draft-reply', target: 'human-approval', ...workflowEdgeOptions },
  { id: 'e-approval-send', source: 'human-approval', target: 'send-email', ...workflowEdgeOptions },
]
