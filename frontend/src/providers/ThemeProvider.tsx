import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  applyColorSchemeToDocument,
  readThemePreference,
  resolveColorScheme,
  THEME_STORAGE_KEY,
  type ColorScheme,
  type ThemePreference,
} from '@/lib/theme'

type ThemeContextValue = {
  preference: ThemePreference
  resolvedScheme: ColorScheme
  setPreference: (preference: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getSystemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    readThemePreference(),
  )
  const [resolvedScheme, setResolvedScheme] = useState<ColorScheme>(() =>
    resolveColorScheme(readThemePreference(), getSystemPrefersDark()),
  )

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const sync = () => {
      const scheme = resolveColorScheme(preference, media.matches)
      setResolvedScheme(scheme)
      applyColorSchemeToDocument(scheme)
    }

    sync()
    localStorage.setItem(THEME_STORAGE_KEY, preference)

    if (preference === 'system') {
      media.addEventListener('change', sync)
      return () => media.removeEventListener('change', sync)
    }

    return undefined
  }, [preference])

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next)
  }, [])

  const value = useMemo(
    () => ({
      preference,
      resolvedScheme,
      setPreference,
    }),
    [preference, resolvedScheme, setPreference],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
