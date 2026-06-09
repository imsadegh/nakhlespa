'use client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { ComponentPropsWithoutRef } from 'react'

type Props = ComponentPropsWithoutRef<typeof Button>

export function GhostButton({ children, className, disabled, ...props }: Props) {
  return (
    <motion.div
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className="inline-flex"
    >
      <Button variant="ghost" disabled={disabled} className={cn('glass rounded-xl px-5 py-3 text-muted-foreground', className)} {...props}>
        {children}
      </Button>
    </motion.div>
  )
}
