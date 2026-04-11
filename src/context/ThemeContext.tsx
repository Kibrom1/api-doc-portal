import { createContext, useContext, useEffect, useState } from 'react'

export const THEMES = [
  { id: 'dark',     label: 'Dark',     dot: '#6366f1' },
  { id: 'light',    label: 'Light',    dot: '#4f46e5' },
  { id: 'midnight', label: 'Midnight', dot: '#06b6d4' },
  { id: 'dracula',  label: 'Dracula',  dot: '#ff79c6' },
  { id: 'nord',     label: 'Nord',     dot: '#88c0d0' },
] as const

export type ThemeId = typeof THEMES[number]['id']

interface ThemeCtx {
  theme: ThemeId
  setTheme: (t: ThemeId) => void
  isLight: boolean
}

const ThemeContext = createContext<ThemeCtx>({
  theme: 'dark',
  setTheme: () => {},
  isLight: false,
})

const STORAGE_KEY = 'api-doc-portal-theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(
    () => (localStorage.getItem(STORAGE_KEY) as ThemeId | null) ?? 'dark'
  )

  const setTheme = (t: ThemeId) => {
    setThemeState(t)
    localStorage.setItem(STORAGE_KEY, t)
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLight: theme === 'light' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
