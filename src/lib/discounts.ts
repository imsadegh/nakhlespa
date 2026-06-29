import { prisma } from '@/lib/prisma'
import { BookingStatus } from '@prisma/client'

export async function validatePromoCode(
  code: string,
  _phone: string,
  subtotal: number,
): Promise<{ valid: boolean; discountAmount: number; codeId: string; message?: string }> {
  const dc = await prisma.discountCode.findUnique({ where: { code: code.toUpperCase() } })
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
  const count = await prisma.booking.count({
    where: {
      customerPhone: phone,
      status: { in: [BookingStatus.PAID, BookingStatus.CONFIRMED] },
    },
  })
  if (count % 5 !== 4) {
    return { eligible: false, discountAmount: 0, codeId: '' }
  }
  const dc = await prisma.discountCode.findUnique({ where: { code: 'LOYALTY_AUTO' } })
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
