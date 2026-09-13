'use client'

import { useEffect, useState } from 'react'
import GradientWaves from '@/components/ui/GradientWaves'

type Theme = 'light' | 'dark'

function getTheme(): Theme {
  const explicitTheme = document.documentElement.getAttribute('data-theme')
  if (explicitTheme === 'dark') return 'dark'
  if (explicitTheme === 'light') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function LandingWavesBackground() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const updateTheme = () => setTheme(getTheme())
    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    const colorScheme = window.matchMedia('(prefers-color-scheme: dark)')
    colorScheme.addEventListener('change', updateTheme)
    updateTheme()

    return () => {
      observer.disconnect()
      colorScheme.removeEventListener('change', updateTheme)
    }
  }, [])

  const colors = theme === 'dark'
    ? { horizonColor: '#0F3D2E', waveColor: '#1F5E46', crestColor: '#C6A55B' }
    : { horizonColor: '#f5ede0', waveColor: '#8eb89a', crestColor: '#d4b368' }

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <GradientWaves
        {...colors}
        speed={0.24}
        amplitude={2.4}
        waveScale={0.55}
        waveRatio={0.9}
        swell={35}
        turbulence={20}
        tilt={1.11}
        zoom={1}
        height={5.5}
        fogDepth={15}
        detail="medium"
        brightness={0.95}
        opacity={0.82}
        mouseInteraction
        parallaxStrength={0.25}
        grain
        grainIntensity={0.025}
      />
    </div>
  )
}
