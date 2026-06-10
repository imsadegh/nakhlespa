'use client'
import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'


type OrbMotion = { x: number[]; y: number[]; scale: number[] }

type Orb = {
  size: number; colorVar: string; opacity: number; duration: number; delay: number
  top?: string; right?: string; bottom?: string; left?: string
  motion: OrbMotion
}

const orbs: Orb[] = [
  {
    size: 500, colorVar: '--orb-a', top: '-150px', right: '-100px', opacity: 0.55, duration: 22, delay: 0,
    motion: { x: [0, -80, 40, -60, 0], y: [0, 90, -60, 40, 0], scale: [1, 1.08, 0.95, 1.04, 1] },
  },
  {
    size: 350, colorVar: '--orb-b', bottom: '-80px', left: '-60px', opacity: 0.22, duration: 28, delay: -7,
    motion: { x: [0, 70, -40, 55, 0], y: [0, -80, 50, -30, 0], scale: [1, 1.06, 0.96, 1.03, 1] },
  },
  {
    size: 280, colorVar: '--orb-c', top: '35%', left: '20%', opacity: 0.32, duration: 19, delay: -4,
    motion: { x: [0, 60, -50, 35, 0], y: [0, -70, 60, -40, 0], scale: [1, 1.07, 0.93, 1.05, 1] },
  },
  {
    size: 200, colorVar: '--orb-a', bottom: '25%', right: '5%', opacity: 0.22, duration: 24, delay: -12,
    motion: { x: [0, -55, 45, -30, 0], y: [0, 65, -55, 30, 0], scale: [1, 1.09, 0.94, 1.06, 1] },
  },
  {
    size: 160, colorVar: '--orb-b', top: '55%', right: '40%', opacity: 0.16, duration: 32, delay: -9,
    motion: { x: [0, 45, -35, 50, 0], y: [0, -60, 45, -35, 0], scale: [1, 1.05, 0.97, 1.04, 1] },
  },
]

type Particle = {
  x: number; y: number
  vx: number; vy: number
  baseVy: number           // resting upward drift
  r: number
  alpha: number; alphaDir: number
  burst: boolean           // true = click-spawned, fades out then removed
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
    let scrollBoost = 0   // 0–1, decays each frame
    let lastScrollY = window.scrollY

    canvas.width = W
    canvas.height = H

    const COUNT = Math.min(Math.floor((W * H) / 14000), 80)
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

    // Spawn burst particles at click point
    function spawnBurst(cx: number, cy: number) {
      const count = 18
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3
        const speed = Math.random() * 2.5 + 0.8
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          baseVy: 0,
          r: Math.random() * 2.2 + 0.6,
          alpha: Math.random() * 0.5 + 0.25,
          alphaDir: -1,  // always fading out
          burst: true,
        })
      }
    }

    const onResize = () => {
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = W
      canvas.height = H
    }

    const onScroll = () => {
      const delta = Math.abs(window.scrollY - lastScrollY)
      scrollBoost = Math.min(1, scrollBoost + delta * 0.012)
      lastScrollY = window.scrollY
    }

    const onClick = (e: MouseEvent) => spawnBurst(e.clientX, e.clientY)

    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('click', onClick)

    function isLightTheme() {
      const attr = document.documentElement.getAttribute('data-theme')
      if (attr === 'light') return true
      if (attr === 'dark') return false
      return window.matchMedia('(prefers-color-scheme: light)').matches
    }

    function draw() {
      ctx!.clearRect(0, 0, W, H)

      // Decay scroll boost
      scrollBoost = Math.max(0, scrollBoost - 0.018)
      const speedMul = 1 + scrollBoost * 3.5

      const light = isLightTheme()

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]

        if (p.burst) {
          p.x += p.vx
          p.y += p.vy
          p.vx *= 0.96
          p.vy *= 0.96
          p.alpha -= 0.012
          if (p.alpha <= 0) { particles.splice(i, 1); continue }
        } else {
          p.vy = p.baseVy * speedMul
          p.x += p.vx
          p.y += p.vy
          p.alpha += p.alphaDir * 0.0015
          if (p.alpha > 0.45 || p.alpha < 0.05) p.alphaDir *= -1
          if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W }
          if (p.x < -10) p.x = W + 10
          if (p.x > W + 10) p.x = -10
        }

        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx!.fillStyle = light
          ? `rgba(139,100,40,${p.alpha})`
          : `rgba(198,165,91,${p.alpha})`
        ctx!.fill()
      }

      rafId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('click', onClick)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
}

export function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {/* Solid base color */}
      <div className="absolute inset-0 transition-colors duration-500" style={{ backgroundColor: 'var(--bg-base)' }} />

      {/* Gradient layer — soft multi-stop radials so no hard color edge */}
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

      {/* Animated orbs — radial-gradient inside so blur operates on a pre-soft shape */}
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle at 50% 50%, var(${orb.colorVar}) 0%, color-mix(in srgb, var(${orb.colorVar}) 50%, transparent) 40%, transparent 70%)`,
            opacity: orb.opacity,
            filter: `blur(${Math.round(orb.size * 0.22)}px)`,
            top: orb.top,
            right: orb.right,
            bottom: orb.bottom,
            left: orb.left,
          }}
          animate={orb.motion}
          transition={{ duration: orb.duration, delay: orb.delay, repeat: Infinity, ease: 'easeInOut', repeatType: 'loop' }}
        />
      ))}

      {/* Floating particles — reactive to scroll and click */}
      <ParticleCanvas />
    </div>
  )
}
