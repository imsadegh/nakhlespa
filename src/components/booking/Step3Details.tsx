'use client'
import { GoldButton } from '@/components/ui/GoldButton'
import { GhostButton } from '@/components/ui/GhostButton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { WizardState, Person } from '@/types'

type Props = { state: WizardState; update: (p: Partial<WizardState>) => void; goNext: () => void; goBack: () => void }

function toEnDigits(s: string) {
  return s
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
}

function isValidIranPhone(phone: string) {
  return /^09[0-9]{9}$/.test(phone)
}

function toFaOrdinal(n: number) {
  return String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

export function Step3Details({ state, update, goNext, goBack }: Props) {
  const persons = state.persons

  function setPerson(index: number, patch: Partial<Person>) {
    update({ persons: persons.map((p, i) => i === index ? { ...p, ...patch } : p) })
  }

  function handlePhoneChange(index: number, raw: string) {
    const normalized = toEnDigits(raw).replace(/[^0-9]/g, '')
    setPerson(index, { customerPhone: normalized })
  }

  const canProceed = persons.every((p, i) => {
    const nameOk = p.customerName.trim() !== ''
    const phoneOk = i === 0 ? isValidIranPhone(p.customerPhone) : (p.customerPhone === '' || isValidIranPhone(p.customerPhone))
    return nameOk && phoneOk
  })

  return (
    <div>
      <h2 className="text-base font-light mb-0.5" style={{ color: 'var(--text-primary)' }}>اطلاعات افراد</h2>
      <p className="text-xs mb-3 font-light" style={{ color: 'var(--text-muted)' }}>اطلاعات هر نفر را وارد کنید</p>

      <div className="flex flex-col gap-4">
        {persons.map((person, i) => {
          const phone = person.customerPhone
          const phoneTouched = phone.length > 0
          const phoneValid = isValidIranPhone(phone)
          const isPayer = i === 0

          return (
            <div key={i} className="rounded-2xl border p-3" style={{ borderColor: 'var(--border-base)', background: 'var(--bg-surface)' }}>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                نفر {toFaOrdinal(i + 1)}
                {isPayer && <span className="mr-1 text-[10px]" style={{ color: 'var(--text-faint)' }}>(پرداخت‌کننده — پیامک تأیید ارسال می‌شود)</span>}
              </p>
              <div className="flex flex-col gap-2">
                <Input
                  placeholder="نام و نام خانوادگی *"
                  value={person.customerName}
                  onChange={e => setPerson(i, { customerName: e.target.value })}
                />
                <div>
                  <Input
                    placeholder={isPayer ? 'شماره موبایل * (مثال: 09123456789)' : 'شماره موبایل (اختیاری)'}
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={e => handlePhoneChange(i, e.target.value)}
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
                  value={person.customerNotes}
                  onChange={e => setPerson(i, { customerNotes: e.target.value })}
                  className="h-14"
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-3 mt-4">
        <GhostButton onClick={goBack} className="flex-1">→ برگشت</GhostButton>
        <GoldButton onClick={goNext} className="flex-1" disabled={!canProceed}>ادامه ←</GoldButton>
      </div>
    </div>
  )
}
