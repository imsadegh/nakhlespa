import { NextRequest, NextResponse } from 'next/server'
import { customerSessions } from '@/db/schema'
import { db } from '@/lib/db'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('__customer_session')?.value
  if (token) {
    await db.delete(customerSessions).where(eq(customerSessions.sessionToken, token))
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set('__customer_session', '', { path: '/my', maxAge: 0 })
  return res
}
