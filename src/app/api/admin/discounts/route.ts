import { NextRequest, NextResponse } from 'next/server'
import { discountCodes, DiscountType } from '@/db/schema'
import { db } from '@/lib/db'
import { desc } from 'drizzle-orm'

export async function GET() {
  const codes = await db.select().from(discountCodes).orderBy(desc(discountCodes.createdAt))
  return NextResponse.json(codes)
}

export async function POST(req: NextRequest) {
  let body: { code: string; type: 'PERCENT' | 'FIXED'; value: number; maxUses?: number; expiresAt?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const { code, type, value, maxUses, expiresAt } = body
  if (!code || !type || !value || value <= 0) {
    return NextResponse.json({ error: 'کد، نوع و مقدار الزامی است' }, { status: 400 })
  }
  if (!['PERCENT', 'FIXED'].includes(type)) {
    return NextResponse.json({ error: 'نوع تخفیف باید PERCENT یا FIXED باشد' }, { status: 400 })
  }
  if (code.toUpperCase() === 'LOYALTY_AUTO') {
    return NextResponse.json({ error: 'این کد رزرو شده است' }, { status: 400 })
  }
  try {
    const [dc] = await db.insert(discountCodes).values({
      code: code.toUpperCase(),
      type: type as typeof DiscountType[keyof typeof DiscountType],
      value,
      maxUses: maxUses ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    }).returning()
    return NextResponse.json(dc, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'کد تخفیف تکراری است' }, { status: 409 })
  }
}
