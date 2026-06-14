'use client'
import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import { GhostButton } from '@/components/ui/GhostButton'
import type { WizardState } from './BookingWizard'
import type { ServiceDTO, AddonDTO } from '@/types'

type Props = { state: WizardState; goBack: () => void; services: ServiceDTO[]; addons: AddonDTO[] }

export function Step4Review({ state, goBack, services, addons }: Props) {
  const [loading, setLoading] = useState(false)
  const service = services.find(s => s.id === state.serviceId)
  const selectedAddons = addons.filter(a => state.addonIds.includes(a.id))
  const totalPrice = (service?.price ?? 0) + selectedAddons.reduce((s, a) => s + a.price, 0)

  async function handlePay() {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...state, addonIds: state.addonIds }),
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
      <GlassCard className="p-3 mb-4 space-y-2">
        {([
          ['خدمت', service?.nameFa ?? '—'],
          ['تاریخ', state.date ? new Date(state.date).toLocaleDateString('fa-IR') : '—'],
          ['ساعت', state.startTime ? state.startTime.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]) : '—'],
          ['مدت', service ? `${service.durationMinutes.toLocaleString('fa-IR')} دقیقه` : '—'],
          ['نام', state.customerName ?? '—'],
          ['موبایل', state.customerPhone ?? '—'],
        ] as [string, string][]).map(([label, value]) => (
          <div key={label} className="flex justify-between text-xs">
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
          </div>
        ))}

        {selectedAddons.length > 0 && (
          <>
            <div className="border-t border-[rgba(198,165,91,0.15)] pt-2 mt-1">
              <div className="flex justify-between text-xs mb-1.5">
                <span style={{ color: 'var(--text-muted)' }}>خدمت اصلی</span>
                <span style={{ color: 'var(--text-primary)' }}>{service?.price.toLocaleString('fa-IR')} ت</span>
              </div>
              {selectedAddons.map(a => (
                <div key={a.id} className="flex justify-between text-xs mb-1">
                  <span style={{ color: 'var(--text-muted)' }}>{a.nameFa}</span>
                  <span style={{ color: 'var(--text-primary)' }}>+{a.price.toLocaleString('fa-IR')} ت</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs font-semibold border-t border-[rgba(198,165,91,0.2)] pt-2">
              <span style={{ color: 'var(--text-primary)' }}>جمع کل</span>
              <span className="text-[#C6A55B]">{totalPrice.toLocaleString('fa-IR')} تومان</span>
            </div>
          </>
        )}

        {selectedAddons.length === 0 && (
          <div className="flex justify-between text-xs">
            <span style={{ color: 'var(--text-muted)' }}>مبلغ</span>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{service?.price.toLocaleString('fa-IR')} تومان</span>
          </div>
        )}
      </GlassCard>
      <div className="flex gap-3">
        <GhostButton onClick={goBack} className="flex-1">→ برگشت</GhostButton>
        <GoldButton onClick={handlePay} className="flex-1" disabled={loading}>
          {loading ? 'در حال انتقال...' : '← پرداخت با زرین‌پال'}
        </GoldButton>
      </div>
    </div>
  )
}
