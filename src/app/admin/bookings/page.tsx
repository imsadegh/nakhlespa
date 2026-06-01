import { prisma } from '@/lib/prisma'
import { GlassCard } from '@/components/ui/GlassCard'
import { BookingStatus } from '@prisma/client'
import Link from 'next/link'

const statusLabel: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'در انتظار پرداخت',
  PAID: 'پرداخت شده',
  CONFIRMED: 'تأیید شده',
  CANCELLED: 'لغو شده',
}
const statusColor: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'text-yellow-400',
  PAID: 'text-[#C6A55B]',
  CONFIRMED: 'text-[#4F6F52]',
  CANCELLED: 'text-red-400',
}

export default async function BookingsPage() {
  const bookings = await prisma.booking.findMany({
    include: { service: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <h1 className="text-xl font-light text-[#F3EFE8] mb-6">رزروها</h1>
      <div className="flex flex-col gap-2">
        {bookings.map(b => (
          <Link key={b.id} href={`/admin/bookings/${b.id}`}>
            <GlassCard className="flex items-center gap-4 p-4 cursor-pointer hover:glass-gold transition-all">
              <div className="text-xs text-[#C6A55B] font-mono w-28 flex-shrink-0">
                {new Date(b.date.toISOString().split('T')[0] + 'T12:00:00').toLocaleDateString('fa-IR')} {b.startTime}
              </div>
              <div className="flex-1">
                <div className="text-xs text-[#F3EFE8] font-medium">{b.customerName}</div>
                <div className="text-[10px] text-[#F3EFE8]/40">{b.service.nameFa} — {b.customerPhone}</div>
              </div>
              <span className={`text-[9px] ${statusColor[b.status]}`}>{statusLabel[b.status]}</span>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  )
}
