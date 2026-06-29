import { NextRequest, NextResponse } from 'next/server'
import { checkLoyaltyDiscount } from '@/lib/discounts'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const phone = searchParams.get('phone') ?? ''
  const total = Number(searchParams.get('total') ?? '0')
  if (!phone || !total) {
    return NextResponse.json({ eligible: false, discountAmount: 0, codeId: '' })
  }
  const result = await checkLoyaltyDiscount(phone, total)
  return NextResponse.json(result)
}
