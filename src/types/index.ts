import { BookingStatus } from '@prisma/client'

export type Gender = 'FEMALE' | 'MALE'

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
  customerName: string
  customerPhone: string
  date: string
  startTime: string
  endTime: string
  status: BookingStatus
  service: ServiceDTO
  createdAt: string
}
