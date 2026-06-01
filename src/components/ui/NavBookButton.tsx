'use client'
import { useBookingDialog } from '@/components/booking/BookingDialogProvider'
import { GoldButton } from './GoldButton'

export function NavBookButton() {
  const { open } = useBookingDialog()
  return (
    <GoldButton onClick={open} className="text-xs px-3 py-2 sm:px-4 sm:py-2">رزرو</GoldButton>
  )
}
