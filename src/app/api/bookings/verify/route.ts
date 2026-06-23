import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { zarinpalVerify } from '@/lib/zarinpal'
import { smsQueue } from '@/lib/queue'
import { sendConfirmSms, sendAdminSms } from '@/lib/smsir'
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

  if (booking.status === BookingStatus.PAID) {
    return NextResponse.redirect(`${siteUrl}/booking/confirm/${booking.token}`)
  }

  if (booking.status !== BookingStatus.PENDING_PAYMENT) {
    return NextResponse.redirect(`${siteUrl}/booking/failed`)
  }

  // Atomic status transition: only one concurrent callback wins the update.
  // If another request already moved the booking out of PENDING_PAYMENT,
  // this update matches 0 rows and we bail out before calling Zarinpal.
  const updated = await prisma.booking.updateMany({
    where: { id: booking.id, status: BookingStatus.PENDING_PAYMENT },
    data: { status: BookingStatus.PAID },
  })
  if (updated.count === 0) {
    return NextResponse.redirect(`${siteUrl}/booking/confirm/${booking.token}`)
  }

  try {
    const { refId } = await zarinpalVerify(authority, booking.service.price + booking.addonsPricePaid)

    await prisma.booking.update({
      where: { id: booking.id },
      data: { zarinpalRefId: refId },
    })

    // Compute appointment datetime in UTC for reminder scheduling
    const [h, m] = booking.startTime.split(':').map(Number)
    const appointmentMs = booking.date.getTime() + (h * 60 + m) * 60 * 1000
    const delay24h = Math.max(0, appointmentMs - 24 * 60 * 60 * 1000 - Date.now())
    const delay2h = Math.max(0, appointmentMs - 2 * 60 * 60 * 1000 - Date.now())

    const [reminder24, reminder2] = await prisma.$transaction([
      prisma.smsReminder.create({ data: { bookingId: booking.id, sendAt: new Date(appointmentMs - 24 * 60 * 60 * 1000) } }),
      prisma.smsReminder.create({ data: { bookingId: booking.id, sendAt: new Date(appointmentMs - 2 * 60 * 60 * 1000) } }),
    ])

    const dateFa = booking.date.toLocaleDateString('fa-IR')
    const reminderParams = { name: booking.customerName, service: booking.service.nameFa, time: booking.startTime }

    await Promise.all([
      smsQueue.add('reminder-24h', { reminderId: reminder24.id, phone: booking.customerPhone, template: 'reminder24h', params: reminderParams }, { delay: delay24h }),
      smsQueue.add('reminder-2h',  { reminderId: reminder2.id,  phone: booking.customerPhone, template: 'reminder2h',  params: reminderParams }, { delay: delay2h }),
      sendConfirmSms(booking.customerPhone, { name: booking.customerName, service: booking.service.nameFa, date: dateFa, time: booking.startTime, refId: String(refId) }),
      sendAdminSms(process.env.ADMIN_PHONE!, { name: booking.customerName, service: booking.service.nameFa, date: dateFa, time: booking.startTime, phone: booking.customerPhone }),
    ])

    return NextResponse.redirect(`${siteUrl}/booking/confirm/${booking.token}`)
  } catch (err) {
    console.error('Booking verify error', err)
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.PENDING_PAYMENT },
    }).catch(() => {})
    return NextResponse.redirect(`${siteUrl}/booking/failed`)
  }
}
