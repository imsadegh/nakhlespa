import { prisma } from '@/lib/prisma'
import { DiscountManager } from '@/components/admin/DiscountManager'
import type { DiscountCodeDTO } from '@/types'

export const dynamic = 'force-dynamic'

export default async function AdminDiscountsPage() {
  const codes = await prisma.discountCode.findMany({ orderBy: { createdAt: 'desc' } })
  const dtos: DiscountCodeDTO[] = codes.map(c => ({
    id: c.id,
    code: c.code,
    type: c.type as 'PERCENT' | 'FIXED',
    value: c.value,
    maxUses: c.maxUses,
    usedCount: c.usedCount,
    expiresAt: c.expiresAt?.toISOString() ?? null,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
  }))

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-light mb-6" style={{ color: 'var(--text-primary)' }}>مدیریت تخفیف‌ها</h1>
      <DiscountManager initial={dtos} />
    </div>
  )
}
