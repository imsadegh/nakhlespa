'use client'
import { motion } from 'framer-motion'

const orbs = [
  { size: 500, color: '#0F3D2E', top: '-150px', right: '-100px', left: undefined, bottom: undefined, opacity: 0.6, duration: 20, delay: 0 },
  { size: 350, color: '#C6A55B', bottom: '-80px', left: '-60px', top: undefined, right: undefined, opacity: 0.18, duration: 25, delay: -4 },
  { size: 280, color: '#1F5E46', top: '35%', left: '20%', bottom: undefined, right: undefined, opacity: 0.35, duration: 18, delay: -8 },
  { size: 200, color: '#4F6F52', bottom: '25%', right: '5%', top: undefined, left: undefined, opacity: 0.28, duration: 22, delay: -10 },
  { size: 160, color: '#A8873A', top: '55%', right: '40%', bottom: undefined, left: undefined, opacity: 0.15, duration: 30, delay: -3 },
]

export function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at 15% 10%, #0F3D2E 0%, transparent 55%), radial-gradient(ellipse 70% 60% at 85% 30%, #1a4a35 0%, transparent 50%), radial-gradient(ellipse 60% 50% at 60% 80%, #3B2416 0%, transparent 50%), #04100b',
        }}
      />
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            background: orb.color,
            opacity: orb.opacity,
            filter: 'blur(100px)',
            ...(orb.top !== undefined && { top: orb.top }),
            ...(orb.right !== undefined && { right: orb.right }),
            ...(orb.bottom !== undefined && { bottom: orb.bottom }),
            ...(orb.left !== undefined && { left: orb.left }),
          }}
          animate={{ x: [0, 30, -20, 15, 0], y: [0, -40, 30, 15, 0], scale: [1, 1.06, 0.94, 1.03, 1] }}
          transition={{ duration: orb.duration, delay: orb.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}
