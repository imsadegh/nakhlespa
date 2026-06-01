import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BookingStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  const statusParam = req.nextUrl.searchParams.get('status')
  const bookings = await prisma.booking.findMany({
    where: statusParam ? { status: statusParam as BookingStatus } : undefined,
    include: { service: true },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(bookings)
}
