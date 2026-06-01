// Auth enforced by src/proxy.ts for /api/admin/* routes
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BookingStatus } from '@prisma/client'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { status } = await req.json()
  const validStatuses = Object.values(BookingStatus)
  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  const booking = await prisma.booking.update({ where: { id }, data: { status: status as BookingStatus } })
  return NextResponse.json(booking)
}
