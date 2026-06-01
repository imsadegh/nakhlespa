import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest) {
  const hours: { id: string; isOpen: boolean; openTime: string; closeTime: string }[] = await req.json()
  await Promise.all(
    hours.map(h => prisma.workingHours.update({
      where: { id: h.id },
      data: { isOpen: h.isOpen, openTime: h.openTime, closeTime: h.closeTime }
    }))
  )
  return NextResponse.json({ ok: true })
}
