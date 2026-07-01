import { prisma } from '@/lib/prisma'
import { columns, type BookingRow } from './columns'
import { BookingsDataTable } from './data-table'

export const dynamic = 'force-dynamic'

function toFaDate(date: Date) {
  return new Date(date.toISOString().split('T')[0] + 'T12:00:00').toLocaleDateString('fa-IR')
}

export default async function BookingsPage() {
  const bookings = await prisma.booking.findMany({
    include: { service: true, addons: { include: { addon: true } }, discountCode: true },
    orderBy: { createdAt: 'desc' },
  })

  const rows: BookingRow[] = bookings.map(b => ({
    id: b.id,
    date: toFaDate(b.date),
    startTime: b.startTime,
    endTime: b.endTime,
    customerName: b.customerName,
    customerPhone: b.customerPhone,
    serviceNameFa: b.service.nameFa,
    servicePrice: b.service.price,
    addonsPricePaid: b.addonsPricePaid,
    addons: b.addons.map(ba => ({ nameFa: ba.addon.nameFa, pricePaid: ba.pricePaid })),
    status: b.status,
    notes: b.customerNotes,
    refId: b.zarinpalRefId,
    gender: b.gender,
    discountAmount: b.discountAmount,
    discountCode: b.discountCode ? { code: b.discountCode.code } : null,
  }))

  return (
    <div>
      <h1 className="text-xl font-light mb-6" style={{ color: 'var(--text-primary)' }}>رزروها</h1>
      <BookingsDataTable columns={columns} data={rows} />
    </div>
  )
}
