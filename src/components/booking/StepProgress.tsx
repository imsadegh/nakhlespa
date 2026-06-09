'use client'
import { Progress } from '@/components/ui/progress'

export function StepProgress({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100)
  return (
    <div className="mb-6">
      <div className="flex justify-between text-[9px] mb-2 tracking-wider text-muted-foreground">
        <span>مرحله {current} از {total}</span>
        <span>{pct}٪</span>
      </div>
      <Progress value={pct} className="h-0.5" />
    </div>
  )
}
