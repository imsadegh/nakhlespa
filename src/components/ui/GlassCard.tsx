import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type Props = { children: ReactNode; className?: string; gold?: boolean }

export function GlassCard({ children, className, gold }: Props) {
  return (
    <Card className={cn(gold ? 'glass-gold' : 'glass', 'rounded-2xl border-0 bg-transparent shadow-none', className)}>
      {children}
    </Card>
  )
}
