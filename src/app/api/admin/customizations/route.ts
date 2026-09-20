import { NextRequest, NextResponse } from 'next/server'
import { asc, eq } from 'drizzle-orm'
import { customizationOptions } from '@/db/schema'
import { db } from '@/lib/db'

// Auth is enforced by src/proxy.ts for /api/admin/* routes.
export async function GET() {
  const rows = await db.select().from(customizationOptions)
    .orderBy(asc(customizationOptions.category), asc(customizationOptions.sortOrder))
  return NextResponse.json(rows)
}

export async function PATCH(req: NextRequest) {
  let body: { id?: string; labelFa?: string; descriptionFa?: string; additionalPrice?: number; requiresTier?: number | null; isActive?: boolean; sortOrder?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  if (body.additionalPrice !== undefined && (!Number.isInteger(body.additionalPrice) || body.additionalPrice < 0)) {
    return NextResponse.json({ error: 'additionalPrice must be a non-negative integer' }, { status: 400 })
  }
  const [updated] = await db.update(customizationOptions)
    .set({
      ...(body.labelFa !== undefined ? { labelFa: body.labelFa } : {}),
      ...(body.descriptionFa !== undefined ? { descriptionFa: body.descriptionFa } : {}),
      ...(body.additionalPrice !== undefined ? { additionalPrice: body.additionalPrice } : {}),
      ...(body.requiresTier !== undefined ? { requiresTier: body.requiresTier } : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
    })
    .where(eq(customizationOptions.id, body.id))
    .returning()
  return updated ? NextResponse.json(updated) : NextResponse.json({ error: 'Customization option not found' }, { status: 404 })
}
