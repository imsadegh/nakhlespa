'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { BookingStatus } from '@prisma/client'

export function BookingActions({ bookingId, currentStatus }: { bookingId: string; currentStatus: BookingStatus }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function updateStatus(status: BookingStatus) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        setError('بروزرسانی ناموفق بود')
        return
      }
      router.refresh()
    } catch {
      setError('خطا در اتصال به سرور')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-destructive text-xs text-center">{error}</p>}
      <div className="flex gap-3">
        {currentStatus !== BookingStatus.CONFIRMED && currentStatus !== BookingStatus.CANCELLED && (
          <Button variant="gold" disabled={loading} onClick={() => updateStatus(BookingStatus.CONFIRMED)} className="flex-1 rounded-xl">
            تأیید رزرو
          </Button>
        )}
        {currentStatus !== BookingStatus.CANCELLED && (
          <Button variant="ghost" disabled={loading} onClick={() => updateStatus(BookingStatus.CANCELLED)} className="flex-1 rounded-xl text-destructive hover:text-destructive">
            لغو رزرو
          </Button>
        )}
      </div>
    </div>
  )
}
