import { describe, expect, it } from 'vitest'

import { ApiError } from '@/lib/api'

import { getMutationErrorMessage } from './mutation-error'

describe('getMutationErrorMessage', () => {
  it('returns null when error is null', () => {
    expect(getMutationErrorMessage(null)).toBeNull()
  })

  it('returns ApiError message for API failures', () => {
    const error = new ApiError(409, 'Email already exists')

    expect(getMutationErrorMessage(error)).toBe('Email already exists')
  })

  it('returns fallback for unknown errors', () => {
    expect(getMutationErrorMessage(new Error('boom'))).toBe(
      'Something went wrong. Please try again.',
    )
  })

  it('uses custom fallback when provided', () => {
    expect(getMutationErrorMessage(new Error('boom'), 'Try later')).toBe('Try later')
  })
})
