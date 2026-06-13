'use client'
import { useEffect, useRef } from 'react'

type Particle = {
  x: number; y: number
  vx: number; vy: number
  baseVy: number
  r: number
  alpha: number; alphaDir: number
  burst: boolean
}

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    if (!ctx) return

    let W = window.innerWidth
    let H = window.innerHeight
    let rafId: number
    let scrollBoost = 0
    let lastScrollY = window.scrollY
    let mouseX = W / 2
    let mouseY = H / 2
    let lastMouseMove = 0
    let lastActivityAt = Date.now()
    let lastFrameAt = 0
    let hidden = document.hidden

    canvas.width = W
    canvas.height = H

    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    // Reduced counts: mobile 20, desktop 40 (was 30/80)
    const COUNT = isMobileDevice
      ? Math.min(Math.floor((W * H) / 20000), 20)
      : Math.min(Math.floor((W * H) / 18000), 40)

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
        burst: false,
      }
    })

    function spawnBurst(cx: number, cy: number) {
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.3
        const speed = Math.random() * 2.5 + 0.8
        particles.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          baseVy: 0,
          r: Math.random() * 2.2 + 0.6,
          alpha: Math.random() * 0.5 + 0.25,
          alphaDir: -1,
          burst: true,
        })
      }
    }

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

    const onClick = (e: MouseEvent) => { spawnBurst(e.clientX, e.clientY); lastActivityAt = Date.now() }

    const onMouseMove = (e: MouseEvent) => {
      const now = Date.now()
      if (now - lastMouseMove < 32) return
      lastMouseMove = now
      lastActivityAt = now
      mouseX = e.clientX
      mouseY = e.clientY
    }

    const onVisibility = () => { hidden = document.hidden }

    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('click', onClick)
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)

    function isLightTheme() {
      const attr = document.documentElement.getAttribute('data-theme')
      if (attr === 'light') return true
      if (attr === 'dark') return false
      return window.matchMedia('(prefers-color-scheme: light)').matches
    }

    function draw() {
      rafId = requestAnimationFrame(draw)

      // Pause entirely when tab is hidden
      if (hidden) return

      const now = Date.now()
      const idle = now - lastActivityAt > 2000
      // 30fps idle, 60fps active
      if (now - lastFrameAt < (idle ? 33 : 16)) return
      lastFrameAt = now

      ctx.clearRect(0, 0, W, H)
      scrollBoost = Math.max(0, scrollBoost - 0.018)
      const speedMul = 1 + scrollBoost * 3.5
      const light = isLightTheme()

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]

        if (p.burst) {
          p.x += p.vx; p.y += p.vy
          p.vx *= 0.96; p.vy *= 0.96
          p.alpha -= 0.012
          if (p.alpha <= 0) { particles.splice(i, 1); continue }
        } else {
          const dx = mouseX - p.x
          const dy = mouseY - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 180 && dist > 0) {
            const force = (1 - dist / 180) * 0.045
            p.vx -= (dx / dist) * force
            p.vy -= (dy / dist) * force
          }
          p.vx *= 0.92
          p.vy = p.vy * 0.92 + p.baseVy * speedMul * 0.08
          p.x += p.vx; p.y += p.vy
          p.alpha += p.alphaDir * 0.0015
          if (p.alpha > 0.45 || p.alpha < 0.05) p.alphaDir *= -1
          if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W }
          if (p.x < -10) p.x = W + 10
          if (p.x > W + 10) p.x = -10
        }

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
      window.removeEventListener('click', onClick)
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
}

export function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {/* Solid base */}
      <div className="absolute inset-0 transition-colors duration-500" style={{ backgroundColor: 'var(--bg-base)' }} />

      {/* Static gradient glow — no JS, no repaints */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at 15% 10%, var(--orb-a) 0%, color-mix(in srgb, var(--orb-a) 40%, transparent) 35%, transparent 65%), ' +
            'radial-gradient(ellipse 70% 60% at 85% 30%, var(--orb-c) 0%, color-mix(in srgb, var(--orb-c) 40%, transparent) 30%, transparent 60%), ' +
            'radial-gradient(ellipse 60% 50% at 60% 80%, var(--orb-b) 0%, color-mix(in srgb, var(--orb-b) 40%, transparent) 30%, transparent 60%)',
          opacity: 0.35,
        }}
      />

      <ParticleCanvas />
    </div>
  )
}
