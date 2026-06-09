'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'
type Ctx = { theme: Theme; toggle: () => void }

const ThemeContext = createContext<Ctx>({ theme: 'dark', toggle: () => {} })

export function useTheme() {
  return useContext(ThemeContext)
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('predique-theme') as Theme | null
    const initial =
      saved ??
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    apply(initial)
    setTheme(initial)
  }, [])

  const apply = (t: Theme) => {
    document.documentElement.classList.toggle('light', t === 'light')
    console.log('[Theme] apply:', t, '| html classes:', document.documentElement.className)
  }

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    console.log('[Theme] toggle:', theme, '→', next)
    apply(next)
    setTheme(next)
    localStorage.setItem('predique-theme', next)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}
