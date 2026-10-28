import { NextRequest, NextResponse } from 'next/server'
import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { BookingStatus, bookings, bookingCustomizations, services, smsReminders } from '@/db/schema'
import { zibalVerify } from '@/lib/zibal'
import { smsQueue } from '@/lib/queue'
import { sendConfirmSms, sendAdminSms } from '@/lib/smsir'

const MOCK_PAYMENT = process.env.NODE_ENV !== 'production' && process.env.ZIBAL_MOCK === 'true'

export async function GET(req: NextRequest) {
  const trackId = req.nextUrl.searchParams.get('trackId')
  const success = req.nextUrl.searchParams.get('success')
  const siteUrl = MOCK_PAYMENT ? req.nextUrl.origin : process.env.NEXT_PUBLIC_SITE_URL!

  if (success !== '1' || !trackId || (!/^[1-9]\d*$/.test(trackId) && !(MOCK_PAYMENT && trackId.startsWith('mock-')))) {
    return NextResponse.redirect(`${siteUrl}/booking/failed`)
  }

  // Keep legacy column names to preserve existing payment records without a migration.
  const [payerBooking] = await db.select({ booking: bookings, service: services }).from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(eq(bookings.zarinpalAuthority, trackId)).limit(1)
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
      ? await db.select().from(bookings).where(eq(bookings.groupToken, groupToken))
      : [payer]

    const totalPrice = allGroupBookings.reduce(
      (s, b) => s + b.addonsPricePaid,
      0
    ) + await (async () => {
      const svcIds = [...new Set(allGroupBookings.map(b => b.serviceId))]
      const svcs = await db.select({ id: services.id, price: services.price }).from(services).where(inArray(services.id, svcIds))
      const svcMap = new Map(svcs.map(s => [s.id, s.price]))
      return allGroupBookings.reduce((s, b) => {
        const price = svcMap.get(b.serviceId)
        if (price === undefined) throw new Error(`Service ${b.serviceId} not found during verify`)
        return s + price
      }, 0)
    })()

    const customizations = await db.select({ pricePaid: bookingCustomizations.pricePaid }).from(bookingCustomizations)
      .where(inArray(bookingCustomizations.bookingId, allGroupBookings.map(b => b.id)))
    const customizationPrice = customizations.reduce((sum, item) => sum + item.pricePaid, 0)
    const { refId } = await zibalVerify(trackId, Math.max(0, totalPrice + customizationPrice - payer.discountAmount))

    // Mark all group bookings PAID and store refId on payer
    const recorded = await db.transaction(async tx => {
      // Only a verified payment can claim the booking; one callback sends notifications.
      const updated = await tx.update(bookings).set({ status: BookingStatus.PAID, zarinpalRefId: refId })
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

    // Schedule SMS reminders for payer only
    const [h, m] = payer.startTime.split(':').map(Number)
    const appointmentMs = payer.date.getTime() + (h * 60 + m) * 60 * 1000
    const delay24h = Math.max(0, appointmentMs - 24 * 60 * 60 * 1000 - Date.now())
    const delay2h = Math.max(0, appointmentMs - 2 * 60 * 60 * 1000 - Date.now())

    const reminders = await db.transaction(async tx => {
      const [reminder24] = await tx.insert(smsReminders).values({ bookingId: payer.id, sendAt: new Date(appointmentMs - 24 * 60 * 60 * 1000) }).returning()
      const [reminder2] = await tx.insert(smsReminders).values({ bookingId: payer.id, sendAt: new Date(appointmentMs - 2 * 60 * 60 * 1000) }).returning()
      return [reminder24, reminder2]
    })
    const [reminder24, reminder2] = reminders

    const dateFa = payer.date.toLocaleDateString('fa-IR')
    const reminderParams = { name: payer.customerName, service: payer.service.nameFa, time: payer.startTime }

    await Promise.all([
      smsQueue.add('reminder-24h', { reminderId: reminder24.id, phone: payer.customerPhone, template: 'reminder24h', params: reminderParams }, { delay: delay24h }),
      smsQueue.add('reminder-2h',  { reminderId: reminder2.id,  phone: payer.customerPhone, template: 'reminder2h', params: reminderParams }, { delay: delay2h }),
      sendConfirmSms(payer.customerPhone, { name: payer.customerName, service: payer.service.nameFa, date: dateFa, time: payer.startTime, refId: String(refId) }),
      sendAdminSms(process.env.ADMIN_PHONE!, { name: payer.customerName, service: payer.service.nameFa, date: dateFa, time: payer.startTime, phone: payer.customerPhone }),
    ])

    return NextResponse.redirect(`${siteUrl}/booking/confirm/${payer.token}`)
  } catch (err) {
    console.error('Booking verify error', err)
    if (paymentRecorded) return NextResponse.redirect(`${siteUrl}/booking/confirm/${payer.token}`)
    return NextResponse.redirect(`${siteUrl}/booking/failed`)
  }
}
