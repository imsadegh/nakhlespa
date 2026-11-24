import { NextRequest, NextResponse } from 'next/server'
import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { BookingStatus, bookings, bookingCustomizations, services, smsReminders } from '@/db/schema'
import { zibalVerify } from '@/lib/zibal'
import { sendAdminSms } from '@/lib/smsir'
import { getAppointmentTime } from '@/lib/slot-time'

const MOCK_PAYMENT = process.env.NODE_ENV !== 'production' && process.env.ZIBAL_MOCK === 'true'
const HOUR_MS = 60 * 60 * 1000
const REMINDERS = [
  { hoursBefore: 24, template: 'reminder24h' },
  { hoursBefore: 2, template: 'reminder2h' },
] as const

export async function GET(req: NextRequest) {
  const trackId = req.nextUrl.searchParams.get('trackId')
  const success = req.nextUrl.searchParams.get('success')
  const siteUrl = MOCK_PAYMENT ? req.nextUrl.origin : process.env.NEXT_PUBLIC_SITE_URL!

  if (success !== '1' || !trackId || (!/^[1-9]\d*$/.test(trackId) && !(MOCK_PAYMENT && trackId.startsWith('mock-')))) {
    return NextResponse.redirect(`${siteUrl}/booking/failed`)
  }

  const [payerBooking] = await db.select({ booking: bookings, service: services }).from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(eq(bookings.zibalTrackId, trackId)).limit(1)
  if (!payerBooking) return NextResponse.redirect(`${siteUrl}/booking/failed`)
  const payer = { ...payerBooking.booking, service: payerBooking.service }

  if (payer.status === BookingStatus.PAID) {
    return NextResponse.redirect(`${siteUrl}/booking/confirm/${payer.token}`)
  }

  if (payer.status !== BookingStatus.PENDING_PAYMENT) {
    return NextResponse.redirect(`${siteUrl}/booking/failed`)
  }

  let paymentRecorded = false
  try {
    // Total price = sum of all bookings in the group
    const groupToken = payer.groupToken
    const allGroupBookings = groupToken
      ? await db.select({ booking: bookings, service: services }).from(bookings)
        .innerJoin(services, eq(bookings.serviceId, services.id)).where(eq(bookings.groupToken, groupToken))
      : [{ booking: payer, service: payer.service }]

    const totalPrice = allGroupBookings.reduce(
      (sum, { booking, service }) => sum + booking.addonsPricePaid + service.price,
      0,
    )

    const customizations = await db.select({ pricePaid: bookingCustomizations.pricePaid }).from(bookingCustomizations)
      .where(inArray(bookingCustomizations.bookingId, allGroupBookings.map(({ booking }) => booking.id)))
    const customizationPrice = customizations.reduce((sum, item) => sum + item.pricePaid, 0)
    const { refId } = await zibalVerify(trackId, Math.max(0, totalPrice + customizationPrice - payer.discountAmount))

    // Mark all group bookings PAID and store refId on payer
    const recorded = await db.transaction(async tx => {
      // Record customer notifications atomically with payment so the worker can recover them.
      const updated = await tx.update(bookings).set({ status: BookingStatus.PAID, zibalRefId: refId })
        .where(and(eq(bookings.id, payer.id), eq(bookings.status, BookingStatus.PENDING_PAYMENT)))
        .returning({ id: bookings.id })
      if (updated.length === 0) return false
      await tx.update(bookings).set({ status: BookingStatus.PAID })
        .where(groupToken ? eq(bookings.groupToken, groupToken) : eq(bookings.id, payer.id))
      if (!MOCK_PAYMENT) {
        const now = new Date(Date.now())
        const messages = allGroupBookings.flatMap(({ booking }) => {
          const appointment = getAppointmentTime(booking.date, booking.startTime)
          return [
            { bookingId: booking.id, template: 'confirm' as const, sendAt: now, nextAttemptAt: now },
            ...REMINDERS.map(({ hoursBefore, template }) => {
              const sendAt = new Date(appointment - hoursBefore * HOUR_MS)
              return { bookingId: booking.id, template, sendAt, nextAttemptAt: sendAt }
            }).filter(message => message.sendAt >= now),
          ]
        })
        await tx.insert(smsReminders).values(messages)
      }
      return true
    })
    paymentRecorded = true
    if (!recorded) return NextResponse.redirect(`${siteUrl}/booking/confirm/${payer.token}`)

    if (MOCK_PAYMENT) return NextResponse.redirect(`${siteUrl}/booking/confirm/${payer.token}`)

    await Promise.all(allGroupBookings.map(({ booking, service }) =>
      sendAdminSms(process.env.ADMIN_PHONE!, {
        name: booking.customerName, service: service.nameFa, time: booking.startTime,
        date: booking.date.toLocaleDateString('fa-IR', { timeZone: 'UTC' }), phone: booking.customerPhone,
      }),
    ))

    return NextResponse.redirect(`${siteUrl}/booking/confirm/${payer.token}`)
  } catch (err) {
    console.error('Booking verify error', err)
    if (paymentRecorded) return NextResponse.redirect(`${siteUrl}/booking/confirm/${payer.token}`)
    return NextResponse.redirect(`${siteUrl}/booking/failed`)
  }
}
