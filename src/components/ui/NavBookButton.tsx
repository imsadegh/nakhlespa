'use client'
import { useRouter } from 'next/navigation'
import { useBookingDialog } from '@/components/booking/BookingDialogProvider'
import { GoldButton } from './GoldButton'

export function NavBookButton() {
  const { open, available } = useBookingDialog()
  const router = useRouter()
  const handleClick = () => available ? open() : router.push('/book')
  return (
    <GoldButton onClick={handleClick} className="h-10 px-3 py-0 text-xs sm:px-4">رزرو</GoldButton>
  )
}
