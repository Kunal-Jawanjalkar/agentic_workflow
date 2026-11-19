import { describe, expect, it } from 'vitest'

import { addNodePalette } from './node-palette'

describe('addNodePalette', () => {
  it('lists all builder node kinds from the design', () => {
    expect(addNodePalette.map((item) => item.kind)).toEqual([
      'trigger',
      'llm',
      'agent',
      'condition',
      'http',
      'approval',
      'notify',
    ])
  })
})
