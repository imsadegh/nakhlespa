export const BookingStatus = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PAID: 'PAID',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
} as const

export type BookingStatusValue = (typeof BookingStatus)[keyof typeof BookingStatus]
