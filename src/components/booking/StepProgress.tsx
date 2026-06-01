'use client'
import { motion } from 'framer-motion'

export function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-6">
      <div className="flex justify-between text-[9px] mb-2 tracking-wider" style={{ color: 'var(--text-faint)' }}>
        <span>مرحله {current} از {total}</span>
        <span>{Math.round((current / total) * 100)}٪</span>
      </div>
      <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'var(--border-base)' }}>
        <motion.div
          className="h-full bg-gradient-to-l from-[#C6A55B] to-[#A8873A] rounded-full"
          animate={{ width: `${(current / total) * 100}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  )
}
