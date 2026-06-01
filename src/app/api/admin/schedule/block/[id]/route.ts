// Auth enforced by src/middleware.ts for /api/admin/* routes
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.blockedSlot.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Block delete error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
