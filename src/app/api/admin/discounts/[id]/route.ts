import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dc = await prisma.discountCode.findUnique({ where: { id } })
  if (!dc) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (dc.code === 'LOYALTY_AUTO') {
    return NextResponse.json({ error: 'کد وفاداری قابل تغییر نیست' }, { status: 400 })
  }
  const updated = await prisma.discountCode.update({
    where: { id },
    data: { isActive: !dc.isActive },
  })
  return NextResponse.json(updated)
}
