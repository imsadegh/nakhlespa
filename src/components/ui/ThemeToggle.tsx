'use client'
import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'auto'

const LABEL: Record<Theme, string> = { dark: 'تاریک', light: 'روشن', auto: 'خودکار' }
const CYCLE: Theme[] = ['auto', 'dark', 'light']

function ThemeIcon({ theme }: { theme: Theme }) {
  if (theme === 'dark') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
  if (theme === 'light') return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
  // auto
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  )
}

function applyTheme(t: Theme) {
  const isDark =
    t === 'dark' ||
    (t === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  if (t === 'auto') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', t)
  }

  document.documentElement.classList.toggle('dark', isDark)
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('auto')

  useEffect(() => {
    const stored = (localStorage.getItem('theme') as Theme) ?? 'auto'
    setTheme(stored)
    applyTheme(stored)
  }, [])

  function cycle() {
    const next = CYCLE[(CYCLE.indexOf(theme) + 1) % CYCLE.length]
    setTheme(next)
    localStorage.setItem('theme', next)
    applyTheme(next)
  }

  return (
    <button
      onClick={cycle}
      title={`تم: ${LABEL[theme]}`}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors
        bg-white/[0.07] border border-white/[0.12] hover:bg-white/[0.13]
        text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
    >
      <ThemeIcon theme={theme} />
      <span>{LABEL[theme]}</span>
    </button>
  )
}
