import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BookingStatus } from '@prisma/client'

// Auth enforced by src/proxy.ts for /api/admin/* routes

export async function GET(req: NextRequest) {
  const statusParam = req.nextUrl.searchParams.get('status')
  const validStatuses = Object.values(BookingStatus)
  if (statusParam && !validStatuses.includes(statusParam as BookingStatus)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  const bookings = await prisma.booking.findMany({
    where: statusParam ? { status: statusParam as BookingStatus } : undefined,
    include: { service: true },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(bookings)
}
