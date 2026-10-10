'use client'
import { useEffect, useRef } from 'react'

type Particle = {
  x: number; y: number
  vx: number; vy: number
  baseVy: number
  r: number
  alpha: number; alphaDir: number
}

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = window.innerWidth
    let H = window.innerHeight
    let rafId: number
    let scrollBoost = 0
    let lastScrollY = window.scrollY
    let lastActivityAt = Date.now()
    let lastFrameAt = 0
    let hidden = document.hidden

    canvas.width = W
    canvas.height = H

    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    const COUNT = isMobileDevice
      ? Math.min(Math.floor((W * H) / 20000), 20)
      : Math.min(Math.floor((W * H) / 18000), 80)

    const particles: Particle[] = Array.from({ length: COUNT }, () => {
      const baseVy = -(Math.random() * 0.3 + 0.08)
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.25,
        vy: baseVy,
        baseVy,
        r: Math.random() * 1.8 + 0.4,
        alpha: Math.random() * 0.35 + 0.08,
        alphaDir: Math.random() > 0.5 ? 1 : -1,
      }
    })

    const onResize = () => {
      W = window.innerWidth; H = window.innerHeight
      canvas.width = W; canvas.height = H
    }

    const onScroll = () => {
      const delta = Math.abs(window.scrollY - lastScrollY)
      scrollBoost = Math.min(1, scrollBoost + delta * 0.012)
      lastScrollY = window.scrollY
      lastActivityAt = Date.now()
    }

    const onVisibility = () => { hidden = document.hidden }

    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)

    function isLightTheme() {
      const attr = document.documentElement.getAttribute('data-theme')
      if (attr === 'light') return true
      if (attr === 'dark') return false
      return window.matchMedia('(prefers-color-scheme: light)').matches
    }

    function draw() {
      rafId = requestAnimationFrame(draw)
      if (hidden) return

      const now = Date.now()
      const idle = now - lastActivityAt > 2000
      if (now - lastFrameAt < (idle ? 50 : 25)) return
      lastFrameAt = now

      ctx.clearRect(0, 0, W, H)
      scrollBoost = Math.max(0, scrollBoost - 0.018)
      const speedMul = 1 + scrollBoost * 3.5
      const light = isLightTheme()

      for (const p of particles) {
        p.vx *= 0.92
        p.vy = p.vy * 0.92 + p.baseVy * speedMul * 0.08
        p.x += p.vx; p.y += p.vy
        p.alpha += p.alphaDir * 0.0015
        if (p.alpha > 0.45 || p.alpha < 0.05) p.alphaDir *= -1
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W }
        if (p.x < -10) p.x = W + 10
        if (p.x > W + 10) p.x = -10

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = light
          ? `rgba(139,100,40,${p.alpha})`
          : `rgba(198,165,91,${p.alpha})`
        ctx.fill()
      }
    }

    draw()
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full pointer-events-none" />
}

export function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0 transition-colors duration-500"
        style={{ backgroundColor: 'var(--bg-base)' }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 160% 140% at -10% -10%, var(--orb-a) 0%, color-mix(in srgb, var(--orb-a) 45%, transparent) 55%, transparent 100%), ' +
            'radial-gradient(ellipse 145% 120% at 110% 35%, var(--orb-c) 0%, color-mix(in srgb, var(--orb-c) 40%, transparent) 55%, transparent 100%), ' +
            'radial-gradient(ellipse 130% 135% at 85% 110%, var(--orb-b) 0%, color-mix(in srgb, var(--orb-b) 30%, transparent) 55%, transparent 100%)',
          opacity: 0.2,
        }}
      />
      <ParticleCanvas />
    </div>
  )
}
