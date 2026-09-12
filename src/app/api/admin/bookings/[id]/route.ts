// Auth enforced by src/proxy.ts for /api/admin/* routes
import { NextRequest, NextResponse } from 'next/server'
import { BookingStatus, bookings } from '@/db/schema'
import { db } from '@/lib/db'
import { eq } from 'drizzle-orm'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { status } = await req.json()
  const validStatuses = Object.values(BookingStatus) as string[]
  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  const [booking] = await db.update(bookings).set({ status: status as BookingStatus }).where(eq(bookings.id, id)).returning()
  return NextResponse.json(booking)
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const booking = await db.query.bookings.findFirst({
    where: eq(bookings.id, id),
    columns: { customization: true },
  })
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  return NextResponse.json(booking)
}
