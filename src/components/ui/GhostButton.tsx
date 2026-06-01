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
      style={{ color: 'var(--text-muted)' }}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm cursor-pointer',
        'glass backdrop-blur-xl',
        'hover:opacity-80 transition-opacity',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {children}
    </motion.button>
  )
}
