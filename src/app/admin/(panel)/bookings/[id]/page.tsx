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
  const booking = await prisma.booking.findUnique({ where: { id }, include: { service: true } })
  if (!booking) notFound()

  const faDate = new Date(booking.date.toISOString().split('T')[0] + 'T12:00:00').toLocaleDateString('fa-IR')

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
      </GlassCard>
      <BookingActions bookingId={booking.id} currentStatus={booking.status} />
    </div>
  )
}
