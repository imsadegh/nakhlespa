import Link from 'next/link'
import { GlassCard } from '@/components/ui/GlassCard'
import { BookingStatus } from '@prisma/client'

type FullBooking = {
  token: string
  date: Date
  startTime: string
  status: BookingStatus
  service: { nameFa: string; price: number }
  discountAmount: number
  addonsPricePaid: number
  discountCode: { code: string } | null
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  PAID: 'پرداخت شده',
  CONFIRMED: 'تأیید شده',
  CANCELLED: 'لغو شده',
  PENDING_PAYMENT: 'در انتظار پرداخت',
}

const STATUS_COLOR: Record<BookingStatus, string> = {
  PAID: 'text-emerald-400',
  CONFIRMED: 'text-emerald-400',
  CANCELLED: 'text-red-400',
  PENDING_PAYMENT: 'text-yellow-400',
}

export function BookingHistoryList({
  bookings,
  completedCount,
}: {
  bookings: FullBooking[]
  completedCount: number
}) {
  const remaining = completedCount % 5 === 4 ? 0 : 5 - (completedCount % 5)

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      {/* Loyalty indicator */}
      <GlassCard className="p-4">
        {completedCount % 5 === 4 ? (
          <p className="text-xs text-center text-emerald-400">رزرو بعدی شما ۲۰٪ تخفیف دارد!</p>
        ) : (
          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            {completedCount.toLocaleString('fa-IR')} رزرو تأیید شده — تا تخفیف بعدی{' '}
            {remaining.toLocaleString('fa-IR')} رزرو مانده
          </p>
        )}
      </GlassCard>

      {bookings.length === 0 && (
        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          هنوز رزروی ثبت نشده است
        </p>
      )}

      {bookings.map(b => {
        const totalPaid = b.service.price + b.addonsPricePaid - b.discountAmount
        const dateFa = new Date(
          b.date.toISOString().split('T')[0] + 'T12:00:00'
        ).toLocaleDateString('fa-IR')
        return (
          <Link key={b.token} href={`/my/bookings/${b.token}`}>
            <GlassCard className="p-4 space-y-2 hover:border-[rgba(198,165,91,0.3)] transition-colors">
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--text-muted)' }}>
                  {dateFa} — {b.startTime}
                </span>
                <span className={`text-[10px] ${STATUS_COLOR[b.status]}`}>
                  {STATUS_LABEL[b.status]}
                </span>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {b.service.nameFa}
              </p>
              {b.discountAmount > 0 && (
                <p className="text-xs text-emerald-400">
                  تخفیف: −{b.discountAmount.toLocaleString('fa-IR')} ت
                </p>
              )}
              <p className="text-xs font-semibold text-[#C6A55B]">
                {totalPaid.toLocaleString('fa-IR')} تومان
              </p>
            </GlassCard>
          </Link>
        )
      })}
    </div>
  )
}
