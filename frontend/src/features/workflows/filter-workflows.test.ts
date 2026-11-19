import { describe, expect, it } from 'vitest'

import { filterWorkflows } from './filter-workflows'
import { workflows } from './workflows-data'

describe('filterWorkflows', () => {
  it('filters by search query on name and description', () => {
    const result = filterWorkflows(workflows, 'support', 'all')

    expect(result).toHaveLength(1)
    expect(result[0]?.name).toBe('Support triage')
  })

  it('filters published workflows only', () => {
    const result = filterWorkflows(workflows, '', 'published')

    expect(result.every((item) => item.status.kind === 'published')).toBe(true)
    expect(result.length).toBeGreaterThanOrEqual(2)
  })

  it('filters needs attention workflows', () => {
    const result = filterWorkflows(workflows, '', 'needs_attention')

    expect(result.map((item) => item.id).sort()).toEqual(
      ['lead-scoring', 'pr-summary'].sort(),
    )
  })
})
