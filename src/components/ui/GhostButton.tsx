'use client'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

type Props = {
  children: React.ReactNode
  className?: string
  disabled?: boolean
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  type?: 'button' | 'submit' | 'reset'
}

export function GhostButton({ children, className, disabled, onClick, type = 'button' }: Props) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      disabled={disabled}
      onClick={onClick}
      type={type}
      className={cn(
        'glass inline-flex items-center justify-center rounded-xl px-5 py-3',
        'text-sm font-light text-muted-foreground/70',
        'cursor-pointer select-none outline-none',
        'disabled:pointer-events-none disabled:opacity-50',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
    >
      {children}
    </motion.button>
  )
}
