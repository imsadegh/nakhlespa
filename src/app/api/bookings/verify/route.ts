import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { zarinpalVerify } from '@/lib/zarinpal'
import { sendSms } from '@/lib/smsir'
import { BookingStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  const authority = req.nextUrl.searchParams.get('Authority')
  const status = req.nextUrl.searchParams.get('Status')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

  if (status !== 'OK' || !authority) {
    return NextResponse.redirect(`${siteUrl}/booking/failed`)
  }

  const booking = await prisma.booking.findFirst({
    where: { zarinpalAuthority: authority },
    include: { service: true },
  })
  if (!booking) return NextResponse.redirect(`${siteUrl}/booking/failed`)

  try {
    const { refId } = await zarinpalVerify(authority, booking.service.price)

    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.PAID, zarinpalRefId: refId },
    })

    // Compute appointment datetime in UTC for reminder scheduling
    const [h, m] = booking.startTime.split(':').map(Number)
    const appointmentMs = booking.date.getTime() + (h * 60 + m) * 60 * 1000
    await prisma.smsReminder.createMany({
      data: [
        { bookingId: booking.id, sendAt: new Date(appointmentMs - 24 * 60 * 60 * 1000) },
        { bookingId: booking.id, sendAt: new Date(appointmentMs - 2 * 60 * 60 * 1000) },
      ],
    })

    await sendSms(
      booking.customerPhone,
      `${booking.customerName} عزیز، رزرو شما برای ${booking.service.nameFa} در تاریخ ${booking.date.toLocaleDateString('fa-IR')} ساعت ${booking.startTime} تأیید شد. کد پیگیری: ${refId} — نخلسپا`
    )
    await sendSms(
      process.env.ADMIN_PHONE!,
      `رزرو جدید: ${booking.customerName} — ${booking.service.nameFa} — ${booking.date.toLocaleDateString('fa-IR')} ${booking.startTime} — تلفن: ${booking.customerPhone}`
    )

    return NextResponse.redirect(`${siteUrl}/booking/confirm/${booking.token}`)
  } catch {
    return NextResponse.redirect(`${siteUrl}/booking/failed`)
  }
}
