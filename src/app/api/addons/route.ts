import { NextResponse } from 'next/server'
import { addons } from '@/db/schema'
import { db } from '@/lib/db'
import { asc, eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const rows = await db.select({ id: addons.id, nameFa: addons.nameFa, price: addons.price, requiresTier: addons.requiresTier })
      .from(addons).where(eq(addons.isActive, true)).orderBy(asc(addons.requiresTier))
    return NextResponse.json(rows)
  } catch (err) {
    console.error('Addons fetch error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
