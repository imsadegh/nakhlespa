import { NextRequest, NextResponse } from 'next/server'
import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { BookingStatus, bookings, services, smsReminders } from '@/db/schema'
import { zarinpalVerify } from '@/lib/zarinpal'
import { smsQueue } from '@/lib/queue'
import { sendConfirmSms, sendAdminSms } from '@/lib/smsir'

const MOCK_PAYMENT = process.env.NODE_ENV !== 'production' && process.env.ZARINPAL_MOCK === 'true'

export async function GET(req: NextRequest) {
  const authority = req.nextUrl.searchParams.get('Authority')
  const status = req.nextUrl.searchParams.get('Status')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

  if (status !== 'OK' || !authority) {
    return NextResponse.redirect(`${siteUrl}/booking/failed`)
  }

  // Payer booking carries the zarinpalAuthority
  const [payerBooking] = await db.select({ booking: bookings, service: services }).from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(eq(bookings.zarinpalAuthority, authority)).limit(1)
  if (!payerBooking) return NextResponse.redirect(`${siteUrl}/booking/failed`)
  const payer = { ...payerBooking.booking, service: payerBooking.service }

  if (payer.status === BookingStatus.PAID) {
    return NextResponse.redirect(`${siteUrl}/booking/confirm/${payer.token}`)
  }

  if (payer.status !== BookingStatus.PENDING_PAYMENT) {
    return NextResponse.redirect(`${siteUrl}/booking/failed`)
  }

  // Atomic guard: only one concurrent callback wins
  const updated = await db.update(bookings).set({ status: BookingStatus.PAID })
    .where(and(eq(bookings.id, payer.id), eq(bookings.status, BookingStatus.PENDING_PAYMENT))).returning({ id: bookings.id })
  if (updated.length === 0) {
    return NextResponse.redirect(`${siteUrl}/booking/confirm/${payer.token}`)
  }

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

    const { refId } = await zarinpalVerify(authority, totalPrice)

    // Mark all group bookings PAID and store refId on payer
    await db.transaction(async tx => {
      await tx.update(bookings).set({ status: BookingStatus.PAID })
        .where(groupToken ? eq(bookings.groupToken, groupToken) : eq(bookings.id, payer.id))
      await tx.update(bookings).set({ zarinpalRefId: refId }).where(eq(bookings.id, payer.id))
    })

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
    await db.update(bookings).set({ status: BookingStatus.PENDING_PAYMENT }).where(eq(bookings.id, payer.id)).catch(() => {})
    return NextResponse.redirect(`${siteUrl}/booking/failed`)
  }
}
