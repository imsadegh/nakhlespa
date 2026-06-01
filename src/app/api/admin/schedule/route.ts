import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const [hours, blocks] = await Promise.all([
    prisma.workingHours.findMany({ orderBy: { dayOfWeek: 'asc' } }),
    prisma.blockedSlot.findMany({ orderBy: { date: 'asc' } }),
  ])
  return NextResponse.json({ hours, blocks })
}
