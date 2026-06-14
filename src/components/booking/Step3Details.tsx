'use client'
import { GoldButton } from '@/components/ui/GoldButton'
import { GhostButton } from '@/components/ui/GhostButton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { WizardState } from './BookingWizard'

type Props = { state: WizardState; update: (p: Partial<WizardState>) => void; goNext: () => void; goBack: () => void }

function toEnDigits(s: string) {
  return s
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
}

function isValidIranPhone(phone: string) {
  return /^09[0-9]{9}$/.test(phone)
}

export function Step3Details({ state, update, goNext, goBack }: Props) {
  const phone = state.customerPhone ?? ''
  const phoneValid = isValidIranPhone(phone)
  const phoneTouched = phone.length > 0
  const canProceed = !!(state.customerName?.trim()) && phoneValid

  function handlePhoneChange(raw: string) {
    // strip everything that isn't a digit after converting Persian/Arabic digits
    const normalized = toEnDigits(raw).replace(/[^0-9]/g, '')
    update({ customerPhone: normalized })
  }

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
        <div>
          <Input
            placeholder="شماره موبایل * (مثال: 09123456789)"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={e => handlePhoneChange(e.target.value)}
            className={phoneTouched && !phoneValid ? 'border-destructive focus-visible:ring-destructive/30' : ''}
          />
          {phoneTouched && !phoneValid && (
            <p className="text-[11px] mt-1 pr-1" style={{ color: 'var(--color-destructive, #f87171)' }}>
              شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود
            </p>
          )}
        </div>
        <Textarea
          placeholder="توضیحات (اختیاری)"
          value={state.customerNotes ?? ''}
          onChange={e => update({ customerNotes: e.target.value })}
          className="h-16"
        />
      </div>
      <div className="flex gap-3">
        <GhostButton onClick={goBack} className="flex-1">→ برگشت</GhostButton>
        <GoldButton onClick={goNext} className="flex-1" disabled={!canProceed}>ادامه ←</GoldButton>
      </div>
    </div>
  )
}
