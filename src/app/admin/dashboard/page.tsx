import { prisma } from '@/lib/prisma'
import { GlassCard } from '@/components/ui/GlassCard'
import { BookingStatus } from '@prisma/client'

export default async function DashboardPage() {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

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
      <h1 className="text-xl font-light text-[#F3EFE8] mb-6">داشبورد</h1>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {([['رزرو امروز', todayCount], ['رزرو آینده', upcomingCount], ['پرداخت موفق', totalPaid]] as [string, number][]).map(([label, val]) => (
          <GlassCard key={label} className="p-4 text-center">
            <div className="text-2xl font-bold text-[#C6A55B] mb-1">{val.toLocaleString('fa-IR')}</div>
            <div className="text-[10px] text-[#F3EFE8]/40">{label}</div>
          </GlassCard>
        ))}
      </div>
      <h2 className="text-sm text-[#F3EFE8]/60 mb-3">رزروهای پیش رو</h2>
      <div className="flex flex-col gap-2">
        {upcoming.map(b => (
          <GlassCard key={b.id} className="flex items-center gap-4 p-4">
            <div className="text-xs text-[#C6A55B] font-mono">
              {new Date(b.date.toISOString().split('T')[0] + 'T12:00:00').toLocaleDateString('fa-IR')} {b.startTime}
            </div>
            <div className="flex-1">
              <div className="text-xs text-[#F3EFE8] font-medium">{b.customerName}</div>
              <div className="text-[10px] text-[#F3EFE8]/40">{b.service.nameFa}</div>
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
