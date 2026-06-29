import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AmbientBackground } from '@/components/ui/AmbientBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { ConfirmCheckmark } from '@/components/booking/ConfirmCheckmark'
import { GoldButton } from '@/components/ui/GoldButton'
import { BookingStatus } from '@prisma/client'
import Link from 'next/link'

function toFaTime(t: string) {
  return t.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

export default async function ConfirmPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const booking = await prisma.booking.findUnique({
    where: { token },
    include: { service: true },
  })
  if (!booking || (booking.status !== BookingStatus.PAID && booking.status !== BookingStatus.CONFIRMED)) notFound()

  // Fetch all bookings in the group (or just this one if solo / legacy)
  // Filter to only PAID/CONFIRMED to exclude cancelled members from display
  const groupBookings = booking.groupToken
    ? await prisma.booking.findMany({
        where: {
          groupToken: booking.groupToken,
          status: { in: [BookingStatus.PAID, BookingStatus.CONFIRMED] },
        },
        include: { service: true },
        orderBy: { createdAt: 'asc' },
      })
    : [booking]

  const dateFa = new Date(booking.date.toISOString().split('T')[0] + 'T12:00:00').toLocaleDateString('fa-IR')
  const isGroup = groupBookings.length > 1

  return (
    <>
      <AmbientBackground />
      <div className="relative z-10 max-w-lg mx-auto min-h-screen flex flex-col items-center justify-center px-6">
        <ConfirmCheckmark />
        <h1 className="text-2xl font-light text-[#F3EFE8] mt-6 mb-2">رزرو تأیید شد</h1>
        <p className="text-xs text-[#F3EFE8]/40 mb-8 text-center font-light">رسید پرداخت از طریق SMS ارسال شد</p>

        {/* Shared date/time */}
        <GlassCard className="w-full p-4 mb-4 space-y-2">
          {([
            ['تاریخ', dateFa],
            ['ساعت', toFaTime(booking.startTime)],
            ['کد پیگیری', booking.zarinpalRefId ?? '—'],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span className="text-[#F3EFE8]/40 text-xs">{label}</span>
              <span className="text-[#F3EFE8] text-xs font-medium">{value}</span>
            </div>
          ))}
        </GlassCard>

        {/* Per-person room breakdown */}
        {isGroup ? (
          <div className="w-full flex flex-col gap-2 mb-8">
            {groupBookings.map((b, i) => (
              <GlassCard key={b.id} className="p-3 space-y-1.5">
                <p className="text-[10px] font-medium" style={{ color: 'rgba(243,239,232,0.4)' }}>
                  نفر {String(i + 1).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])}
                </p>
                {([
                  ['نام', b.customerName],
                  ['غرفه', b.service.nameFa],
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-[#F3EFE8]/40 text-xs">{label}</span>
                    <span className="text-[#F3EFE8] text-xs font-medium">{value}</span>
                  </div>
                ))}
              </GlassCard>
            ))}
          </div>
        ) : (
          <GlassCard className="w-full p-4 mb-8 space-y-2">
            {([
              ['خدمت', booking.service.nameFa],
              ['نام', booking.customerName],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-[#F3EFE8]/40 text-xs">{label}</span>
                <span className="text-[#F3EFE8] text-xs font-medium">{value}</span>
              </div>
            ))}
          </GlassCard>
        )}

        <Link href="/" className="w-full">
          <GoldButton className="w-full py-4">بازگشت به خانه</GoldButton>
        </Link>
        <Link href="/my/bookings" className="w-full mt-3 block text-center text-xs underline" style={{ color: 'var(--text-muted)' }}>
          مشاهده همه رزروهای شما ←
        </Link>
      </div>
    </>
  )
}
