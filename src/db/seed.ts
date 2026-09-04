import { eq, inArray } from 'drizzle-orm'
import { auth } from '../lib/auth'
import { db } from '../lib/db'
import {
  BookingStatus,
  DiscountType,
  Gender,
  addons,
  bookings,
  discountCodes,
  services,
  user,
  workingHours,
} from './schema'

function daysFromNow(days: number): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

async function seedDatabase() {
  await db.transaction(async tx => {
    const tiers = [
      { nameFa: 'نسیم', descriptionFa: 'غرفه بهار', durationMinutes: 45, price: 700000, color: 'red', symbol: 'circle', tier: 1 },
      { nameFa: 'آفتاب', descriptionFa: 'غرفه تابستان', durationMinutes: 60, price: 850000, color: 'yellow', symbol: 'triangle', tier: 2 },
      { nameFa: 'ارغوان', descriptionFa: 'غرفه پاییز — VIP', durationMinutes: 120, price: 1000000, color: 'purple', symbol: 'quadrilateral', tier: 3 },
      { nameFa: 'باران', descriptionFa: 'غرفه زمستان', durationMinutes: 90, price: 950000, color: 'blue', symbol: 'octagon', tier: 4 },
    ]

    for (const tier of tiers) {
      await tx.insert(services).values(tier).onConflictDoUpdate({
        target: services.nameFa,
        set: tier,
      })
    }

    const consultation = {
      nameFa: 'مشاوره',
      descriptionFa: 'مشاوره تخصصی',
      durationMinutes: 30,
      price: 500000,
      color: null,
      symbol: null,
      tier: null,
    }
    await tx.insert(services).values(consultation).onConflictDoUpdate({
      target: services.nameFa,
      set: consultation,
    })

    await tx
      .update(services)
      .set({ isActive: false })
      .where(inArray(services.nameFa, ['ماساژ درمانی', 'ماساژ آرامش‌بخش']))

    await tx.update(addons).set({ isActive: false }).where(eq(addons.nameFa, 'حمام طهورا'))

    const bath = {
      nameFa: 'حمام طهورا',
      descriptionFa: 'حمام طهورا',
      durationMinutes: 180,
      price: 200000,
      color: null,
      symbol: null,
      tier: null,
    }
    await tx.insert(services).values(bath).onConflictDoUpdate({
      target: services.nameFa,
      set: bath,
    })

    const drink = { nameFa: 'نوشیدنی ایوان گلاب', price: 150000, requiresTier: false }
    await tx.insert(addons).values(drink).onConflictDoUpdate({
      target: addons.nameFa,
      set: { price: drink.price, requiresTier: drink.requiresTier },
    })

    await tx.insert(discountCodes).values({
      code: 'LOYALTY_AUTO',
      type: DiscountType.PERCENT,
      value: 20,
      maxUses: null,
      isActive: true,
    }).onConflictDoUpdate({
      target: discountCodes.code,
      set: { code: 'LOYALTY_AUTO' },
    })

    const genderHours = [
      { gender: Gender.FEMALE, openTime: '08:00', closeTime: '14:30' },
      { gender: Gender.MALE, openTime: '15:00', closeTime: '22:00' },
    ] as const

    for (const { gender, openTime, closeTime } of genderHours) {
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        await tx.insert(workingHours).values({
          dayOfWeek,
          gender,
          openTime,
          closeTime,
          isOpen: true,
        }).onConflictDoUpdate({
          target: [workingHours.dayOfWeek, workingHours.gender],
          set: { openTime, closeTime, isOpen: true },
        })
      }
    }

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
}

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminEmail || !adminPassword) {
    console.log('ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin user creation')
    return
  }

  const existing = await db.select({ id: user.id }).from(user).where(eq(user.email, adminEmail)).limit(1)
  if (existing.length > 0) {
    console.log('Admin user already exists, skipping')
    return
  }

  await auth.api.signUpEmail({
    body: { email: adminEmail, password: adminPassword, name: 'Admin' },
  })
  console.log('Admin user created:', adminEmail)
}

async function main() {
  await seedDatabase()
  await seedAdmin()
  console.log('Seeded 4 room tiers, مشاوره, حمام طهورا, 1 add-on, 14 gender-separated working hours, admin user, 8 sample bookings, LOYALTY_AUTO discount code')
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
