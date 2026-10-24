import { ApiError } from '@/lib/api'

export function getMutationErrorMessage(
  error: Error | null,
  fallback = 'Something went wrong. Please try again.',
): string | null {
  if (!error) {
    return null
  }
  if (error instanceof ApiError) {
    return error.message
  }
  return fallback
}
