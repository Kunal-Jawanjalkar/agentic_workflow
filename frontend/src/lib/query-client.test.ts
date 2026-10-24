import { describe, expect, it } from 'vitest'

import { queryClient } from './query-client'

describe('queryClient', () => {
  it('disables mutation retries and sets query stale time', () => {
    const defaults = queryClient.getDefaultOptions()

    expect(defaults.queries?.staleTime).toBe(60_000)
    expect(defaults.queries?.retry).toBe(1)
    expect(defaults.mutations?.retry).toBe(false)
  })
})
