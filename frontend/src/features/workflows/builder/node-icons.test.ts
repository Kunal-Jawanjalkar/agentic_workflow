import { describe, expect, it } from 'vitest'

import { formatNodeCategory, nodeKindIcon, nodeTypeIcon } from './node-icons'

describe('formatNodeCategory', () => {
  it('capitalizes a single-word category', () => {
    expect(formatNodeCategory('trigger')).toBe('Trigger')
    expect(formatNodeCategory('human')).toBe('Human')
  })

  it('uppercases short category acronyms', () => {
    expect(formatNodeCategory('ai')).toBe('AI')
    expect(formatNodeCategory('io')).toBe('IO')
  })
})

describe('node icons', () => {
  it('maps catalog icon names and node kinds', () => {
    expect(nodeTypeIcon('bolt')).toBe(nodeKindIcon('trigger'))
    expect(nodeTypeIcon('sparkles')).toBe(nodeKindIcon('llm'))
    expect(nodeTypeIcon('robot')).toBe(nodeKindIcon('agent'))
    expect(nodeTypeIcon('git-branch')).toBe(nodeKindIcon('condition'))
    expect(nodeTypeIcon('world-www')).toBe(nodeKindIcon('http'))
    expect(nodeTypeIcon('user-check')).toBe(nodeKindIcon('approval'))
    expect(nodeTypeIcon('bell')).toBe(nodeKindIcon('notify'))
  })
})