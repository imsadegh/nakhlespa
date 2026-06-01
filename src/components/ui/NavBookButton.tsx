'use client'
import { useRouter } from 'next/navigation'
import { useBookingDialog } from '@/components/booking/BookingDialogProvider'
import { GoldButton } from './GoldButton'

export function NavBookButton() {
  const { open, available } = useBookingDialog()
  const router = useRouter()
  const handleClick = () => available ? open() : router.push('/book')
  return (
    <GoldButton onClick={handleClick} className="text-xs px-3 py-2 sm:px-4 sm:py-2">رزرو</GoldButton>
  )
}
