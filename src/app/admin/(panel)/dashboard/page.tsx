import { prisma } from '@/lib/prisma'
import { GlassCard } from '@/components/ui/GlassCard'
import { BookingStatus } from '@prisma/client'

function toFaDate(date: Date) {
  return new Date(date.toISOString().split('T')[0] + 'T12:00:00').toLocaleDateString('fa-IR')
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
      <h2 className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>رزروهای پیش رو</h2>
      <div className="flex flex-col gap-2">
        {upcoming.map(b => (
          <GlassCard key={b.id} className="flex items-center gap-4 p-4">
            <div className="text-xs text-[#C6A55B] tabular-nums">
              {toFaDate(b.date)} {b.startTime}
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{b.customerName}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{b.service.nameFa}</div>
            </div>
            <span className={`text-[9px] px-2 py-0.5 rounded-full ${b.status === BookingStatus.CONFIRMED ? 'bg-[rgba(31,94,70,0.3)] text-[#4F6F52]' : 'bg-[rgba(198,165,91,0.15)] text-[#C6A55B]'}`}>
              {b.status === BookingStatus.CONFIRMED ? 'تأیید شده' : 'پرداخت شده'}
            </span>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
