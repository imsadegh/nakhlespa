'use client'
import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'auto'

const ICON: Record<Theme, string> = { dark: '🌙', light: '☀️', auto: '⚙️' }
const LABEL: Record<Theme, string> = { dark: 'تاریک', light: 'روشن', auto: 'خودکار' }
const CYCLE: Theme[] = ['auto', 'dark', 'light']

function applyTheme(t: Theme) {
  if (t === 'auto') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', t)
  }
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
      <span className="text-base leading-none">{ICON[theme]}</span>
    </button>
  )
}
