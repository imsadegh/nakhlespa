import type { BookingStatus, Gender } from '@/db/schema'
import type { HealthIntake } from '@/lib/health-intake'

export type { Gender }
export type { HealthIntake } from '@/lib/health-intake'

export type MusicGenre = 'TRADITIONAL' | 'POP' | 'INSTRUMENTAL' | 'RELAXING' | 'CLASSICAL'
export type PressureLevel = 'GENTLE' | 'MEDIUM' | 'FIRM'
export type Soap = 'TRADITIONAL' | 'LUXURY' | 'GOLNAR' | 'SHAMPOO'
export type Loofah = 'PUBLIC' | 'BRINGS_OWN' | 'BUYS_FROM_US' | 'VIP_FREE_NEW'
export type Poultice = 'GENERAL_SEDR_HENNA' | 'PRIVATE_WHEAT_WARM' | 'PRIVATE_BARLEY_COLD'

export type BookingCustomization = {
  musicGenre: MusicGenre
  pressureLevel: PressureLevel
  soap: Soap
  loofah: Loofah
  poultice: Poultice
}

export type CustomizationKey = keyof BookingCustomization

export type CustomizationOption<T extends string = string> = {
  value: T
  label: string
  description: string
  additionalPrice?: number
}

export type CustomizationCatalogDTO = {
  id: string
  category: CustomizationKey
  code: string
  label: string
  description: string
  additionalPrice: number
  requiresTier: number | null
  sortOrder: number
}


export type ServiceDTO = {
  id: string
  nameFa: string
  descriptionFa: string | null
  durationMinutes: number
  price: number
  color: string | null
  symbol: string | null
  tier: number | null
}

export type AddonDTO = {
  id: string
  nameFa: string
  price: number
  requiresTier: boolean
}

export type SlotDTO = {
  startTime: string      // "HH:mm"
  endTime: string        // "HH:mm"
  taken: boolean
  availableCount: number
}

// One person in a group booking
export type Person = {
  serviceId: string
  addonIds: string[]
  customization: BookingCustomization | null
  healthIntake: HealthIntake | null
  customerName: string
  customerPhone: string
  customerNotes: string
}

// Wizard UI state
export type WizardState = {
  gender?: Gender         // set in Step 0, applies to whole group
  persons: Person[]
  date?: string           // "YYYY-MM-DD"
  startTime?: string      // "HH:mm"
  endTime?: string        // "HH:mm"
}

export type MultiBookingCreateInput = {
  bookings: {
    serviceId: string
    customization: BookingCustomization | null
    healthIntake: HealthIntake | null
    customerName: string
    customerPhone: string
    customerNotes?: string
    date: string
    startTime: string
    addonIds?: string[]
    gender: Gender
  }[]
}

export type BookingCreateInput = {
  serviceId: string
  customization: BookingCustomization | null
  healthIntake: HealthIntake | null
  customerName: string
  customerPhone: string
  customerNotes?: string
  date: string            // "YYYY-MM-DD"
  startTime: string       // "HH:mm"
  addonIds?: string[]
  gender: Gender
}

export type BookingSummary = {
  id: string
  token: string
  bookingCode: string
  customerName: string
  customerPhone: string
  date: string
  startTime: string
  endTime: string
  status: BookingStatus
  service: ServiceDTO
  createdAt: string
}

export type DiscountCodeDTO = {
  id: string
  code: string
  type: 'PERCENT' | 'FIXED'
  value: number
  maxUses: number | null
  usedCount: number
  expiresAt: string | null
  isActive: boolean
  createdAt: string
}

export type CustomerBookingDTO = {
  id: string
  token: string
  bookingCode: string
  date: string
  startTime: string
  endTime: string
  status: string
  serviceName: string
  totalPaid: number
  discountAmount: number
  discountCode: string | null
  zarinpalRefId: string | null
}
