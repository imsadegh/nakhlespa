'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GoldButton } from '@/components/ui/GoldButton'
import { GhostButton } from '@/components/ui/GhostButton'
import { BookingStatus } from '@prisma/client'

export function BookingActions({ bookingId, currentStatus }: { bookingId: string; currentStatus: BookingStatus }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function updateStatus(status: BookingStatus) {
    setLoading(true)
    try {
      await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-3">
      {currentStatus !== BookingStatus.CONFIRMED && currentStatus !== BookingStatus.CANCELLED && (
        <GoldButton disabled={loading} onClick={() => updateStatus(BookingStatus.CONFIRMED)} className="flex-1">
          تأیید رزرو
        </GoldButton>
      )}
      {currentStatus !== BookingStatus.CANCELLED && (
        <GhostButton disabled={loading} onClick={() => updateStatus(BookingStatus.CANCELLED)} className="flex-1 text-red-400">
          لغو رزرو
        </GhostButton>
      )}
    </div>
  )
}
