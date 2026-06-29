import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BookingStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCustomerSessionFromCookies } from '@/lib/customer-auth'
import { AmbientBackground } from '@/components/ui/AmbientBackground'
import { GlassCard } from '@/components/ui/GlassCard'

const STATUS_LABEL: Record<BookingStatus, string> = {
  PAID: 'پرداخت شده',
  CONFIRMED: 'تأیید شده',
  CANCELLED: 'لغو شده',
  PENDING_PAYMENT: 'در انتظار پرداخت',
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const session = await getCustomerSessionFromCookies()
  if (!session) notFound()

  const booking = await prisma.booking.findUnique({
    where: { token },
    include: {
      service: true,
      addons: { include: { addon: true } },
      discountCode: true,
    },
  })

  if (!booking || booking.customerPhone !== session.phone) notFound()

  const dateFa = new Date(
    booking.date.toISOString().split('T')[0] + 'T12:00:00'
  ).toLocaleDateString('fa-IR')
  const totalPaid = booking.service.price + booking.addonsPricePaid - booking.discountAmount

  return (
    <>
      <AmbientBackground />
      <div className="relative z-10 min-h-screen px-6 py-10 max-w-lg mx-auto">
        <Link
          href="/my/bookings"
          className="text-xs underline mb-6 block"
          style={{ color: 'var(--text-muted)' }}
        >
          → بازگشت به لیست رزروها
        </Link>
        <GlassCard className="p-5 space-y-3">
          <h1 className="text-base font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            جزئیات رزرو
          </h1>

          {(
            [
              ['خدمت', booking.service.nameFa],
              ['تاریخ', dateFa],
              ['ساعت', booking.startTime],
              ['وضعیت', STATUS_LABEL[booking.status]],
            ] as [string, string][]
          ).map(([label, value]) => (
            <div key={label} className="flex justify-between text-xs">
              <span style={{ color: 'var(--text-muted)' }}>{label}</span>
              <span style={{ color: 'var(--text-primary)' }}>{value}</span>
            </div>
          ))}

          {booking.addons.length > 0 && (
            <div className="border-t border-white/10 pt-2">
              <p className="text-[10px] mb-1" style={{ color: 'var(--text-faint)' }}>
                افزودنی‌ها
              </p>
              {booking.addons.map(ba => (
                <div key={ba.id} className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>{ba.addon.nameFa}</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {ba.pricePaid.toLocaleString('fa-IR')} ت
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-white/10 pt-2 space-y-1">
            {booking.discountAmount > 0 && (
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--text-muted)' }}>
                  تخفیف{' '}
                  {booking.discountCode?.code === 'LOYALTY_AUTO'
                    ? '(وفاداری)'
                    : `(${booking.discountCode?.code})`}
                </span>
                <span className="text-emerald-400">
                  −{booking.discountAmount.toLocaleString('fa-IR')} ت
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold">
              <span style={{ color: 'var(--text-primary)' }}>مبلغ پرداختی</span>
              <span className="text-[#C6A55B]">{totalPaid.toLocaleString('fa-IR')} تومان</span>
            </div>
          </div>

          {booking.zarinpalRefId && (
            <div className="flex justify-between text-xs border-t border-white/10 pt-2">
              <span style={{ color: 'var(--text-muted)' }}>کد پیگیری</span>
              <span style={{ color: 'var(--text-primary)' }}>{booking.zarinpalRefId}</span>
            </div>
          )}
        </GlassCard>
      </div>
    </>
  )
}
