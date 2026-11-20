import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  type ConfigFieldDescriptor,
  listConfigFields,
  parseConfigValue,
  readConfigValue,
} from '@/features/workflows/builder/config-schema-fields'

type ConfigSchemaFieldsProps = {
  configSchema: Record<string, unknown>
  config: Record<string, unknown>
  onPatch: (patch: Record<string, unknown>) => void
}

function FieldLabel({ children }: { children: string }) {
  return <label className="text-xs font-medium text-muted-foreground">{children}</label>
}

const controlClassName =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30'

const textareaClassName =
  'min-h-28 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm dark:bg-input/30'

export function ConfigSchemaFields({ configSchema, config, onPatch }: ConfigSchemaFieldsProps) {
  const fields = listConfigFields(configSchema)

  if (fields.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">This node has no configurable fields.</p>
    )
  }

  return (
    <>
      {fields.map((field) => (
        <ConfigField
          key={field.key}
          field={field}
          value={readConfigValue(config, field)}
          booleanValue={config[field.key] === true}
          onChange={(next) => onPatch({ [field.key]: next })}
        />
      ))}
    </>
  )
}

type ConfigFieldProps = {
  field: ConfigFieldDescriptor
  value: string
  booleanValue: boolean
  onChange: (value: unknown) => void
}

function ConfigField({ field, value, booleanValue, onChange }: ConfigFieldProps) {
  switch (field.kind) {
    case 'select':
      return (
        <div className="space-y-1.5">
          <FieldLabel>{field.label}</FieldLabel>
          <select
            className={controlClassName}
            value={value}
            onChange={(event) => onChange(event.target.value)}
          >
            {value === '' ? <option value="">Select…</option> : null}
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )
    case 'boolean':
      return (
        <div className="flex items-center justify-between gap-2">
          <FieldLabel>{field.label}</FieldLabel>
          <Button
            type="button"
            size="sm"
            variant={booleanValue ? 'secondary' : 'outline'}
            onClick={() => onChange(!booleanValue)}
          >
            {booleanValue ? 'On' : 'Off'}
          </Button>
        </div>
      )
    case 'textarea':
      return (
        <div className="space-y-1.5">
          <FieldLabel>{field.label}</FieldLabel>
          <textarea
            className={textareaClassName}
            value={value}
            onChange={(event) => onChange(parseConfigValue(field, event.target.value))}
          />
        </div>
      )
    case 'json-object':
      return (
        <JsonObjectField
          key={value}
          field={field}
          value={value}
          onChange={onChange}
          className={textareaClassName}
        />
      )
    case 'string-list':
      return (
        <div className="space-y-1.5">
          <FieldLabel>{field.label}</FieldLabel>
          <Input
            value={value}
            onChange={(event) => onChange(parseConfigValue(field, event.target.value))}
            placeholder="Comma-separated values"
          />
        </div>
      )
    default:
      return (
        <div className="space-y-1.5">
          <FieldLabel>{field.label}</FieldLabel>
          <Input
            value={value}
            onChange={(event) => onChange(parseConfigValue(field, event.target.value))}
          />
        </div>
      )
  }
}

function JsonObjectField({
  field,
  value,
  onChange,
  className,
}: {
  field: ConfigFieldDescriptor
  value: string
  onChange: (value: unknown) => void
  className: string
}) {
  const [draft, setDraft] = useState(value)

  return (
    <div className="space-y-1.5">
      <FieldLabel>{field.label}</FieldLabel>
      <textarea
        className={className}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          try {
            onChange(parseConfigValue(field, draft))
          } catch {
            setDraft(value)
          }
        }}
      />
    </div>
  )
}