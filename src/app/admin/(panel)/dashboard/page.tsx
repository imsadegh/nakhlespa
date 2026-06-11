import { prisma } from '@/lib/prisma'
import { GlassCard } from '@/components/ui/GlassCard'
import { BookingStatus } from '@prisma/client'
import Link from 'next/link'

function toFaDate(date: Date) {
  return new Date(date.toISOString().split('T')[0] + 'T12:00:00').toLocaleDateString('fa-IR', {
    day: 'numeric',
    month: 'long',
  })
}

const statusLabel: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'در انتظار پرداخت',
  PAID: 'پرداخت شده',
  CONFIRMED: 'تأیید شده',
  CANCELLED: 'لغو شده',
}

const statusStyle: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'bg-yellow-400/10 text-yellow-400',
  PAID: 'bg-[rgba(198,165,91,0.15)] text-[#C6A55B]',
  CONFIRMED: 'bg-[rgba(31,94,70,0.3)] text-[#4F6F52]',
  CANCELLED: 'bg-red-400/10 text-red-400',
}

export default async function DashboardPage() {
  const todayStr = new Date().toISOString().split('T')[0]
  const today = new Date(todayStr + 'T00:00:00.000Z')

  const [todayCount, upcomingCount, totalPaid] = await Promise.all([
    prisma.booking.count({ where: { date: today, status: { not: BookingStatus.CANCELLED } } }),
    prisma.booking.count({ where: { date: { gt: today }, status: { not: BookingStatus.CANCELLED } } }),
    prisma.booking.count({ where: { status: BookingStatus.PAID } }),
  ])

  const upcoming = await prisma.booking.findMany({
    where: { date: { gte: today }, status: { not: BookingStatus.CANCELLED } },
    include: { service: true },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    take: 10,
  })

  // Group by date string
  const grouped = upcoming.reduce<Record<string, typeof upcoming>>((acc, b) => {
    const key = b.date.toISOString().split('T')[0]
    if (!acc[key]) acc[key] = []
    acc[key].push(b)
    return acc
  }, {})

  return (
    <div>
      <h1 className="text-xl font-light mb-6" style={{ color: 'var(--text-primary)' }}>داشبورد</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {([['رزرو امروز', todayCount], ['رزرو آینده', upcomingCount], ['پرداخت موفق', totalPaid]] as [string, number][]).map(([label, val]) => (
          <GlassCard key={label} className="p-4 text-center">
            <div className="text-2xl font-bold text-[#C6A55B] mb-1">{val.toLocaleString('fa-IR')}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>{label}</div>
          </GlassCard>
        ))}
      </div>

      <h2 className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>رزروهای پیش رو</h2>

      {Object.keys(grouped).length === 0 && (
        <p className="text-xs" style={{ color: 'var(--text-faint)' }}>رزروی ثبت نشده است.</p>
      )}

      <div className="flex flex-col gap-6">
        {Object.entries(grouped).map(([dateKey, bookings]) => (
          <div key={dateKey}>
            {/* Date header */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-medium text-[#C6A55B]">
                {toFaDate(new Date(dateKey + 'T12:00:00'))}
              </span>
              <div className="flex-1 h-px" style={{ background: 'var(--border-base)' }} />
            </div>

            {/* Rows for this date */}
            <div className="flex flex-col gap-1.5">
              {bookings.map(b => (
                <Link key={b.id} href={`/admin/bookings/${b.id}`}>
                  <div className="flex items-center gap-4 px-4 py-2.5 rounded-lg transition-colors hover:bg-white/5 cursor-pointer">
                    <span className="text-xs tabular-nums w-12 flex-shrink-0 text-[#C6A55B]">
                      {b.startTime}
                    </span>
                    <span className="text-xs font-medium flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
                      {b.customerName}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                      · {b.service.nameFa}
                    </span>
                    <span className={`mr-auto text-[10px] px-2 py-0.5 rounded-full ${statusStyle[b.status]}`}>
                      {statusLabel[b.status]}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
