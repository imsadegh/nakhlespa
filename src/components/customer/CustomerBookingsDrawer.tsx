'use client'

import { useState } from 'react'
import { BookingHistoryList } from '@/components/customer/BookingHistoryList'
import { OtpLoginForm } from '@/components/customer/OtpLoginForm'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

type DrawerBookings = React.ComponentProps<typeof BookingHistoryList>['bookings']

export function CustomerBookingsDrawer() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [bookings, setBookings] = useState<DrawerBookings | null>(null)
  const [completedCount, setCompletedCount] = useState(0)

  async function loadBookings() {
    setLoading(true)
    try {
      const response = await fetch('/api/customer/bookings')
      if (!response.ok) {
        setBookings(null)
        return
      }
      const data = await response.json() as { bookings: DrawerBookings; completedCount: number }
      setBookings(data.bookings)
      setCompletedCount(data.completedCount)
    } finally {
      setLoading(false)
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen) void loadBookings()
  }

  async function handleLogout() {
    setLoading(true)
    try {
      await fetch('/api/customer/auth/logout', { method: 'POST' })
      setBookings(null)
      setCompletedCount(0)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden text-xs transition-colors hover:text-[#C6A55B] sm:block"
        style={{ color: 'var(--text-muted)' }}
      >
        رزروهای من
      </button>
      <DrawerContent className="max-h-[90dvh]">
        <DrawerHeader className="text-right sm:text-right">
          <DrawerTitle>رزروهای من</DrawerTitle>
          <DrawerDescription>رزروهای ثبت‌شده خود را مشاهده کنید</DrawerDescription>
        </DrawerHeader>
        <div className="mx-auto min-h-0 w-full max-w-2xl overflow-y-auto px-4 pb-5 pt-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">در حال دریافت اطلاعات...</p>
          ) : bookings ? (
            <BookingHistoryList bookings={bookings} completedCount={completedCount} />
          ) : (
            <OtpLoginForm compact onAuthenticated={() => void loadBookings()} />
          )}
          {bookings && (
            <Button type="button" variant="ghost" onClick={handleLogout} className="mt-5 w-full text-xs text-destructive hover:text-destructive">
              خروج از حساب کاربری
            </Button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
