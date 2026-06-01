'use client'
import { motion } from 'framer-motion'

export function ConfirmCheckmark() {
  return (
    <motion.div
      initial={{ scale: 0 }} animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className="w-20 h-20 rounded-full bg-gradient-to-br from-[#C6A55B] to-[#A8873A] flex items-center justify-center shadow-[0_8px_32px_rgba(198,165,91,0.5)]"
    >
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <motion.path
          d="M8 18L15 25L28 11"
          stroke="#0F3D2E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
        />
      </svg>
    </motion.div>
  )
}
