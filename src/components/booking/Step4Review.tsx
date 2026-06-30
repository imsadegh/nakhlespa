'use client'
import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import { GhostButton } from '@/components/ui/GhostButton'
import type { WizardState, ServiceDTO, AddonDTO } from '@/types'

type Props = { state: WizardState; goBack: () => void; services: ServiceDTO[]; addons: AddonDTO[] }

function toFaTime(t: string) {
  return t.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

export function Step4Review({ state, goBack, services, addons }: Props) {
  const [loading, setLoading] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoStatus, setPromoStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoCodeId, setPromoCodeId] = useState('')
  const [promoMessage, setPromoMessage] = useState('')
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0)
  const [loyaltyChecked, setLoyaltyChecked] = useState(false)

  const subtotal = state.persons.reduce((sum, person) => {
    const svc = services.find(s => s.id === person.serviceId)
    const addonSum = person.addonIds.reduce((a, id) => a + (addons.find(ad => ad.id === id)?.price ?? 0), 0)
    return sum + (svc?.price ?? 0) + addonSum
  }, 0)

  const phone = state.persons[0]?.customerPhone ?? ''

  useEffect(() => {
    if (!phone || loyaltyChecked) return
    setLoyaltyChecked(true)
    fetch(`/api/discounts/loyalty?phone=${phone}&total=${subtotal}`)
      .then(r => r.json())
      .then(data => { if (data.eligible) setLoyaltyDiscount(data.discountAmount) })
      .catch(() => {})
  }, [phone, subtotal, loyaltyChecked])

  async function handlePromoValidate() {
    if (!promoCode.trim()) return
    const res = await fetch(`/api/discounts/validate?code=${encodeURIComponent(promoCode)}&phone=${phone}&total=${subtotal}`)
    const data = await res.json()
    if (data.valid) {
      setPromoStatus('valid')
      setPromoDiscount(data.discountAmount)
      setPromoCodeId(data.codeId)
      setPromoMessage('')
    } else {
      setPromoStatus('invalid')
      setPromoDiscount(0)
      setPromoCodeId('')
      setPromoMessage(data.message ?? 'کد تخفیف معتبر نیست')
    }
  }

  const appliedDiscount = promoStatus === 'valid' ? promoDiscount : loyaltyDiscount
  const grandTotal = Math.max(0, subtotal - appliedDiscount)

  async function handlePay() {
    if (loading || !state.date || !state.startTime) return
    setLoading(true)
    try {
      const bookings = state.persons.map(person => ({
        serviceId: person.serviceId,
        customerName: person.customerName,
        customerPhone: person.customerPhone,
        customerNotes: person.customerNotes || undefined,
        date: state.date!,
        startTime: state.startTime!,
        addonIds: person.addonIds,
        gender: state.gender!,
      }))
      const body: { bookings: typeof bookings; promoCode?: string } = { bookings }
      if (promoStatus === 'valid' && promoCode) body.promoCode = promoCode
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Booking failed')
      const { paymentUrl } = await res.json()
      window.location.href = paymentUrl
    } catch {
      setLoading(false)
      alert('خطا در ایجاد رزرو. لطفاً دوباره تلاش کنید.')
    }
  }

  return (
    <div>
      <h2 className="text-base font-light mb-0.5" style={{ color: 'var(--text-primary)' }}>مرور و پرداخت</h2>
      <p className="text-xs mb-3 font-light" style={{ color: 'var(--text-muted)' }}>اطلاعات رزرو را بررسی کنید</p>

      {/* Date/time summary */}
      <GlassCard className="p-3 mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span style={{ color: 'var(--text-muted)' }}>تاریخ</span>
          <span style={{ color: 'var(--text-primary)' }}>
            {state.date ? new Date(state.date).toLocaleDateString('fa-IR') : '—'}
          </span>
        </div>
        <div className="flex justify-between text-xs mb-1">
          <span style={{ color: 'var(--text-muted)' }}>ساعت</span>
          <span style={{ color: 'var(--text-primary)' }}>
            {state.startTime ? toFaTime(state.startTime) : '—'}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span style={{ color: 'var(--text-muted)' }}>جلسه</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${state.gender === 'FEMALE' ? 'bg-pink-400/10 text-pink-400' : 'bg-blue-400/10 text-blue-400'}`}>
            {state.gender === 'FEMALE' ? 'خانم' : 'آقا'}
          </span>
        </div>
      </GlassCard>

      {/* Per-person breakdown */}
      <div className="flex flex-col gap-2 mb-3">
        {state.persons.map((person, i) => {
          const svc = services.find(s => s.id === person.serviceId)
          const selectedAddons = addons.filter(a => person.addonIds.includes(a.id))
          const personTotal = (svc?.price ?? 0) + selectedAddons.reduce((s, a) => s + a.price, 0)
          return (
            <GlassCard key={i} className="p-3 space-y-1.5">
              <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--text-faint)' }}>
                نفر {String(i + 1).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])}
              </p>
              {([
                ['نام', person.customerName || '—'],
                ['غرفه', svc?.nameFa ?? '—'],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ color: 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}
              {selectedAddons.map(a => (
                <div key={a.id} className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>{a.nameFa}</span>
                  <span style={{ color: 'var(--text-primary)' }}>+{a.price.toLocaleString('fa-IR')} ت</span>
                </div>
              ))}
              <div className="flex justify-between text-xs font-semibold border-t border-[rgba(198,165,91,0.15)] pt-1.5">
                <span style={{ color: 'var(--text-muted)' }}>جمع</span>
                <span className="text-[#C6A55B]">{personTotal.toLocaleString('fa-IR')} ت</span>
              </div>
            </GlassCard>
          )
        })}
      </div>

      {/* Loyalty discount banner */}
      {loyaltyDiscount > 0 && promoStatus !== 'valid' && (
        <div className="flex justify-between text-xs px-1 mb-2 text-emerald-400">
          <span>تخفیف وفاداری ۲۰٪</span>
          <span>−{loyaltyDiscount.toLocaleString('fa-IR')} ت</span>
        </div>
      )}

      {/* Promo code */}
      <div className="mb-3">
        <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>کد تخفیف</p>
        <div className="flex gap-2">
          <input
            value={promoCode}
            onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoStatus('idle') }}
            placeholder="کد تخفیف را وارد کنید"
            className="flex-1 text-xs px-3 py-2 rounded-lg bg-white/5 border border-white/10 outline-none"
            style={{ color: 'var(--text-primary)', direction: 'ltr' }}
          />
          <GhostButton onClick={handlePromoValidate} className="text-xs px-3">اعمال</GhostButton>
        </div>
        {promoStatus === 'valid' && (
          <p className="text-xs mt-1 text-emerald-400">کد اعمال شد: −{promoDiscount.toLocaleString('fa-IR')} ت</p>
        )}
        {promoStatus === 'invalid' && (
          <p className="text-xs mt-1 text-red-400">{promoMessage}</p>
        )}
      </div>

      {/* Grand total */}
      {appliedDiscount > 0 && (
        <div className="flex justify-between text-xs px-1 mb-1" style={{ color: 'var(--text-muted)' }}>
          <span>قبل از تخفیف</span>
          <span>{subtotal.toLocaleString('fa-IR')} ت</span>
        </div>
      )}
      <div className="flex justify-between text-sm font-semibold px-1 mb-4">
        <span style={{ color: 'var(--text-primary)' }}>جمع کل</span>
        <span className="text-[#C6A55B]">{grandTotal.toLocaleString('fa-IR')} تومان</span>
      </div>

      <div className="flex gap-3">
        <GhostButton onClick={goBack} className="flex-1">→ برگشت</GhostButton>
        <GoldButton onClick={handlePay} className="flex-1" disabled={loading}>
          {loading ? 'در حال انتقال...' : '← پرداخت با زرین‌پال'}
        </GoldButton>
      </div>
    </div>
  )
}
