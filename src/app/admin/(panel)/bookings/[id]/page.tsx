import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { GlassCard } from '@/components/ui/GlassCard'
import { BookingActions } from '@/components/admin/BookingActions'
import { BookingStatus } from '@prisma/client'

const statusLabel: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'در انتظار پرداخت',
  PAID: 'پرداخت شده',
  CONFIRMED: 'تأیید شده',
  CANCELLED: 'لغو شده',
}

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      service: true,
      addons: { include: { addon: true } },
    },
  })
  if (!booking) notFound()

  const faDate = new Date(booking.date.toISOString().split('T')[0] + 'T12:00:00').toLocaleDateString('fa-IR')
  const totalPrice = booking.service.price + booking.addonsPricePaid

  return (
    <div>
      <h1 className="text-xl font-light mb-6" style={{ color: 'var(--text-primary)' }}>جزئیات رزرو</h1>
      <GlassCard className="p-5 mb-6 space-y-3">
        {([
          ['نام', booking.customerName],
          ['موبایل', booking.customerPhone],
          ['خدمت', booking.service.nameFa],
          ['تاریخ', faDate],
          ['ساعت', `${booking.startTime} — ${booking.endTime}`],
          ['توضیحات', booking.customerNotes ?? '—'],
          ['کد پیگیری', booking.zarinpalRefId ?? '—'],
          ['وضعیت', statusLabel[booking.status]],
        ] as [string, string][]).map(([label, value]) => (
          <div key={label} className="flex justify-between">
            <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{label}</span>
            <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{value}</span>
          </div>
        ))}

        {booking.addons.length > 0 && (
          <div className="border-t border-[rgba(198,165,91,0.15)] pt-3 space-y-2">
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>افزودنی‌ها</p>
            {booking.addons.map(ba => (
              <div key={ba.id} className="flex justify-between">
                <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{ba.addon.nameFa}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{ba.pricePaid.toLocaleString('fa-IR')} ت</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-[rgba(198,165,91,0.15)] pt-2">
              <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>جمع کل</span>
              <span className="text-xs font-semibold text-[#C6A55B]">{totalPrice.toLocaleString('fa-IR')} ت</span>
            </div>
          </div>
        )}
      </GlassCard>
      <BookingActions bookingId={booking.id} currentStatus={booking.status} />
    </div>
  )
}
