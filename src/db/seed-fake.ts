import { eq } from 'drizzle-orm'
import { db } from '../lib/db'
import { BookingStatus, Gender, bookings, services } from './schema'

function daysFromNow(days: number): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

async function seedFakeData() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Fake data seed cannot run in production')
  }

  await db.transaction(async tx => {
    const seededServices = await tx.select().from(services).where(eq(services.isActive, true))
    const serviceMap = Object.fromEntries(seededServices.map(service => [service.nameFa, service.id]))

    const sampleBookings = [
      { nameFa: 'نسیم', customerName: 'علی رضایی', customerPhone: '09121234567', daysOffset: -5, startTime: '10:00', endTime: '11:00', status: BookingStatus.PAID, refId: '123456781' },
      { nameFa: 'آفتاب', customerName: 'مریم کریمی', customerPhone: '09351234568', daysOffset: -3, startTime: '14:00', endTime: '15:00', status: BookingStatus.PAID, refId: '123456782' },
      { nameFa: 'ارغوان', customerName: 'سارا محمدی', customerPhone: '09901234569', daysOffset: -1, startTime: '11:00', endTime: '12:00', status: BookingStatus.CANCELLED, refId: null },
      { nameFa: 'باران', customerName: 'رضا احمدی', customerPhone: '09151234570', daysOffset: 1, startTime: '09:00', endTime: '10:00', status: BookingStatus.PAID, refId: '123456784' },
      { nameFa: 'نسیم', customerName: 'فاطمه حسینی', customerPhone: '09361234571', daysOffset: 2, startTime: '15:00', endTime: '16:00', status: BookingStatus.PENDING_PAYMENT, refId: null },
      { nameFa: 'مشاوره', customerName: 'حسین قاسمی', customerPhone: '09021234572', daysOffset: 3, startTime: '10:30', endTime: '11:00', status: BookingStatus.PAID, refId: '123456786' },
      { nameFa: 'آفتاب', customerName: 'زهرا موسوی', customerPhone: '09191234573', daysOffset: 5, startTime: '13:00', endTime: '14:00', status: BookingStatus.CONFIRMED, refId: '123456787' },
      { nameFa: 'ارغوان', customerName: 'محمد صادقی', customerPhone: '09301234574', daysOffset: 7, startTime: '16:00', endTime: '17:00', status: BookingStatus.PAID, refId: '123456788' },
    ] as const

    for (const booking of sampleBookings) {
      const serviceId = serviceMap[booking.nameFa]
      if (!serviceId) continue

      const token = `seed-token-${booking.customerPhone}`
      await tx.insert(bookings).values({
        token,
        serviceId,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        date: daysFromNow(booking.daysOffset),
        startTime: booking.startTime,
        endTime: booking.endTime,
        gender: Gender.MALE,
        status: booking.status,
        zarinpalRefId: booking.refId,
      }).onConflictDoUpdate({
        target: bookings.token,
        set: { token },
      })
    }
  })
  console.log('Seeded 8 sample bookings')
}

seedFakeData().catch(error => {
  console.error(error)
  process.exitCode = 1
})
