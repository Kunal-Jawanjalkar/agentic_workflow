export interface NodeTypeDescriptor {
  type: string
  version: number
  label: string
  category: string
  icon: string
  outputs: string[]
  config_schema: Record<string, unknown>
}

export interface NodeExecutionContext {
  ownerId: string
  workflowId: string
  executionId: string
  nodeId: string
  input: Record<string, unknown>
}

export interface NodeExecutionResult {
  output: Record<string, unknown>
  outputHandle?: string
  status?: 'completed' | 'waiting_approval'
}

export interface NodeExecutor<TConfig = Record<string, unknown>> {
  readonly descriptor: NodeTypeDescriptor
  validateConfig?(config: unknown): TConfig
  execute(config: TConfig, ctx: NodeExecutionContext): Promise<NodeExecutionResult>
}
