export const SPA_PACKAGE_NAMES = new Set([
  'نفس تازه',
  'احیاگر',
  'دریای آرامش',
  'سبک بال',
  'شاهانه',
])

export const ONLINE_BOOKABLE_SERVICES = new Set([...SPA_PACKAGE_NAMES, 'مشاوره'])

export function getCustomizationTier(nameFa: string, tier: number | null | undefined) {
  return nameFa === 'شاهانه' ? 3 : tier
}
