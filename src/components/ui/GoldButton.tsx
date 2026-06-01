'use client'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type Props = {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit'
  disabled?: boolean
}

export function GoldButton({ children, onClick, className, type = 'button', disabled }: Props) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      whileHover={disabled ? undefined : { y: -2 }}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-[#0F3D2E] cursor-pointer',
        'bg-gradient-to-br from-[#d4b368] via-[#C6A55B] to-[#9a7830]',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-2px_0_rgba(0,0,0,0.18),0_6px_24px_rgba(198,165,91,0.4)]',
        'transition-shadow hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_10px_36px_rgba(198,165,91,0.55)]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {children}
    </motion.button>
  )
}
