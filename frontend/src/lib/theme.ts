export const THEME_STORAGE_KEY = 'theme-preference'

export type ThemePreference = 'light' | 'dark' | 'system'

export type ColorScheme = 'light' | 'dark'

const VALID_PREFERENCES = new Set<ThemePreference>(['light', 'dark', 'system'])

export function isThemePreference(value: string | null): value is ThemePreference {
  return value !== null && VALID_PREFERENCES.has(value as ThemePreference)
}

export function readThemePreference(
  storage: Pick<Storage, 'getItem'> = localStorage,
): ThemePreference {
  const stored = storage.getItem(THEME_STORAGE_KEY)
  if (isThemePreference(stored)) {
    return stored
  }
  return 'system'
}

export function resolveColorScheme(
  preference: ThemePreference,
  prefersDark: boolean,
): ColorScheme {
  if (preference === 'system') {
    return prefersDark ? 'dark' : 'light'
  }
  return preference
}

export function applyColorSchemeToDocument(
  scheme: ColorScheme,
  root: HTMLElement = document.documentElement,
): void {
  root.classList.toggle('dark', scheme === 'dark')
  root.style.colorScheme = scheme
}
