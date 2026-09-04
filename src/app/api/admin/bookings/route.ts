import { NextRequest, NextResponse } from 'next/server'
import { BookingStatus, bookings } from '@/db/schema'
import { db } from '@/lib/db'
import { desc, eq } from 'drizzle-orm'

// Auth enforced by src/proxy.ts for /api/admin/* routes

export async function GET(req: NextRequest) {
  const statusParam = req.nextUrl.searchParams.get('status')
  const validStatuses = Object.values(BookingStatus) as string[]
  if (statusParam && !validStatuses.includes(statusParam as BookingStatus)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  const rows = await db.query.bookings.findMany({
    where: statusParam ? eq(bookings.status, statusParam as BookingStatus) : undefined,
    with: { service: true, addons: { with: { addon: true } } },
    orderBy: desc(bookings.date),
  })
  return NextResponse.json(rows)
}
