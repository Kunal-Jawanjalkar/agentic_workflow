import { renderHook, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useIsMobile } from './use-mobile'

function mockMatchMedia(matches: boolean) {
  const listeners = new Set<() => void>()
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: matches ? 500 : 1024,
  })
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation(() => ({
      matches,
      addEventListener: (_: string, listener: () => void) => {
        listeners.add(listener)
      },
      removeEventListener: (_: string, listener: () => void) => {
        listeners.delete(listener)
      },
      dispatchChange: () => {
        for (const listener of listeners) {
          listener()
        }
      },
    })),
  )
  return listeners
}

describe('useIsMobile', () => {
  beforeEach(() => {
    mockMatchMedia(false)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns true when viewport is below mobile breakpoint', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(true)
  })

  it('returns false when viewport is at desktop width', () => {
    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)
  })

  it('updates when matchMedia change event fires', () => {
    let onChange: (() => void) | undefined
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: (_: string, listener: () => void) => {
          onChange = listener
        },
        removeEventListener: () => {},
      })),
    )
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1024,
    })

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        value: 400,
      })
      onChange?.()
    })

    expect(result.current).toBe(true)
  })
})
