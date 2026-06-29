import { NextRequest, NextResponse } from 'next/server'
import { validatePromoCode } from '@/lib/discounts'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code') ?? ''
  const phone = searchParams.get('phone') ?? ''
  const total = Number(searchParams.get('total') ?? '0')

  if (!code || !phone || !total) {
    return NextResponse.json({ valid: false, discountAmount: 0, codeId: '', message: 'پارامترها ناقص است' }, { status: 400 })
  }

  const result = await validatePromoCode(code, phone, total)
  return NextResponse.json(result)
}
