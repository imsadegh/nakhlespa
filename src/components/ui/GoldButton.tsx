'use client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { ComponentPropsWithoutRef } from 'react'

type Props = ComponentPropsWithoutRef<typeof Button>

export function GoldButton({ children, className, disabled, ...props }: Props) {
  return (
    <motion.div
      whileTap={disabled ? undefined : { scale: 0.97 }}
      whileHover={disabled ? undefined : { y: -2 }}
      className="inline-flex"
    >
      <Button variant="gold" disabled={disabled} className={cn('rounded-xl px-6 py-3', className)} {...props}>
        {children}
      </Button>
    </motion.div>
  )
}
