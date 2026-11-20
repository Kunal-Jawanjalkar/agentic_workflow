import { describe, expect, it } from 'vitest'

import { configFromSchema } from './node-config'

describe('configFromSchema', () => {
  it('builds an LLM config from the backend JSON schema', () => {
    const config = configFromSchema({
      properties: {
        credential_label: { type: 'string', default: '' },
        model: { type: 'string' },
        prompt: { type: 'string', default: '' },
        structured_output: { type: 'boolean', default: false },
      },
      required: ['model'],
      type: 'object',
    })

    expect(config).toEqual({
      credential_label: '',
      model: '',
      prompt: '',
      structured_output: false,
    })
  })

  it('uses schema defaults for nullable and collection fields', () => {
    const config = configFromSchema({
      properties: {
        headers: { type: 'object', default: {} },
        body: { anyOf: [{ type: 'string' }, { type: 'null' }], default: null },
        tools: { type: 'array', default: [] },
        assignee: { anyOf: [{ type: 'string' }, { type: 'null' }], default: null },
      },
      type: 'object',
    })

    expect(config).toEqual({
      headers: {},
      body: null,
      tools: [],
      assignee: null,
    })
  })
})
