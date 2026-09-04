import { NextRequest, NextResponse } from 'next/server'
import { customerSessions, verification } from '@/db/schema'
import { db } from '@/lib/db'
import { and, desc, eq, gt } from 'drizzle-orm'
import { isOtpCode, normalizeOtpDigits } from '@/lib/customer-otp'
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

  phone = normalizeOtpDigits(phone)
  code = normalizeOtpDigits(code)
  if (!/^09\d{9}$/.test(phone) || !isOtpCode(code)) {
    return NextResponse.json({ error: 'invalid_request', message: 'درخواست نامعتبر است' }, { status: 400 })
  }

  const [verificationRow] = await db.select().from(verification)
    .where(and(eq(verification.identifier, phone), gt(verification.expiresAt, new Date())))
    .orderBy(desc(verification.createdAt)).limit(1)
  if (!verificationRow) {
    return NextResponse.json({ error: 'expired', message: 'کد منقضی شده است' }, { status: 400 })
  }
  if (!safeEqual(hashCode(code), verificationRow.value)) {
    await db.delete(verification).where(eq(verification.id, verificationRow.id))
    return NextResponse.json({ error: 'invalid_code', message: 'کد وارد شده اشتباه است' }, { status: 400 })
  }

  await db.delete(verification).where(eq(verification.id, verificationRow.id))

  const sessionToken = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000)
  await db.insert(customerSessions).values({ phone, sessionToken, expiresAt })

  const res = NextResponse.json({ ok: true })
  res.cookies.set('__customer_session', sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/my',
    expires: expiresAt,
    secure: false,
  })
  return res
}
