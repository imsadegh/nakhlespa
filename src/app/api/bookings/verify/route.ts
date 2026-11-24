import { NextRequest, NextResponse } from 'next/server'
import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { BookingStatus, bookings, bookingCustomizations, services, smsReminders } from '@/db/schema'
import { zibalVerify } from '@/lib/zibal'
import { smsQueue } from '@/lib/queue'
import { sendConfirmSms, sendAdminSms } from '@/lib/smsir'

const MOCK_PAYMENT = process.env.NODE_ENV !== 'production' && process.env.ZIBAL_MOCK === 'true'
const HOUR_MS = 60 * 60 * 1000
const REMINDERS = [
  { hoursBefore: 24, name: 'reminder-24h', template: 'reminder24h' },
  { hoursBefore: 2, name: 'reminder-2h', template: 'reminder2h' },
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
      // Only a verified payment can claim the booking; one callback sends notifications.
      const updated = await tx.update(bookings).set({ status: BookingStatus.PAID, zibalRefId: refId })
        .where(and(eq(bookings.id, payer.id), eq(bookings.status, BookingStatus.PENDING_PAYMENT)))
        .returning({ id: bookings.id })
      if (updated.length === 0) return false
      await tx.update(bookings).set({ status: BookingStatus.PAID })
        .where(groupToken ? eq(bookings.groupToken, groupToken) : eq(bookings.id, payer.id))
      return true
    })
    paymentRecorded = true
    if (!recorded) return NextResponse.redirect(`${siteUrl}/booking/confirm/${payer.token}`)

    // Local mock payments should exercise booking completion without requiring
    // real SMS credentials or a running Redis reminder worker.
    if (MOCK_PAYMENT) return NextResponse.redirect(`${siteUrl}/booking/confirm/${payer.token}`)

    await Promise.all(allGroupBookings.map(async ({ booking, service }) => {
      const bookingDay = booking.date.toISOString().slice(0, 10)
      const appointmentMs = Date.parse(`${bookingDay}T${booking.startTime}+03:30`)
      const dateFa = booking.date.toLocaleDateString('fa-IR')
      const reminderParams = { name: booking.customerName, service: service.nameFa, time: booking.startTime }
      const now = Date.now()
      await Promise.all([
        ...REMINDERS.map(async ({ hoursBefore, name, template }) => {
          const sendAt = appointmentMs - hoursBefore * HOUR_MS
          if (sendAt < now) return
          const [reminder] = await db.insert(smsReminders)
            .values({ bookingId: booking.id, sendAt: new Date(sendAt) }).returning()
          await smsQueue.add(name, { reminderId: reminder.id, phone: booking.customerPhone, template, params: reminderParams }, {
            delay: Math.max(0, sendAt - Date.now()),
          })
        }),
        sendConfirmSms(booking.customerPhone, { ...reminderParams, date: dateFa, bookingCode: booking.bookingCode }),
        sendAdminSms(process.env.ADMIN_PHONE!, { ...reminderParams, date: dateFa, phone: booking.customerPhone }),
      ])
    }))

    return NextResponse.redirect(`${siteUrl}/booking/confirm/${payer.token}`)
  } catch (err) {
    console.error('Booking verify error', err)
    if (paymentRecorded) return NextResponse.redirect(`${siteUrl}/booking/confirm/${payer.token}`)
    return NextResponse.redirect(`${siteUrl}/booking/failed`)
  }
}
