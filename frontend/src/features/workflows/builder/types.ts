export type BuilderNodeKind =
  | 'trigger'
  | 'llm'
  | 'agent'
  | 'condition'
  | 'http'
  | 'approval'
  | 'notify'

export type LlmNodeConfig = {
  credentialLabel: string
  model: string
  prompt: string
  structuredOutput: boolean
}

export type BuilderNodeData = {
  label: string
  kind: BuilderNodeKind
  config: LlmNodeConfig | Record<string, never>
}

export type PaletteItem = {
  kind: BuilderNodeKind
  label: string
}
