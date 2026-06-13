'use client'
import { cn } from '@/lib/utils'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

type Props = {
  children: React.ReactNode
  className?: string
  disabled?: boolean
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  type?: 'button' | 'submit' | 'reset'
  form?: string
}

export function GoldButton({ children, className, disabled, onClick, type = 'button', form }: Props) {
  const hovered = useMotionValue(0)
  const smoothHover = useSpring(hovered, { stiffness: 160, damping: 18 })
  const shimmerX = useTransform(smoothHover, [0, 1], ['-150%', '150%'])

  return (
    <button
      onMouseEnter={() => !disabled && hovered.set(1)}
      onMouseLeave={() => hovered.set(0)}
      disabled={disabled}
      onClick={onClick}
      type={type}
      form={form}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-3',
        'bg-gradient-to-br from-[#e0c276] via-[#d4b368] to-[#a8893a]',
        'font-bold text-[#0F3D2E]',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-2px_0_rgba(0,0,0,0.18)]',
        'cursor-pointer select-none outline-none',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:ring-2 focus-visible:ring-[#d4b368] focus-visible:ring-offset-2 focus-visible:ring-offset-[#04100b]',
        'active:scale-[0.96] transition-transform duration-100',
        !disabled && 'gold-button-glow',
        className,
      )}
    >
      {/* shimmer sweep — only active on hover via framer-motion */}
      <motion.span
        aria-hidden
        style={{ translateX: shimmerX }}
        className="pointer-events-none absolute top-0 left-0 h-full w-[60%] -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent"
      />

      <span className="relative z-10">{children}</span>
    </button>
  )
}
