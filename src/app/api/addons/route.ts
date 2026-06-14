import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const addons = await prisma.addon.findMany({
      where: { isActive: true },
      select: { id: true, nameFa: true, price: true, requiresTier: true },
      orderBy: { requiresTier: 'asc' },
    })
    return NextResponse.json(addons)
  } catch (err) {
    console.error('Addons fetch error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
