import { NextRequest, NextResponse } from 'next/server'
import { discountCodes } from '@/db/schema'
import { db } from '@/lib/db'
import { eq } from 'drizzle-orm'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [dc] = await db.select().from(discountCodes).where(eq(discountCodes.id, id)).limit(1)
  if (!dc) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (dc.code === 'LOYALTY_AUTO') {
    return NextResponse.json({ error: 'کد وفاداری قابل تغییر نیست' }, { status: 400 })
  }
  const [updated] = await db.update(discountCodes)
    .set({ isActive: !dc.isActive })
    .where(eq(discountCodes.id, id))
    .returning()
  return NextResponse.json(updated)
}
