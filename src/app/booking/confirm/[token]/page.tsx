import { notFound } from 'next/navigation'
import { BookingStatus, bookings } from '@/db/schema'
import { db } from '@/lib/db'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { AmbientBackground } from '@/components/ui/AmbientBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { ConfirmCheckmark } from '@/components/booking/ConfirmCheckmark'
import { GoldButton } from '@/components/ui/GoldButton'
import Link from 'next/link'
import { CUSTOMER_BOOKING_PROJECTION } from '@/lib/customer-booking'

const CONFIRMATION_BOOKING_PROJECTION = {
  ...CUSTOMER_BOOKING_PROJECTION,
  columns: { ...CUSTOMER_BOOKING_PROJECTION.columns, customerPhone: true, gender: true },
  with: {
    ...CUSTOMER_BOOKING_PROJECTION.with,
    customizations: { columns: { id: true, pricePaid: true } },
  },
} as const

function toFaTime(t: string) {
  return t.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

function honorificName(gender: 'FEMALE' | 'MALE', name: string) {
  return `${gender === 'FEMALE' ? 'خانم' : 'آقای'} ${name}`
}

export default async function ConfirmPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const booking = await db.query.bookings.findFirst({
    ...CONFIRMATION_BOOKING_PROJECTION,
    where: eq(bookings.token, token),
  })
  if (!booking || (booking.status !== BookingStatus.PAID && booking.status !== BookingStatus.CONFIRMED)) notFound()

  // Fetch all bookings in the group (or just this one if solo / legacy)
  // Filter to only PAID/CONFIRMED to exclude cancelled members from display
  const groupBookings = booking.groupToken
      ? await db.query.bookings.findMany({
        ...CONFIRMATION_BOOKING_PROJECTION,
        where: and(eq(bookings.groupToken, booking.groupToken), inArray(bookings.status, [BookingStatus.PAID, BookingStatus.CONFIRMED])),
        orderBy: asc(bookings.createdAt),
      })
    : [booking]

  const dateFa = new Date(booking.date.toISOString().split('T')[0] + 'T12:00:00').toLocaleDateString('fa-IR')
  const isGroup = groupBookings.length > 1
  const totalPaid = Math.max(0, groupBookings.reduce(
    (total, b) => total + b.service.price + b.addonsPricePaid + b.customizations.reduce((sum, item) => sum + item.pricePaid, 0),
    0,
  ) - booking.discountAmount)

  return (
    <>
      <AmbientBackground />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-4 py-8 sm:px-6">
        <header className="mb-6 flex flex-col items-center text-center">
          <ConfirmCheckmark gender={booking.gender} />
          <span className="mt-4 rounded-full border border-[#258273]/25 bg-[#258273]/10 px-3 py-1 text-[10px] font-medium text-[#176457] dark:text-[#7CC8B7]">
            پرداخت با موفقیت ثبت شد
          </span>
          <h1 className="mt-2 text-2xl font-semibold text-site-primary">رزرو تأیید شد</h1>
          <p className="mt-1 text-xs leading-relaxed text-site-muted">رسید پرداخت از طریق SMS ارسال شد</p>
        </header>

        <GlassCard className="mb-4 w-full overflow-hidden p-0">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--border-base)] px-5 py-4">
            <div>
              <p className="text-xs text-site-muted">مبلغ پرداخت‌شده</p>
              <p className="mt-1 text-2xl font-semibold text-[#A8873A]">
                {totalPaid.toLocaleString('fa-IR')} <span className="text-sm font-medium">تومان</span>
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[#258273]/10 px-3 py-1.5 text-[10px] font-medium text-[#176457] dark:text-[#7CC8B7]">
              پرداخت موفق
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4 sm:gap-4 sm:p-5">
            {([
              ['تاریخ', dateFa],
              ['ساعت', toFaTime(booking.startTime)],
              ['شماره تماس', booking.customerPhone],
              ['کد رزرو', booking.bookingCode],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label} className="min-w-0 rounded-xl bg-[var(--bg-surface)] px-3 py-2.5">
                <p className="text-[10px] text-site-muted">{label}</p>
                <p className="mt-1 break-all text-xs font-medium text-site-primary">{value}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <section className="mb-6 w-full space-y-3" aria-label="جزئیات مراجعه">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-site-primary">جزئیات مراجعه</h2>
            {isGroup && <span className="text-[10px] text-site-muted">{groupBookings.length.toLocaleString('fa-IR')} نفر</span>}
          </div>
          {groupBookings.map((b, i) => (
            <GlassCard key={b.id} className={`w-full p-4 ${b.gender === 'FEMALE' ? 'border border-[#BD6D87]/30 bg-[#BD6D87]/[0.04]' : 'border border-[#258273]/30 bg-[#258273]/[0.04]'}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-site-muted">{isGroup ? `نفر ${String(i + 1).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])}` : 'خدمت'}</span>
                <span className="text-sm font-medium text-site-primary">{b.service.nameFa}</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--border-base)] pt-3">
                <span className="text-xs text-site-muted">مراجع</span>
                <span dir="rtl" className="flex min-w-0 items-center gap-2 text-sm font-medium text-site-primary">
                  <span className={`shrink-0 rounded-md px-2 py-1 text-[10px] ${b.gender === 'FEMALE' ? 'bg-[#BD6D87]/10 text-[#974B66] dark:text-[#E7A8BC]' : 'bg-[#258273]/10 text-[#176457] dark:text-[#7CC8B7]'}`}>
                    {b.gender === 'FEMALE' ? 'خانم' : 'آقای'}
                  </span>
                  <bdi dir="auto" className="truncate">{b.customerName}</bdi>
                </span>
              </div>
            </GlassCard>
          ))}
        </section>

        <Link href="/" className="w-full">
          <GoldButton className="w-full py-4">بازگشت به خانه</GoldButton>
        </Link>
        <Link href="/my/bookings" className="mt-3 block w-full text-center text-xs text-site-muted underline">
          مشاهده همه رزروهای شما ←
        </Link>
      </div>
    </>
  )
}
