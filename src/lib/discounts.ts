import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { BookingStatus, bookings, discountCodes } from '@/db/schema'

export async function validatePromoCode(
  code: string,
  _phone: string,
  subtotal: number,
): Promise<{ valid: boolean; discountAmount: number; codeId: string; message?: string }> {
  const [dc] = await db.select().from(discountCodes).where(eq(discountCodes.code, code.toUpperCase())).limit(1)
  if (!dc || !dc.isActive || dc.code === 'LOYALTY_AUTO') {
    return { valid: false, discountAmount: 0, codeId: '', message: 'کد تخفیف معتبر نیست' }
  }
  if (dc.expiresAt && dc.expiresAt < new Date()) {
    return { valid: false, discountAmount: 0, codeId: '', message: 'کد تخفیف منقضی شده است' }
  }
  if (dc.maxUses !== null && dc.usedCount >= dc.maxUses) {
    return { valid: false, discountAmount: 0, codeId: '', message: 'ظرفیت استفاده از این کد تمام شده است' }
  }
  const discountAmount = dc.type === 'PERCENT'
    ? Math.floor(subtotal * dc.value / 100)
    : Math.min(dc.value, subtotal)
  return { valid: true, discountAmount, codeId: dc.id }
}

export async function checkLoyaltyDiscount(
  phone: string,
  subtotal: number,
): Promise<{ eligible: boolean; discountAmount: number; codeId: string }> {
  const [{ count }] = await db.select({ count: db.$count(bookings, and(
    eq(bookings.customerPhone, phone),
    inArray(bookings.status, [BookingStatus.PAID, BookingStatus.CONFIRMED]),
  )) }).from(bookings)
  if (count % 5 !== 4) {
    return { eligible: false, discountAmount: 0, codeId: '' }
  }
  const [dc] = await db.select().from(discountCodes).where(eq(discountCodes.code, 'LOYALTY_AUTO')).limit(1)
  if (!dc || !dc.isActive) {
    if (!dc) console.error('[discounts] LOYALTY_AUTO code not found in database — run seed')
    return { eligible: false, discountAmount: 0, codeId: '' }
  }
  if (dc.expiresAt && dc.expiresAt < new Date()) {
    return { eligible: false, discountAmount: 0, codeId: '' }
  }
  const discountAmount = dc.type === 'PERCENT'
    ? Math.floor(subtotal * dc.value / 100)
    : Math.min(dc.value, subtotal)
  return { eligible: true, discountAmount, codeId: dc.id }
}
