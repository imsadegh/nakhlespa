import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('__customer_session')?.value
  if (token) {
    await prisma.customerSession.deleteMany({ where: { sessionToken: token } })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set('__customer_session', '', { path: '/my', maxAge: 0 })
  return res
}
