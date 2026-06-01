export type ServiceDTO = {
  id: string
  nameFa: string
  descriptionFa: string | null
  durationMinutes: number
  price: number
}

export type SlotDTO = {
  startTime: string  // "HH:mm"
  endTime: string    // "HH:mm"
}

export type BookingCreateInput = {
  serviceId: string
  customerName: string
  customerPhone: string
  customerNotes?: string
  date: string        // "YYYY-MM-DD"
  startTime: string   // "HH:mm"
}

export type BookingSummary = {
  id: string
  token: string
  customerName: string
  customerPhone: string
  date: string
  startTime: string
  endTime: string
  status: string
  service: ServiceDTO
  createdAt: string
}
