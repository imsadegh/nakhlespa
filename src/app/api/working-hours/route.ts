import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const hours = await prisma.workingHours.findMany({
    select: { dayOfWeek: true, gender: true, isOpen: true, openTime: true, closeTime: true },
    orderBy: [{ gender: 'asc' }, { dayOfWeek: 'asc' }],
  })
  return NextResponse.json(hours)
}
