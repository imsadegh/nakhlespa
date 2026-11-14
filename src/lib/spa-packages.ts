export const SPA_PACKAGE_NAMES = new Set([
  'نفس تازه',
  'احیاگر',
  'دریای آرامش',
  'سبک بال',
  'شاهانه',
])

export const CONSULTATION_NAME = 'مشاوره'
export const CONSULTATION_DESCRIPTION = 'در این جلسه ۳۰ دقیقه‌ای درباره هدف شما از مراجعه، سابقه سلامت و ترجیحاتتان گفت‌وگو می‌کنیم. بسته‌های اسپا و گزینه‌های ماساژ را توضیح می‌دهیم تا بتوانید خدمت مناسب خود را انتخاب کنید. این نوبت فقط برای مشاوره است.'
export const PAUSED_BATH_ADDON = 'حمام طهورا'

export const ONLINE_BOOKABLE_SERVICES = new Set([...SPA_PACKAGE_NAMES, CONSULTATION_NAME])

export function getCustomizationTier(nameFa: string, tier: number | null | undefined) {
  return nameFa === 'شاهانه' ? 3 : tier
}
