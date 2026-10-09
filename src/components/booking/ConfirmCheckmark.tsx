'use client'
import { motion } from 'framer-motion'

export function ConfirmCheckmark({ gender }: { gender: 'FEMALE' | 'MALE' }) {
  const isFemale = gender === 'FEMALE'
  return (
    <motion.div
      initial={{ scale: 0 }} animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className={`flex size-20 items-center justify-center rounded-full bg-gradient-to-br ${isFemale ? 'from-[#D88CA6] to-[#B86882] shadow-[0_8px_32px_rgba(184,104,130,0.42)]' : 'from-[#4C9A8A] to-[#1F6F64] shadow-[0_8px_32px_rgba(31,111,100,0.42)]'}`}
    >
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <motion.path
          d="M8 18L15 25L28 11"
          stroke={isFemale ? '#3D1825' : '#082C28'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
        />
      </svg>
    </motion.div>
  )
}
