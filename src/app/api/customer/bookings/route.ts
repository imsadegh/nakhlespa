import { NextRequest, NextResponse } from 'next/server'
import { BookingStatus, bookings } from '@/db/schema'
import { db } from '@/lib/db'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { getCustomerSession } from '@/lib/customer-auth'
import { CUSTOMER_BOOKING_PROJECTION } from '@/lib/customer-booking'

export async function GET(req: NextRequest) {
  const session = await getCustomerSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const allBookings = await db.query.bookings.findMany({
    ...CUSTOMER_BOOKING_PROJECTION,
    where: and(
      eq(bookings.customerPhone, session.phone),
      inArray(bookings.status, [BookingStatus.PAID, BookingStatus.CONFIRMED, BookingStatus.CANCELLED]),
    ),
    with: { service: true, addons: { with: { addon: true } }, discountCode: true },
    orderBy: desc(bookings.date),
  })

  const completedCount = allBookings.filter(
    booking => booking.status === BookingStatus.PAID || booking.status === BookingStatus.CONFIRMED,
  ).length

  return NextResponse.json({ bookings: allBookings, completedCount })
}
