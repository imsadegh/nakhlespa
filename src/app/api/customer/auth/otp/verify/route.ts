import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHash, timingSafeEqual } from 'crypto'

function hashCode(code: string) {
  return createHash('sha256').update(code).digest('hex')
}

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

export async function POST(req: NextRequest) {
  let phone: string, code: string
  try {
    ;({ phone, code } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const verification = await prisma.verification.findFirst({
    where: { identifier: phone, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })
  if (!verification) {
    return NextResponse.json({ error: 'expired' }, { status: 400 })
  }
  if (!safeEqual(hashCode(code), verification.value)) {
    return NextResponse.json({ error: 'invalid_code' }, { status: 400 })
  }

  await prisma.verification.delete({ where: { id: verification.id } })

  const sessionToken = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000)
  await prisma.customerSession.create({
    data: { phone, sessionToken, expiresAt },
  })

  const res = NextResponse.json({ ok: true })
  res.cookies.set('__customer_session', sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/my',
    expires: expiresAt,
  })
  return res
}
