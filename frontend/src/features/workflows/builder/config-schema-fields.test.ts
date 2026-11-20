import { describe, expect, it } from 'vitest'

import {
  describeConfigField,
  listConfigFields,
  parseConfigValue,
  readConfigValue,
} from './config-schema-fields'

describe('config-schema-fields', () => {
  it('maps trigger_type description array to a select field', () => {
    const field = describeConfigField('trigger_type', {
      type: 'string',
      default: 'manual',
      description: ['manual', 'webhook', 'schedule'],
      title: 'Trigger Type',
    })

    expect(field).toMatchObject({
      key: 'trigger_type',
      kind: 'select',
      options: ['manual', 'webhook', 'schedule'],
    })
  })

  it('lists fields in schema property order', () => {
    const fields = listConfigFields({
      properties: {
        model: { type: 'string', title: 'Model' },
        prompt: { type: 'string', title: 'Prompt' },
        structured_output: { type: 'boolean', title: 'Structured Output' },
      },
    })

    expect(fields.map((field) => field.key)).toEqual(['model', 'prompt', 'structured_output'])
    expect(fields[2]?.kind).toBe('boolean')
    expect(fields[1]?.kind).toBe('textarea')
  })

  it('parses nullable assignee and string lists', () => {
    const assignee = describeConfigField('assignee', {
      anyOf: [{ type: 'string' }, { type: 'null' }],
      default: null,
      title: 'Assignee',
    })
    const tools = describeConfigField('tools', {
      items: { type: 'string' },
      type: 'array',
      title: 'Tools',
    })

    expect(parseConfigValue(assignee, '')).toBeNull()
    expect(parseConfigValue(assignee, 'alice')).toBe('alice')
    expect(parseConfigValue(tools, 'search, http')).toEqual(['search', 'http'])
    expect(readConfigValue({ tools: ['a', 'b'] }, tools)).toBe('a, b')
  })
})