import { BookingStatus, bookings } from '@/db/schema'
import { db } from '@/lib/db'
import { and, asc, count, desc, eq, gte, gt, lt, ne } from 'drizzle-orm'
import { GlassCard } from '@/components/ui/GlassCard'
import { BookingDetailDialog } from '../bookings/BookingDetailDialog'
import type { BookingRow } from '../bookings/columns'

export const dynamic = 'force-dynamic'

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

const genderLabel = { FEMALE: 'خانم', MALE: 'آقا' } as const
const genderStyle = {
  FEMALE: 'bg-[#BD6D87]/10 text-[#974B66] dark:text-[#E7A8BC]',
  MALE: 'bg-[#258273]/10 text-[#176457] dark:text-[#7CC8B7]',
} as const

export default async function DashboardPage() {
  const todayStr = new Date().toISOString().split('T')[0]
  const today = new Date(todayStr + 'T00:00:00.000Z')

  const [todayResult, upcomingResult, paidResult] = await Promise.all([
    db.select({ count: count() }).from(bookings).where(and(eq(bookings.date, today), ne(bookings.status, BookingStatus.CANCELLED))),
    db.select({ count: count() }).from(bookings).where(and(gt(bookings.date, today), ne(bookings.status, BookingStatus.CANCELLED))),
    db.select({ count: count() }).from(bookings).where(eq(bookings.status, BookingStatus.PAID)),
  ])
  const todayCount = todayResult[0].count
  const upcomingCount = upcomingResult[0].count
  const totalPaid = paidResult[0].count

  const upcoming = await db.query.bookings.findMany({
    where: and(gte(bookings.date, today), ne(bookings.status, BookingStatus.CANCELLED)),
    with: { service: true, addons: { with: { addon: true } }, customizations: true, discountCode: true },
    orderBy: [asc(bookings.date), asc(bookings.startTime)],
    limit: 10,
  })

  const past = await db.query.bookings.findMany({
    where: and(lt(bookings.date, today), ne(bookings.status, BookingStatus.CANCELLED)),
    with: { service: true, addons: { with: { addon: true } }, customizations: true, discountCode: true },
    orderBy: [desc(bookings.date), desc(bookings.startTime)],
    limit: 10,
  })

  // Group by date string
  const grouped = upcoming.reduce<Record<string, typeof upcoming>>((acc, b) => {
    const key = b.date.toISOString().split('T')[0]
    if (!acc[key]) acc[key] = []
    acc[key].push(b)
    return acc
  }, {})

  const groupedPast = past.reduce<Record<string, typeof past>>((acc, b) => {
    const key = b.date.toISOString().split('T')[0]
    if (!acc[key]) acc[key] = []
    acc[key].push(b)
    return acc
  }, {})

  const toBookingRow = (b: typeof upcoming[number]): BookingRow => ({
    id: b.id,
    bookingCode: b.bookingCode,
    bookedAt: b.createdAt.getTime(),
    date: new Date(b.date.toISOString().split('T')[0] + 'T12:00:00').toLocaleDateString('fa-IR'),
    startTime: b.startTime,
    endTime: b.endTime,
    customerName: b.customerName,
    customerPhone: b.customerPhone,
    serviceNameFa: b.service.nameFa,
    servicePrice: b.service.price,
    addonsPricePaid: b.addonsPricePaid,
    addons: b.addons.map(item => ({ nameFa: item.addon.nameFa, pricePaid: item.pricePaid })),
    customizations: b.customizations.map(item => ({ labelSnapshot: item.labelSnapshot, pricePaid: item.pricePaid })),
    status: b.status,
    notes: b.customerNotes,
    refId: b.zarinpalRefId,
    gender: b.gender,
    discountAmount: b.discountAmount,
    discountCode: b.discountCode ? { code: b.discountCode.code } : null,
    customization: b.customization,
    healthIntake: b.healthIntake,
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

      <h2 className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>رزروهای پیش رو</h2>

      {Object.keys(grouped).length === 0 && (
        <p className="text-xs mb-6" style={{ color: 'var(--text-faint)' }}>رزروی ثبت نشده است.</p>
      )}

      <div className="flex flex-col gap-6 mb-10">
        {Object.entries(grouped).map(([dateKey, bookings]) => (
          <div key={dateKey}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-medium text-[#C6A55B]">
                {toFaDate(new Date(dateKey + 'T12:00:00'))}
              </span>
              <div className="flex-1 h-px" style={{ background: 'var(--border-base)' }} />
            </div>
            <div className="flex flex-col gap-1.5">
              {bookings.map(b => (
                <BookingDetailDialog
                  key={b.id}
                  booking={toBookingRow(b)}
                  triggerClassName="w-full flex items-center gap-4 px-4 py-2.5 rounded-lg text-right transition-colors hover:bg-white/5 cursor-pointer"
                  triggerContent={
                    <>
                    <span className="text-xs tabular-nums w-12 flex-shrink-0 text-[#C6A55B]">
                      {b.startTime}
                    </span>
                    <span className="text-xs font-medium flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
                      {b.customerName}
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] ${genderStyle[b.gender]}`}>
                      {genderLabel[b.gender]}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                      · {b.service.nameFa}
                    </span>
                    <span className={`mr-auto text-[10px] px-2 py-0.5 rounded-full ${statusStyle[b.status]}`}>
                      {statusLabel[b.status]}
                    </span>
                    </>
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>رزروهای گذشته</h2>

      {Object.keys(groupedPast).length === 0 && (
        <p className="text-xs" style={{ color: 'var(--text-faint)' }}>رزروی در گذشته یافت نشد.</p>
      )}

      <div className="flex flex-col gap-6">
        {Object.entries(groupedPast).map(([dateKey, bookings]) => (
          <div key={dateKey}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-medium" style={{ color: 'var(--text-faint)' }}>
                {toFaDate(new Date(dateKey + 'T12:00:00'))}
              </span>
              <div className="flex-1 h-px" style={{ background: 'var(--border-base)' }} />
            </div>
            <div className="flex flex-col gap-1.5">
              {bookings.map(b => (
                <BookingDetailDialog
                  key={b.id}
                  booking={toBookingRow(b)}
                  triggerClassName="w-full flex items-center gap-4 px-4 py-2.5 rounded-lg text-right transition-colors hover:bg-white/5 cursor-pointer opacity-60"
                  triggerContent={
                    <>
                    <span className="text-xs tabular-nums w-12 flex-shrink-0" style={{ color: 'var(--text-faint)' }}>
                      {b.startTime}
                    </span>
                    <span className="text-xs font-medium flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
                      {b.customerName}
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] ${genderStyle[b.gender]}`}>
                      {genderLabel[b.gender]}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                      · {b.service.nameFa}
                    </span>
                    <span className={`mr-auto text-[10px] px-2 py-0.5 rounded-full ${statusStyle[b.status]}`}>
                      {statusLabel[b.status]}
                    </span>
                    </>
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
