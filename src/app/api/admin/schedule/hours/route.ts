// Auth enforced by src/proxy.ts for /api/admin/* routes
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest) {
  try {
    const hours: { id: string; dayOfWeek: number; gender: 'FEMALE' | 'MALE'; isOpen: boolean; openTime: string; closeTime: string }[] = await req.json()
    await Promise.all(
      hours.map(h => prisma.workingHours.update({
        where: { id: h.id },
        data: { isOpen: h.isOpen, openTime: h.openTime, closeTime: h.closeTime }
      }))
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Working hours update error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
