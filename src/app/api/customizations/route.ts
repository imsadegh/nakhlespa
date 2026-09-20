import { asc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { customizationOptions } from '@/db/schema'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const rows = await db.select({
      id: customizationOptions.id,
      category: customizationOptions.category,
      code: customizationOptions.code,
      label: customizationOptions.labelFa,
      description: customizationOptions.descriptionFa,
      additionalPrice: customizationOptions.additionalPrice,
      requiresTier: customizationOptions.requiresTier,
      sortOrder: customizationOptions.sortOrder,
    }).from(customizationOptions)
      .where(eq(customizationOptions.isActive, true))
      .orderBy(asc(customizationOptions.category), asc(customizationOptions.sortOrder))
    return NextResponse.json(rows)
  } catch (error) {
    console.error('Customization options fetch error', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
