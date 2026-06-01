import { cn } from '@/lib/utils'

type Props = { children: React.ReactNode; className?: string; gold?: boolean }

export function GlassCard({ children, className, gold }: Props) {
  return (
    <div className={cn(gold ? 'glass-gold' : 'glass', 'rounded-2xl', className)}>
      {children}
    </div>
  )
}
