// Auth enforced by src/proxy.ts for /api/admin/* routes
import { NextRequest, NextResponse } from 'next/server'
import { blockedSlots } from '@/db/schema'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { date, startTime, endTime, reason } = await req.json()
    const [year, month, day] = date.split('-').map(Number)
    const [block] = await db.insert(blockedSlots).values({
      date: new Date(Date.UTC(year, month - 1, day)), startTime, endTime, reason
    }).returning()
    return NextResponse.json(block)
  } catch (err) {
    console.error('Block create error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
