import { NextRequest, NextResponse } from 'next/server'
import { verification } from '@/db/schema'
import { db } from '@/lib/db'
import { and, count, eq, gte } from 'drizzle-orm'
import { sendOtpSms } from '@/lib/smsir'
import { normalizeOtpDigits } from '@/lib/customer-otp'
import { createHash, randomInt } from 'crypto'

function hashCode(code: string) {
  return createHash('sha256').update(code).digest('hex')
}

export async function POST(req: NextRequest) {
  let phone: string
  try {
    ;({ phone } = await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  phone = normalizeOtpDigits(phone)
  if (!/^09\d{9}$/.test(phone)) {
    return NextResponse.json({ error: 'شماره موبایل معتبر نیست' }, { status: 400 })
  }

  // Rate limit: max 3 active verifications per phone in last 10 min
  const since = new Date(Date.now() - 10 * 60 * 1000)
  const [{ count: recent }] = await db.select({ count: count() }).from(verification)
    .where(and(eq(verification.identifier, phone), gte(verification.createdAt, since)))
  if (recent >= 3) {
    return NextResponse.json({ error: 'تعداد درخواست بیش از حد مجاز است. لطفاً ۱۰ دقیقه صبر کنید.' }, { status: 429 })
  }

  const code = String(randomInt(100000, 1000000))
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  await db.insert(verification).values({
      id: crypto.randomUUID(),
      identifier: phone,
      value: hashCode(code),
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
  })

  await sendOtpSms(phone, code)
  return NextResponse.json({ ok: true })
}
