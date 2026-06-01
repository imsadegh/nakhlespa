// Auth enforced by src/middleware.ts for /api/admin/* routes
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [hours, blocks] = await Promise.all([
      prisma.workingHours.findMany({ orderBy: { dayOfWeek: 'asc' } }),
      prisma.blockedSlot.findMany({ orderBy: { date: 'asc' } }),
    ])
    return NextResponse.json({ hours, blocks })
  } catch (err) {
    console.error('Schedule fetch error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
