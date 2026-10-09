import { db } from '@/lib/db'
import { bookings } from '@/db/schema'
import { desc } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { columns, type BookingRow } from './columns'
import { BookingsDataTable } from './data-table'

export const dynamic = 'force-dynamic'

function toFaDate(date: Date) {
  return new Date(date.toISOString().split('T')[0] + 'T12:00:00').toLocaleDateString('fa-IR')
}

export default async function BookingsPage() {
  const cookieStore = await cookies()
  let columnVisibility: Record<string, boolean> = {}
  try {
    const savedVisibility = cookieStore.get('admin-bookings-column-visibility')?.value
    if (savedVisibility) {
      const parsed = JSON.parse(decodeURIComponent(savedVisibility)) as Record<string, unknown>
      for (const id of ['bookedAt', 'date', 'customerName', 'serviceNameFa', 'status']) {
        if (typeof parsed[id] === 'boolean') columnVisibility[id] = parsed[id]
      }
    }
  } catch {
    // Ignore malformed browser preferences and use the default visible columns.
  }

  const bookingRows = await db.query.bookings.findMany({
    with: { service: true, addons: { with: { addon: true } }, customizations: true, discountCode: true },
    orderBy: desc(bookings.createdAt),
  })

  const rows: BookingRow[] = bookingRows.map(b => ({
    id: b.id,
    bookingCode: b.bookingCode,
    bookedAt: b.createdAt.getTime(),
    date: toFaDate(b.date),
    startTime: b.startTime,
    endTime: b.endTime,
    customerName: b.customerName,
    customerPhone: b.customerPhone,
    serviceNameFa: b.service.nameFa,
    servicePrice: b.service.price,
    addonsPricePaid: b.addonsPricePaid,
    addons: b.addons.map(ba => ({ nameFa: ba.addon.nameFa, pricePaid: ba.pricePaid })),
    customizations: b.customizations.map(item => ({ labelSnapshot: item.labelSnapshot, pricePaid: item.pricePaid })),
    status: b.status,
    notes: b.customerNotes,
    refId: b.zarinpalRefId,
    gender: b.gender,
    discountAmount: b.discountAmount,
    discountCode: b.discountCode ? { code: b.discountCode.code } : null,
    customization: b.customization,
    healthIntake: b.healthIntake,
  }))

  return (
    <div>
      <h1 className="text-xl font-light mb-6" style={{ color: 'var(--text-primary)' }}>رزروها</h1>
      <BookingsDataTable columns={columns} data={rows} initialColumnVisibility={columnVisibility} />
    </div>
  )
}
