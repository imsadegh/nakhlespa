import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AmbientBackground } from '@/components/ui/AmbientBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { ConfirmCheckmark } from '@/components/booking/ConfirmCheckmark'
import { GoldButton } from '@/components/ui/GoldButton'
import { BookingStatus } from '@prisma/client'
import Link from 'next/link'

export default async function ConfirmPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const booking = await prisma.booking.findUnique({
    where: { token },
    include: { service: true },
  })
  if (!booking || (booking.status !== BookingStatus.PAID && booking.status !== BookingStatus.CONFIRMED)) notFound()

  return (
    <>
      <AmbientBackground />
      <div className="relative z-10 max-w-lg mx-auto min-h-screen flex flex-col items-center justify-center px-6">
        <ConfirmCheckmark />
        <h1 className="text-2xl font-light text-[#F3EFE8] mt-6 mb-2">رزرو تأیید شد</h1>
        <p className="text-xs text-[#F3EFE8]/40 mb-8 text-center font-light">رسید پرداخت از طریق SMS ارسال شد</p>
        <GlassCard className="w-full p-5 mb-8 space-y-3">
          {([
            ['خدمت', booking.service.nameFa],
            ['تاریخ', new Date(booking.date.toISOString().split('T')[0] + 'T12:00:00').toLocaleDateString('fa-IR')],
            ['ساعت', booking.startTime],
            ['نام', booking.customerName],
            ['کد پیگیری', booking.zarinpalRefId ?? '—'],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span className="text-[#F3EFE8]/40 text-xs">{label}</span>
              <span className="text-[#F3EFE8] text-xs font-medium">{value}</span>
            </div>
          ))}
        </GlassCard>
        <Link href="/" className="w-full">
          <GoldButton className="w-full py-4">بازگشت به خانه</GoldButton>
        </Link>
      </div>
    </>
  )
}
