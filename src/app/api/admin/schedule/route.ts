// Auth enforced by src/proxy.ts for /api/admin/* routes
import { NextResponse } from 'next/server'
import { blockedSlots, workingHours } from '@/db/schema'
import { db } from '@/lib/db'
import { asc, desc } from 'drizzle-orm'

export async function GET() {
  try {
    const [hours, blocks] = await Promise.all([
      db.select().from(workingHours).orderBy(asc(workingHours.gender), asc(workingHours.dayOfWeek)),
      db.select().from(blockedSlots).orderBy(desc(blockedSlots.date)),
    ])
    return NextResponse.json({ hours, blocks })
  } catch (err) {
    console.error('Schedule fetch error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
