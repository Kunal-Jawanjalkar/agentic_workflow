import { describe, expect, it } from 'vitest'

import { isNewWorkflowRoute } from './workflow-route'

describe('isNewWorkflowRoute', () => {
  it('treats the new-workflow segment as a new draft', () => {
    expect(isNewWorkflowRoute('new')).toBe(true)
  })

  it('does not treat missing or persisted ids as new', () => {
    expect(isNewWorkflowRoute(undefined)).toBe(false)
    expect(isNewWorkflowRoute('550e8400-e29b-41d4-a716-446655440000')).toBe(false)
  })
})