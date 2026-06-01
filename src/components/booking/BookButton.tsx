'use client'
import { useRouter } from 'next/navigation'
import { useBookingDialog } from './BookingDialogProvider'
import { GoldButton } from '@/components/ui/GoldButton'
import { cn } from '@/lib/utils'

type Props = { children: React.ReactNode; className?: string }

export function BookButton({ children, className }: Props) {
  const { open, available } = useBookingDialog()
  const router = useRouter()
  const handleClick = () => available ? open() : router.push('/book')
  return (
    <GoldButton onClick={handleClick} className={cn(className)}>
      {children}
    </GoldButton>
  )
}
