export type JsonSchemaProperty = {
  type?: string
  title?: string
  default?: unknown
  enum?: string[]
  nullable?: boolean
  description?: string | string[]
  anyOf?: JsonSchemaProperty[]
  items?: JsonSchemaProperty
  additionalProperties?: { type?: string }
}

export type ConfigFieldKind =
  | 'select'
  | 'boolean'
  | 'text'
  | 'textarea'
  | 'json-object'
  | 'string-list'

export type ConfigFieldDescriptor = {
  key: string
  label: string
  kind: ConfigFieldKind
  options?: string[]
  nullable: boolean
}

const textareaKeys = new Set([
  'prompt',
  'system_prompt',
  'body',
  'message',
  'expression',
])

function propertyLabel(key: string, property: JsonSchemaProperty): string {
  if (property.title) {
    return property.title
  }
  return key
    .split('_')
    .map((part) => (part.length > 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(' ')
}

function isNullableString(property: JsonSchemaProperty): boolean {
  if (property.nullable === true && property.type === 'string') {
    return true
  }
  if (!property.anyOf) {
    return false
  }
  const types = property.anyOf.map((item) => item.type)
  return types.includes('string') && types.includes('null')
}

function selectOptions(property: JsonSchemaProperty): string[] | undefined {
  if (property.enum && property.enum.length > 0) {
    return property.enum
  }
  if (Array.isArray(property.description) && property.description.length > 0) {
    return property.description
  }
  return undefined
}

function resolveScalarType(property: JsonSchemaProperty): string | undefined {
  if (property.type) {
    return property.type
  }
  if (property.anyOf) {
    const nonNull = property.anyOf.find((item) => item.type && item.type !== 'null')
    return nonNull?.type
  }
  return undefined
}

export function describeConfigField(
  key: string,
  property: JsonSchemaProperty,
): ConfigFieldDescriptor {
  const label = propertyLabel(key, property)
  const options = selectOptions(property)
  if (options) {
    return { key, label, kind: 'select', options, nullable: false }
  }
  const scalarType = resolveScalarType(property)
  if (scalarType === 'boolean') {
    return { key, label, kind: 'boolean', nullable: false }
  }
  if (scalarType === 'object') {
    return { key, label, kind: 'json-object', nullable: false }
  }
  if (scalarType === 'array' && property.items?.type === 'string') {
    return { key, label, kind: 'string-list', nullable: false }
  }
  const nullable = isNullableString(property)
  if (textareaKeys.has(key)) {
    return { key, label, kind: 'textarea', nullable }
  }
  return { key, label, kind: 'text', nullable }
}

export function listConfigFields(configSchema: Record<string, unknown>): ConfigFieldDescriptor[] {
  const properties = (configSchema.properties ?? {}) as Record<string, JsonSchemaProperty>
  return Object.keys(properties).map((key) => describeConfigField(key, properties[key]!))
}

export function readConfigValue(config: Record<string, unknown>, field: ConfigFieldDescriptor): string {
  const value = config[field.key]
  switch (field.kind) {
    case 'json-object':
      return JSON.stringify(value ?? {}, null, 2)
    case 'string-list':
      return Array.isArray(value) ? value.join(', ') : ''
    case 'boolean':
      return value === true ? 'true' : 'false'
    default:
      if (value === null || value === undefined) {
        return ''
      }
      return String(value)
  }
}

export function parseConfigValue(
  field: ConfigFieldDescriptor,
  raw: string,
): unknown {
  switch (field.kind) {
    case 'boolean':
      return raw === 'true'
    case 'json-object': {
      const trimmed = raw.trim()
      if (trimmed === '') {
        return {}
      }
      return JSON.parse(trimmed) as unknown
    }
    case 'string-list':
      return raw
        .split(',')
        .map((part) => part.trim())
        .filter((part) => part.length > 0)
    case 'text':
    case 'textarea':
    case 'select':
      if (field.nullable && raw.trim() === '') {
        return null
      }
      return raw
    default:
      return raw
  }
}