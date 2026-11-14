'use client'

import { useEffect, useState } from 'react'
import Silk from '@/components/ui/Silk'

export function HomeBackground({ paused }: { paused: boolean }) {
  const [light, setLight] = useState<boolean | null>(null)

  useEffect(() => {
    const root = document.documentElement
    const systemTheme = window.matchMedia('(prefers-color-scheme: light)')
    const updateTheme = () => {
      const theme = root.getAttribute('data-theme')
      setLight(theme === 'light' || (!theme && systemTheme.matches))
    }
    const observer = new MutationObserver(updateTheme)
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    systemTheme.addEventListener('change', updateTheme)
    updateTheme()
    return () => {
      observer.disconnect()
      systemTheme.removeEventListener('change', updateTheme)
    }
  }, [])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 bg-[var(--bg-base)]">
      {light !== null && (
        <Silk
          color={light ? '#d9cdaf' : '#1c4b39'}
          sheenColor="#e2c384"
          lightMode={light}
          speed={1.2}
          scale={0.9}
          rotation={-0.3}
          depth={0.34}
          sheen={0.32}
          noiseIntensity={0.25}
          glow={0}
          dpr={0.65}
          mouseInteraction={false}
          clickRipple={false}
          intro={false}
          paused={paused}
          style={{ opacity: light ? 0.68 : 0.54 }}
        />
      )}
    </div>
  )
}
