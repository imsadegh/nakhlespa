import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BookingStatus, bookings } from '@/db/schema'
import { db } from '@/lib/db'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { getCustomerSessionFromCookies } from '@/lib/customer-auth'
import { AmbientBackground } from '@/components/ui/AmbientBackground'
import { BookingHistoryList } from '@/components/customer/BookingHistoryList'

export default async function MyBookingsPage() {
  const session = await getCustomerSessionFromCookies()
  if (!session) notFound()

  const allBookings = await db.query.bookings.findMany({
    where: and(
      eq(bookings.customerPhone, session.phone),
      inArray(bookings.status, [BookingStatus.PAID, BookingStatus.CONFIRMED, BookingStatus.CANCELLED]),
    ),
    with: { service: true, addons: { with: { addon: true } }, discountCode: true },
    orderBy: desc(bookings.date),
  })

  const completedCount = allBookings.filter(
    b => b.status === BookingStatus.PAID || b.status === BookingStatus.CONFIRMED
  ).length

  return (
    <>
      <AmbientBackground />
      <div className="relative z-10 min-h-screen px-6 py-10">
        <div className="max-w-lg mx-auto mb-6 flex items-center justify-between">
          <h1 className="text-lg font-light" style={{ color: 'var(--text-primary)' }}>
            رزروهای من
          </h1>
          <form action="/api/customer/auth/logout" method="POST">
            <button
              type="submit"
              className="text-xs underline"
              style={{ color: 'var(--text-muted)' }}
            >
              خروج
            </button>
          </form>
        </div>
        <BookingHistoryList bookings={allBookings} completedCount={completedCount} />
        <div className="max-w-lg mx-auto mt-6 text-center">
          <Link href="/" className="text-xs underline" style={{ color: 'var(--text-muted)' }}>
            بازگشت به خانه
          </Link>
        </div>
      </div>
    </>
  )
}
