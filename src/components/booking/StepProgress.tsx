'use client'
import { motion } from 'framer-motion'

export function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="flex justify-between text-[9px] text-[#F3EFE8]/30 mb-2 tracking-wider">
        <span>مرحله {current} از {total}</span>
        <span>{Math.round((current / total) * 100)}٪</span>
      </div>
      <div className="h-0.5 bg-white/[0.08] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-l from-[#C6A55B] to-[#A8873A] rounded-full"
          animate={{ width: `${(current / total) * 100}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  )
}
