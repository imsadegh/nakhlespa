// Auth enforced by src/proxy.ts for /api/admin/* routes
import { NextRequest, NextResponse } from 'next/server'
import { blockedSlots } from '@/db/schema'
import { db } from '@/lib/db'
import { eq } from 'drizzle-orm'

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await db.delete(blockedSlots).where(eq(blockedSlots.id, id))
    if (result.rowCount === 0) throw new Error(`Blocked slot not found: ${id}`)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Block delete error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
