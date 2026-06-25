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

  // Payer booking carries the zarinpalAuthority
  const payerBooking = await prisma.booking.findFirst({
    where: { zarinpalAuthority: authority },
    include: { service: true },
  })
  if (!payerBooking) return NextResponse.redirect(`${siteUrl}/booking/failed`)

  if (payerBooking.status === BookingStatus.PAID) {
    return NextResponse.redirect(`${siteUrl}/booking/confirm/${payerBooking.token}`)
  }

  if (payerBooking.status !== BookingStatus.PENDING_PAYMENT) {
    return NextResponse.redirect(`${siteUrl}/booking/failed`)
  }

  // Atomic guard: only one concurrent callback wins
  const updated = await prisma.booking.updateMany({
    where: { id: payerBooking.id, status: BookingStatus.PENDING_PAYMENT },
    data: { status: BookingStatus.PAID },
  })
  if (updated.count === 0) {
    return NextResponse.redirect(`${siteUrl}/booking/confirm/${payerBooking.token}`)
  }

  try {
    // Total price = sum of all bookings in the group
    const groupToken = payerBooking.groupToken
    const allGroupBookings = groupToken
      ? await prisma.booking.findMany({ where: { groupToken } })
      : [payerBooking]

    const totalPrice = allGroupBookings.reduce(
      (s, b) => s + b.addonsPricePaid,
      0
    ) + await (async () => {
      const svcIds = [...new Set(allGroupBookings.map(b => b.serviceId))]
      const svcs = await prisma.service.findMany({ where: { id: { in: svcIds } }, select: { id: true, price: true } })
      const svcMap = new Map(svcs.map(s => [s.id, s.price]))
      return allGroupBookings.reduce((s, b) => s + (svcMap.get(b.serviceId) ?? 0), 0)
    })()

    const { refId } = await zarinpalVerify(authority, totalPrice)

    // Mark all group bookings PAID and store refId on payer
    await prisma.$transaction([
      prisma.booking.updateMany({
        where: { groupToken: groupToken ?? payerBooking.id },
        data: { status: BookingStatus.PAID },
      }),
      prisma.booking.update({
        where: { id: payerBooking.id },
        data: { zarinpalRefId: refId },
      }),
    ])

    // Schedule SMS reminders for payer only
    const [h, m] = payerBooking.startTime.split(':').map(Number)
    const appointmentMs = payerBooking.date.getTime() + (h * 60 + m) * 60 * 1000
    const delay24h = Math.max(0, appointmentMs - 24 * 60 * 60 * 1000 - Date.now())
    const delay2h = Math.max(0, appointmentMs - 2 * 60 * 60 * 1000 - Date.now())

    const [reminder24, reminder2] = await prisma.$transaction([
      prisma.smsReminder.create({ data: { bookingId: payerBooking.id, sendAt: new Date(appointmentMs - 24 * 60 * 60 * 1000) } }),
      prisma.smsReminder.create({ data: { bookingId: payerBooking.id, sendAt: new Date(appointmentMs - 2 * 60 * 60 * 1000) } }),
    ])

    const dateFa = payerBooking.date.toLocaleDateString('fa-IR')
    const reminderParams = { name: payerBooking.customerName, service: payerBooking.service.nameFa, time: payerBooking.startTime }

    await Promise.all([
      smsQueue.add('reminder-24h', { reminderId: reminder24.id, phone: payerBooking.customerPhone, template: 'reminder24h', params: reminderParams }, { delay: delay24h }),
      smsQueue.add('reminder-2h',  { reminderId: reminder2.id,  phone: payerBooking.customerPhone, template: 'reminder2h',  params: reminderParams }, { delay: delay2h }),
      sendConfirmSms(payerBooking.customerPhone, { name: payerBooking.customerName, service: payerBooking.service.nameFa, date: dateFa, time: payerBooking.startTime, refId: String(refId) }),
      sendAdminSms(process.env.ADMIN_PHONE!, { name: payerBooking.customerName, service: payerBooking.service.nameFa, date: dateFa, time: payerBooking.startTime, phone: payerBooking.customerPhone }),
    ])

    return NextResponse.redirect(`${siteUrl}/booking/confirm/${payerBooking.token}`)
  } catch (err) {
    console.error('Booking verify error', err)
    await prisma.booking.update({
      where: { id: payerBooking.id },
      data: { status: BookingStatus.PENDING_PAYMENT },
    }).catch(() => {})
    return NextResponse.redirect(`${siteUrl}/booking/failed`)
  }
}
