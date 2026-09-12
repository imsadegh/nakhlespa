'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function PrintHealthFormButton({ bookingId }: { bookingId?: string }) {
  const button = (
    <Button type="button" variant="gold" className="rounded-xl">
      چاپ فرم سلامت
    </Button>
  )

  if (bookingId) {
    return <Link href={`/admin/bookings/${bookingId}/health-form`}>{button}</Link>
  }

  return (
    <Button type="button" variant="gold" className="rounded-xl" onClick={() => window.print()}>
      چاپ فرم سلامت
    </Button>
  )
}
