import { describe, expect, it, vi } from 'vitest'

import {
  applyColorSchemeToDocument,
  isThemePreference,
  readThemePreference,
  resolveColorScheme,
  THEME_STORAGE_KEY,
} from './theme'

describe('theme', () => {
  it('validates theme preference values', () => {
    expect(isThemePreference('light')).toBe(true)
    expect(isThemePreference('dark')).toBe(true)
    expect(isThemePreference('system')).toBe(true)
    expect(isThemePreference('sepia')).toBe(false)
    expect(isThemePreference(null)).toBe(false)
  })

  it('reads stored preference or falls back to system', () => {
    const storage = {
      getItem: vi.fn().mockReturnValue('dark'),
    }
    expect(readThemePreference(storage)).toBe('dark')

    storage.getItem.mockReturnValue('invalid')
    expect(readThemePreference(storage)).toBe('system')
  })

  it('resolves system preference from prefers-color-scheme', () => {
    expect(resolveColorScheme('system', true)).toBe('dark')
    expect(resolveColorScheme('system', false)).toBe('light')
    expect(resolveColorScheme('light', true)).toBe('light')
    expect(resolveColorScheme('dark', false)).toBe('dark')
  })

  it('applies dark class on document root', () => {
    const root = document.createElement('html')

    applyColorSchemeToDocument('dark', root)
    expect(root.classList.contains('dark')).toBe(true)

    applyColorSchemeToDocument('light', root)
    expect(root.classList.contains('dark')).toBe(false)
  })

  it('uses expected storage key', () => {
    expect(THEME_STORAGE_KEY).toBe('theme-preference')
  })
})
