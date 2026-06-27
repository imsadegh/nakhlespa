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

const statusStyle: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'bg-yellow-400/10 text-yellow-400',
  PAID: 'bg-[rgba(198,165,91,0.15)] text-[#C6A55B]',
  CONFIRMED: 'bg-[rgba(31,94,70,0.3)] text-[#4F6F52]',
  CANCELLED: 'bg-red-400/10 text-red-400',
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-faint)' }}>{label}</span>
      <span className="text-xs text-end" style={{ color: 'var(--text-primary)' }}>{children}</span>
    </div>
  )
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
  const faTime = (t: string) => t.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])
  const totalPrice = booking.service.price + booking.addonsPricePaid

  // Fetch sibling bookings in the same group
  const groupBookings = booking.groupToken
    ? await prisma.booking.findMany({
        where: { groupToken: booking.groupToken, id: { not: booking.id } },
        include: { service: true },
        orderBy: { createdAt: 'asc' },
      })
    : []

  return (
    <div>
      <h1 className="text-xl font-light mb-6" style={{ color: 'var(--text-primary)' }}>جزئیات رزرو</h1>

      {/* Customer & session info */}
      <GlassCard className="p-5 mb-4 space-y-3">
        <p className="text-[10px] tracking-widest mb-1" style={{ color: 'var(--text-faint)' }}>— اطلاعات مشتری</p>

        <Row label="نام">{booking.customerName}</Row>
        <Row label="موبایل">{booking.customerPhone}</Row>
        <Row label="جنسیت">
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${booking.gender === 'FEMALE' ? 'bg-pink-400/10 text-pink-400' : 'bg-blue-400/10 text-blue-400'}`}>
            {booking.gender === 'FEMALE' ? 'خانم' : 'آقا'}
          </span>
        </Row>
        {booking.customerNotes && <Row label="توضیحات">{booking.customerNotes}</Row>}
      </GlassCard>

      {/* Booking time & service */}
      <GlassCard className="p-5 mb-4 space-y-3">
        <p className="text-[10px] tracking-widest mb-1" style={{ color: 'var(--text-faint)' }}>— زمان و خدمت</p>

        <Row label="تاریخ">{faDate}</Row>
        <Row label="ساعت">{faTime(booking.startTime)} — {faTime(booking.endTime)}</Row>
        <Row label="خدمت">{booking.service.nameFa}</Row>
      </GlassCard>

      {/* Price breakdown */}
      <GlassCard className="p-5 mb-4 space-y-3">
        <p className="text-[10px] tracking-widest mb-1" style={{ color: 'var(--text-faint)' }}>— مبلغ</p>

        <Row label="خدمت اصلی">{booking.service.price.toLocaleString('fa-IR')} ت</Row>
        {booking.addons.map(ba => (
          <Row key={ba.id} label={ba.addon.nameFa}>+{ba.pricePaid.toLocaleString('fa-IR')} ت</Row>
        ))}
        <div className="flex justify-between items-center border-t pt-2" style={{ borderColor: 'rgba(198,165,91,0.15)' }}>
          <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>جمع کل</span>
          <span className="text-xs font-semibold" style={{ color: '#C6A55B' }}>{totalPrice.toLocaleString('fa-IR')} تومان</span>
        </div>
      </GlassCard>

      {/* Group bookings */}
      {groupBookings.length > 0 && (
        <GlassCard className="p-5 mb-4 space-y-3">
          <p className="text-[10px] tracking-widest mb-1" style={{ color: 'var(--text-faint)' }}>— رزروهای گروهی</p>
          {groupBookings.map(gb => (
            <div key={gb.id} className="flex justify-between items-center">
              <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{gb.customerName}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{gb.service.nameFa}</span>
            </div>
          ))}
        </GlassCard>
      )}

      {/* Status & payment */}
      <GlassCard className="p-5 mb-6 space-y-3">
        <p className="text-[10px] tracking-widest mb-1" style={{ color: 'var(--text-faint)' }}>— وضعیت و پرداخت</p>

        <Row label="وضعیت">
          <span className={`text-[10px] px-2.5 py-1 rounded-full ${statusStyle[booking.status]}`}>
            {statusLabel[booking.status]}
          </span>
        </Row>
        {booking.zarinpalRefId && <Row label="کد پیگیری">{booking.zarinpalRefId}</Row>}
        {booking.zarinpalAuthority && <Row label="شناسه تراکنش">{booking.zarinpalAuthority}</Row>}
        <Row label="تاریخ ثبت">
          {new Date(booking.createdAt.toISOString().split('T')[0] + 'T12:00:00').toLocaleDateString('fa-IR')}
        </Row>
      </GlassCard>

      <BookingActions bookingId={booking.id} currentStatus={booking.status} />
    </div>
  )
}
