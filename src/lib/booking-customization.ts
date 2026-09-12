import type {
  BookingCustomization,
  CustomizationKey,
  CustomizationOption,
} from '@/types'

export const CUSTOMIZATION_DEFAULTS: BookingCustomization = {
  musicGenre: 'INSTRUMENTAL',
  pressureLevel: 'MEDIUM',
  soap: 'TRADITIONAL',
  loofah: 'PUBLIC',
  poultice: 'GENERAL_SEDR_HENNA',
}

export const CUSTOMIZATION_OPTIONS: {
  [K in CustomizationKey]: readonly CustomizationOption<BookingCustomization[K]>[]
} = {
  musicGenre: [
    { value: 'TRADITIONAL', label: 'سنتی', description: 'موسیقی سنتی ایرانی' },
    { value: 'POP', label: 'پاپ', description: 'موسیقی پاپ' },
    { value: 'INSTRUMENTAL', label: 'بی‌کلام', description: 'موسیقی بی‌کلام' },
    { value: 'RELAXING', label: 'آرامش‌بخش', description: 'موسیقی آرامش‌بخش' },
    { value: 'CLASSICAL', label: 'کلاسیک', description: 'موسیقی کلاسیک' },
  ],
  pressureLevel: [
    { value: 'GENTLE', label: 'ملایم', description: 'فشار ملایم' },
    { value: 'MEDIUM', label: 'متوسط', description: 'فشار متوسط' },
    { value: 'FIRM', label: 'قوی', description: 'فشار قوی' },
  ],
  soap: [
    { value: 'TRADITIONAL', label: 'صابون سنتی', description: 'صابون سنتی' },
    { value: 'LUXURY', label: 'لوکس', description: 'صابون لوکس' },
    { value: 'GOLNAR', label: 'گلنار', description: 'صابون گلنار' },
    { value: 'SHAMPOO', label: 'شامپو', description: 'شامپو' },
  ],
  loofah: [
    { value: 'PUBLIC', label: 'کیسه و لیف پشمی عمومی', description: 'کیسه و لیف عمومی مجموعه' },
    { value: 'BRINGS_OWN', label: 'همراه داشتن کیسه و لیف شخصی', description: 'مشتری کیسه و لیف شخصی خود را همراه دارد.' },
    { value: 'BUYS_FROM_US', label: 'خرید کیسه و لیف جدید', description: 'کیسه و لیف جدید از مجموعه خریداری می‌شود.', additionalPrice: 300000 },
    { value: 'VIP_FREE_NEW', label: 'کیسه و لیف نو رایگان (VIP ارغوان)', description: 'مخصوص VIP ارغوان، به‌صورت خودکار انتخاب می‌شود.' },
  ],
  poultice: [
    {
      value: 'GENERAL_SEDR_HENNA',
      label: 'عمومی سدر و حنا',
      description: 'ضماد عمومی سدر و حنا',
    },
    {
      value: 'PRIVATE_WHEAT_WARM',
      label: 'خصوصی با آرد گندم سبوس‌دار و روغن زیتون بودا',
      description: 'ضماد گرم با آرد گندم سبوس‌دار و روغن زیتون بودا',
      additionalPrice: 600000,
    },
    {
      value: 'PRIVATE_BARLEY_COLD',
      label: 'خصوصی با آرد جو سبوس‌دار و سرکه سیب طبیعی',
      description: 'ضماد سرد با آرد جو سبوس‌دار و سرکه سیب طبیعی',
      additionalPrice: 600000,
    },
  ],
}

export const CUSTOMIZATION_FIELD_LABELS: Record<CustomizationKey, string> = {
  musicGenre: 'موسیقی',
  pressureLevel: 'فشار ماساژ',
  soap: 'صابون حمام',
  loofah: 'کیسه و لیف',
  poultice: 'ضماد',
}

export type CustomizationDisplayRow = {
  key: CustomizationKey
  label: string
  value: string
  description: string
}

export function formatCustomization(
  customization: BookingCustomization | null | undefined,
): CustomizationDisplayRow[] {
  return (Object.keys(CUSTOMIZATION_OPTIONS) as CustomizationKey[]).map(key => {
    const option = customization
      ? CUSTOMIZATION_OPTIONS[key].find(item => item.value === customization[key])
      : undefined
    return {
      key,
      label: CUSTOMIZATION_FIELD_LABELS[key],
      value: option?.label ?? 'ثبت نشده',
      description: option?.description ?? '',
    }
  })
}

export function getDefaultCustomization(): BookingCustomization {
  return { ...CUSTOMIZATION_DEFAULTS }
}

export function getCustomizationAdditionalPrice(
  customization: BookingCustomization | null | undefined,
  serviceTier?: number | null,
): number {
  if (!customization || serviceTier === null || serviceTier === undefined) return 0
  return (Object.keys(CUSTOMIZATION_OPTIONS) as CustomizationKey[]).reduce((total, key) => {
    const option = CUSTOMIZATION_OPTIONS[key].find(item => item.value === customization[key])
    return total + (option?.additionalPrice ?? 0)
  }, 0)
}

export function normalizeCustomization(
  customization: BookingCustomization,
  serviceTier?: number | null,
): BookingCustomization {
  if (serviceTier === 3) return { ...customization, loofah: 'VIP_FREE_NEW' }
  if (customization.loofah === 'VIP_FREE_NEW') return { ...customization, loofah: 'PUBLIC' }
  return { ...customization }
}

type CustomizationValidation =
  | { valid: true; value: BookingCustomization | null }
  | { valid: false; error: string }

export function validateCustomization(
  input: unknown,
  serviceTier?: number | null,
): CustomizationValidation {
  if (serviceTier === null) return { valid: true, value: null }

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { valid: false, error: 'Invalid customization object' }
  }

  const candidate = input as Record<string, unknown>
  const keys = Object.keys(CUSTOMIZATION_DEFAULTS)
  if (Object.keys(candidate).length !== keys.length || keys.some(key => !(key in candidate))) {
    return { valid: false, error: 'Invalid customization object' }
  }

  for (const key of keys) {
    const value = candidate[key]
    const allowed = CUSTOMIZATION_OPTIONS[key as CustomizationKey].some(option => option.value === value)
    if (!allowed) return { valid: false, error: `Invalid customization value for ${key}` }
  }

  const customization = candidate as BookingCustomization
  if (customization.loofah === 'VIP_FREE_NEW' && serviceTier !== 3) {
    return { valid: false, error: 'VIP_FREE_NEW loofah is only valid for tier 3 services' }
  }

  return { valid: true, value: normalizeCustomization(customization, serviceTier) }
}
