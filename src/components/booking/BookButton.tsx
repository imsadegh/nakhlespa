'use client'
import { useBookingDialog } from './BookingDialogProvider'
import { GoldButton } from '@/components/ui/GoldButton'
import { cn } from '@/lib/utils'

type Props = { children: React.ReactNode; className?: string }

export function BookButton({ children, className }: Props) {
  const { open } = useBookingDialog()
  return (
    <GoldButton onClick={open} className={cn(className)}>
      {children}
    </GoldButton>
  )
}
