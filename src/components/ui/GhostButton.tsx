'use client'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type Props = {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
}

export function GhostButton({ children, onClick, className, disabled }: Props) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm text-[#F3EFE8]/80 cursor-pointer',
        'bg-white/[0.07] border border-white/[0.14] backdrop-blur-xl',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_4px_16px_rgba(0,0,0,0.25)]',
        'hover:bg-white/[0.12] transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {children}
    </motion.button>
  )
}
