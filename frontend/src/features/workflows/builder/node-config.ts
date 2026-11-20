import type { BuilderNodeData, BuilderNodeKind, NodeConfigByKind, NodeType } from './types'

type JsonSchemaProperty = {
  type?: string
  default?: unknown
  anyOf?: JsonSchemaProperty[]
}

type JsonSchema = {
  properties?: Record<string, JsonSchemaProperty>
}

function emptySchemaValue(property: JsonSchemaProperty): unknown {
  if (property.anyOf) {
    const nonNull = property.anyOf.find((item) => item.type !== 'null')
    return nonNull ? emptySchemaValue(nonNull) : null
  }
  switch (property.type) {
    case 'string':
      return ''
    case 'boolean':
      return false
    case 'integer':
    case 'number':
      return 0
    case 'array':
      return []
    case 'object':
      return {}
    default:
      return null
  }
}

export function configFromSchema(schema: Record<string, unknown>): Record<string, unknown> {
  const properties = ((schema as JsonSchema).properties ?? {}) as Record<string, JsonSchemaProperty>
  const config: Record<string, unknown> = {}
  for (const [key, property] of Object.entries(properties)) {
    config[key] = 'default' in property ? property.default : emptySchemaValue(property)
  }
  return config
}

export function nodeConfigFor<K extends BuilderNodeKind>(nodeType: {
  type: K
  config_schema: Record<string, unknown>
}): NodeConfigByKind[K] {
  return configFromSchema(nodeType.config_schema) as NodeConfigByKind[K]
}

export function builderNodeDataFromCatalog(
  nodeType: NodeType & { type: BuilderNodeKind },
): BuilderNodeData {
  const shared = { label: nodeType.label, version: nodeType.version }
  switch (nodeType.type) {
    case 'trigger':
      return { ...shared, type: 'trigger', config: nodeConfigFor({ type: 'trigger', config_schema: nodeType.config_schema }) }
    case 'llm':
      return { ...shared, type: 'llm', config: nodeConfigFor({ type: 'llm', config_schema: nodeType.config_schema }) }
    case 'agent':
      return { ...shared, type: 'agent', config: nodeConfigFor({ type: 'agent', config_schema: nodeType.config_schema }) }
    case 'condition':
      return { ...shared, type: 'condition', config: nodeConfigFor({ type: 'condition', config_schema: nodeType.config_schema }) }
    case 'http':
      return { ...shared, type: 'http', config: nodeConfigFor({ type: 'http', config_schema: nodeType.config_schema }) }
    case 'approval':
      return { ...shared, type: 'approval', config: nodeConfigFor({ type: 'approval', config_schema: nodeType.config_schema }) }
    case 'notify':
      return { ...shared, type: 'notify', config: nodeConfigFor({ type: 'notify', config_schema: nodeType.config_schema }) }
  }
}
