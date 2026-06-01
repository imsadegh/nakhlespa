import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = { children: ReactNode; className?: string; gold?: boolean }

export function GlassCard({ children, className, gold }: Props) {
  return (
    <div className={cn(gold ? 'glass-gold' : 'glass', 'rounded-2xl', className)}>
      {children}
    </div>
  )
}
