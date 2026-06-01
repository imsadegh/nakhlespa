'use client'
import { GoldButton } from '@/components/ui/GoldButton'
import { GhostButton } from '@/components/ui/GhostButton'
import type { WizardState } from './BookingWizard'

type Props = { state: WizardState; update: (p: Partial<WizardState>) => void; goNext: () => void; goBack: () => void }

const inputClass = 'w-full glass rounded-xl px-4 py-3 text-sm text-[#F3EFE8] placeholder:text-[#F3EFE8]/30 bg-transparent outline-none focus:ring-1 focus:ring-[rgba(198,165,91,0.4)] transition-all'

export function Step3Details({ state, update, goNext, goBack }: Props) {
  return (
    <div>
      <h2 className="text-xl font-light text-[#F3EFE8] mb-1">اطلاعات شما</h2>
      <p className="text-xs text-[#F3EFE8]/40 mb-6 font-light">لطفاً اطلاعات تماس را وارد کنید</p>
      <div className="flex flex-col gap-3 mb-8">
        <input className={inputClass} placeholder="نام و نام خانوادگی *" value={state.customerName ?? ''} onChange={e => update({ customerName: e.target.value })} />
        <input className={inputClass} placeholder="شماره موبایل *" type="tel" value={state.customerPhone ?? ''} onChange={e => update({ customerPhone: e.target.value })} />
        <textarea className={`${inputClass} resize-none h-24`} placeholder="توضیحات (اختیاری)" value={state.customerNotes ?? ''} onChange={e => update({ customerNotes: e.target.value })} />
      </div>
      <div className="flex gap-3">
        <GhostButton onClick={goBack} className="flex-1">→ برگشت</GhostButton>
        <GoldButton onClick={goNext} className="flex-1" disabled={!state.customerName || !state.customerPhone}>ادامه ←</GoldButton>
      </div>
    </div>
  )
}
