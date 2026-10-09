'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

function fillPrintDate() {
  const printDate = new Date().toLocaleDateString('fa-IR')
  document.querySelectorAll<HTMLElement>('[data-print-date]').forEach(element => {
    element.textContent = printDate
  })
}

export function PrintHealthFormButton({ bookingId, className }: { bookingId?: string; className?: string }) {
  useEffect(() => {
    if (!bookingId) fillPrintDate()
  }, [bookingId])

  const button = (
    <Button type="button" variant="gold" className={`rounded-xl ${className ?? ''}`}>
      چاپ فرم سلامت
    </Button>
  )

  if (bookingId) {
    return <Link href={`/admin/bookings/${bookingId}/health-form`}>{button}</Link>
  }

  return (
    <Button
      type="button"
      variant="gold"
      className="rounded-xl"
      onClick={() => {
        fillPrintDate()
        window.print()
      }}
    >
      چاپ فرم سلامت
    </Button>
  )
}
