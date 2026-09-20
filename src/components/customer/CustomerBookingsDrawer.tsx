'use client'

import { useState } from 'react'
import { BookingHistoryList, type FullBooking } from '@/components/customer/BookingHistoryList'
import { OtpLoginForm } from '@/components/customer/OtpLoginForm'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/GlassCard'
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
  const [selectedBooking, setSelectedBooking] = useState<FullBooking | null>(null)

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
      setSelectedBooking(null)
    } finally {
      setLoading(false)
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen) void loadBookings()
    else setSelectedBooking(null)
  }

  async function handleLogout() {
    setLoading(true)
    try {
      await fetch('/api/customer/auth/logout', { method: 'POST' })
      setBookings(null)
      setCompletedCount(0)
      setSelectedBooking(null)
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
          ) : bookings && selectedBooking ? (
            <BookingDetail booking={selectedBooking} onBack={() => setSelectedBooking(null)} />
          ) : bookings ? (
            <BookingHistoryList
              bookings={bookings}
              completedCount={completedCount}
              onBookingSelect={setSelectedBooking}
            />
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

function BookingDetail({
  booking,
  onBack,
}: {
  booking: FullBooking
  onBack: () => void
}) {
  const date = booking.date instanceof Date ? booking.date : new Date(booking.date)
  const dateFa = new Date(date.toISOString().split('T')[0] + 'T12:00:00').toLocaleDateString('fa-IR')
  const totalPaid = booking.service.price + booking.addonsPricePaid - booking.discountAmount

  return (
    <div className="mx-auto w-full max-w-lg">
      <Button type="button" variant="ghost" size="sm" onClick={onBack} className="mb-3 text-xs">
        ← بازگشت به رزروها
      </Button>
      <GlassCard className="space-y-4 p-4 text-right">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>خدمت</p>
            <h3 className="mt-1 text-base font-medium" style={{ color: 'var(--text-primary)' }}>
              {booking.service.nameFa}
            </h3>
          </div>
          <span className="text-xs text-emerald-400">{STATUS_LABELS[booking.status]}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <DetailRow label="کد رزرو" value={booking.bookingCode} />
          <DetailRow label="تاریخ" value={dateFa} />
          <DetailRow label="ساعت" value={booking.endTime ? `${booking.startTime} تا ${booking.endTime}` : booking.startTime} />
        </div>

        {!!booking.addons?.length && (
          <div className="border-t border-black/10 pt-3">
            <p className="mb-2 text-xs" style={{ color: 'var(--text-muted)' }}>خدمات افزوده</p>
            <div className="space-y-2 text-sm">
              {booking.addons.map(addon => (
                <div key={addon.id} className="flex justify-between gap-3">
                  <span>{addon.addon.nameFa}</span>
                  <span className="text-[#C6A55B]">{addon.pricePaid.toLocaleString('fa-IR')} تومان</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {booking.discountAmount > 0 && (
          <DetailRow label="تخفیف" value={`−${booking.discountAmount.toLocaleString('fa-IR')} تومان`} />
        )}
        <div className="flex justify-between border-t border-black/10 pt-3 text-sm font-semibold">
          <span>مبلغ پرداخت‌شده</span>
          <span className="text-[#C6A55B]">{totalPaid.toLocaleString('fa-IR')} تومان</span>
        </div>
        {booking.zarinpalRefId && <DetailRow label="کد پیگیری پرداخت" value={booking.zarinpalRefId} />}
      </GlassCard>
    </div>
  )
}

const STATUS_LABELS: Record<FullBooking['status'], string> = {
  PAID: 'پرداخت شده',
  CONFIRMED: 'تأیید شده',
  CANCELLED: 'لغو شده',
  PENDING_PAYMENT: 'در انتظار پرداخت',
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}
