export const builderNodeKinds = [
  'trigger',
  'llm',
  'agent',
  'condition',
  'http',
  'approval',
  'notify',
] as const

export type BuilderNodeKind = (typeof builderNodeKinds)[number]

export function isBuilderNodeKind(value: string): value is BuilderNodeKind {
  return (builderNodeKinds as readonly string[]).includes(value)
}

export type TriggerNodeConfig = {
  trigger_type: string
}

export type LlmNodeConfig = {
  credential_label: string
  model: string
  prompt: string
  structured_output: boolean
}

export type AgentNodeConfig = {
  credential_label: string
  model: string
  system_prompt: string
  tools: string[]
}

export type ConditionNodeConfig = {
  expression: string
}

export type HttpNodeConfig = {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers: Record<string, string>
  body: string | null
}

export type ApprovalNodeConfig = {
  message: string
  assignee: string | null
}

export type NotifyNodeConfig = {
  channel: 'email' | 'slack' | 'webhook'
  to: string
  subject: string
  body: string
}

export type NodeConfigByKind = {
  trigger: TriggerNodeConfig
  llm: LlmNodeConfig
  agent: AgentNodeConfig
  condition: ConditionNodeConfig
  http: HttpNodeConfig
  approval: ApprovalNodeConfig
  notify: NotifyNodeConfig
}

export type BuilderNodeData = {
  [K in BuilderNodeKind]: {
    label: string
    type: K
    version: number
    config: NodeConfigByKind[K]
  }
}[BuilderNodeKind]

export type PaletteItem = {
  kind: BuilderNodeKind
  label: string
}

export type NodeType = {
  type: string
  version: number
  label: string
  category: string
  icon: string
  outputs: string[]
  config_schema: Record<string, unknown>
}

export type NodeTypeListResponse = {
  node_types: NodeType[]
}
