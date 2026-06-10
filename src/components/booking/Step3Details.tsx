'use client'
import { GoldButton } from '@/components/ui/GoldButton'
import { GhostButton } from '@/components/ui/GhostButton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { WizardState } from './BookingWizard'

type Props = { state: WizardState; update: (p: Partial<WizardState>) => void; goNext: () => void; goBack: () => void }

export function Step3Details({ state, update, goNext, goBack }: Props) {
  return (
    <div>
      <h2 className="text-base font-light mb-0.5 text-foreground">اطلاعات شما</h2>
      <p className="text-xs mb-3 font-light text-muted-foreground">لطفاً اطلاعات تماس را وارد کنید</p>
      <div className="flex flex-col gap-2 mb-4">
        <Input
          placeholder="نام و نام خانوادگی *"
          value={state.customerName ?? ''}
          onChange={e => update({ customerName: e.target.value })}
        />
        <Input
          placeholder="شماره موبایل *"
          type="tel"
          value={state.customerPhone ?? ''}
          onChange={e => update({ customerPhone: e.target.value })}
        />
        <Textarea
          placeholder="توضیحات (اختیاری)"
          value={state.customerNotes ?? ''}
          onChange={e => update({ customerNotes: e.target.value })}
          className="h-16"
        />
      </div>
      <div className="flex gap-3">
        <GhostButton onClick={goBack} className="flex-1">→ برگشت</GhostButton>
        <GoldButton onClick={goNext} className="flex-1" disabled={!state.customerName || !state.customerPhone}>ادامه ←</GoldButton>
      </div>
    </div>
  )
}
