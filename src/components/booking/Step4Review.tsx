'use client'
import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import { GhostButton } from '@/components/ui/GhostButton'
import type { WizardState } from './BookingWizard'
import type { ServiceDTO } from '@/types'

type Props = { state: WizardState; goBack: () => void; services: ServiceDTO[] }

export function Step4Review({ state, goBack, services }: Props) {
  const [loading, setLoading] = useState(false)
  const service = services.find(s => s.id === state.serviceId)

  async function handlePay() {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
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
      <h2 className="text-xl font-light text-[#F3EFE8] mb-1">مرور و پرداخت</h2>
      <p className="text-xs text-[#F3EFE8]/40 mb-6 font-light">اطلاعات رزرو را بررسی کنید</p>
      <GlassCard className="p-5 mb-6 space-y-3">
        {([
          ['خدمت', service?.nameFa ?? '—'],
          ['تاریخ', state.date ? new Date(state.date).toLocaleDateString('fa-IR') : '—'],
          ['ساعت', state.startTime ?? '—'],
          ['مدت', service ? `${service.durationMinutes} دقیقه` : '—'],
          ['نام', state.customerName ?? '—'],
          ['موبایل', state.customerPhone ?? '—'],
          ['مبلغ', service ? `${service.price.toLocaleString('fa-IR')} تومان` : '—'],
        ] as [string, string][]).map(([label, value]) => (
          <div key={label} className="flex justify-between text-xs">
            <span className="text-[#F3EFE8]/40">{label}</span>
            <span className="text-[#F3EFE8] font-medium">{value}</span>
          </div>
        ))}
      </GlassCard>
      <div className="flex gap-3">
        <GhostButton onClick={goBack} className="flex-1">→ برگشت</GhostButton>
        <GoldButton onClick={handlePay} className="flex-1 py-4" disabled={loading}>
          {loading ? 'در حال انتقال...' : '← پرداخت با زرین‌پال'}
        </GoldButton>
      </div>
    </div>
  )
}
