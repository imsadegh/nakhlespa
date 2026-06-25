'use client'
import { useState } from 'react'
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

  const grandTotal = state.persons.reduce((sum, person) => {
    const svc = services.find(s => s.id === person.serviceId)
    const addonSum = person.addonIds.reduce((a, id) => a + (addons.find(ad => ad.id === id)?.price ?? 0), 0)
    return sum + (svc?.price ?? 0) + addonSum
  }, 0)

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
      }))
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookings }),
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
        <div className="flex justify-between text-xs">
          <span style={{ color: 'var(--text-muted)' }}>ساعت</span>
          <span style={{ color: 'var(--text-primary)' }}>
            {state.startTime ? toFaTime(state.startTime) : '—'}
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

      {/* Grand total */}
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
