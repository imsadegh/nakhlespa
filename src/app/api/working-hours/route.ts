import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const hours = await prisma.workingHours.findMany({
    select: { dayOfWeek: true, isOpen: true },
    orderBy: { dayOfWeek: 'asc' },
  })
  return NextResponse.json(hours)
}
