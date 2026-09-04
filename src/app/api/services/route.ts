import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { services } from '@/db/schema'

export async function GET() {
  try {
    const rows = await db.select().from(services).where(eq(services.isActive, true))
    return NextResponse.json(rows)
  } catch (err) {
    console.error('Services fetch error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
