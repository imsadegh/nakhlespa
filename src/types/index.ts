import { BookingStatus } from '@prisma/client'

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
  availableCount: number // how many rooms are free at this slot
}

// One person in a group booking
export type Person = {
  serviceId: string
  addonIds: string[]
  customerName: string
  customerPhone: string   // required for person[0] (payer), optional (can be '') for others
  customerNotes: string
}

// Wizard UI state
export type WizardState = {
  persons: Person[]
  date?: string           // "YYYY-MM-DD"
  startTime?: string      // "HH:mm"
  endTime?: string        // "HH:mm"
}

// What Step4 POSTs to /api/bookings/create
export type MultiBookingCreateInput = {
  bookings: {
    serviceId: string
    customerName: string
    customerPhone: string
    customerNotes?: string
    date: string
    startTime: string
    addonIds?: string[]
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
