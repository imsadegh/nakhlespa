import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { auth } from '../src/lib/auth'

const adapter = new PrismaPg(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

function daysFromNow(days: number): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

async function main() {
  // 4 massage room tiers
  const tiers = [
    { nameFa: 'نسیم', descriptionFa: 'غرفه بهار', durationMinutes: 45, price: 700000, color: 'red', symbol: 'circle', tier: 1 },
    { nameFa: 'آفتاب', descriptionFa: 'غرفه تابستان', durationMinutes: 60, price: 850000, color: 'yellow', symbol: 'triangle', tier: 2 },
    { nameFa: 'ارغوان', descriptionFa: 'غرفه پاییز — VIP', durationMinutes: 120, price: 1000000, color: 'purple', symbol: 'quadrilateral', tier: 3 },
    { nameFa: 'باران', descriptionFa: 'غرفه زمستان', durationMinutes: 90, price: 950000, color: 'blue', symbol: 'octagon', tier: 4 },
  ]

  for (const t of tiers) {
    await prisma.service.upsert({
      where: { nameFa: t.nameFa },
      update: t,
      create: t,
    })
  }

  // Standalone consultation service (no tier/color/symbol)
  await prisma.service.upsert({
    where: { nameFa: 'مشاوره' },
    update: { descriptionFa: 'مشاوره تخصصی', durationMinutes: 30, price: 500000, color: null, symbol: null, tier: null },
    create: { nameFa: 'مشاوره', descriptionFa: 'مشاوره تخصصی', durationMinutes: 30, price: 500000, color: null, symbol: null, tier: null },
  })

  // Deactivate old services if they still exist
  await prisma.service.updateMany({
    where: { nameFa: { in: ['ماساژ درمانی', 'ماساژ آرامش‌بخش'] } },
    data: { isActive: false },
  })

  // Remove حمام طهورا from addons if it was previously seeded there
  await prisma.addon.updateMany({
    where: { nameFa: 'حمام طهورا' },
    data: { isActive: false },
  })

  // Standalone bath service
  await prisma.service.upsert({
    where: { nameFa: 'حمام طهورا' },
    update: { descriptionFa: 'حمام طهورا', durationMinutes: 180, price: 200000, color: null, symbol: null, tier: null },
    create: { nameFa: 'حمام طهورا', descriptionFa: 'حمام طهورا', durationMinutes: 180, price: 200000, color: null, symbol: null, tier: null },
  })

  // Add-ons
  await prisma.addon.upsert({
    where: { nameFa: 'نوشیدنی ایوان گلاب' },
    update: { price: 150000, requiresTier: false },
    create: { nameFa: 'نوشیدنی ایوان گلاب', price: 150000, requiresTier: false },
  })

  // Loyalty auto discount code
  await prisma.discountCode.upsert({
    where: { code: 'LOYALTY_AUTO' },
    update: {},
    create: {
      code: 'LOYALTY_AUTO',
      type: 'PERCENT',
      value: 20,
      maxUses: null,
      isActive: true,
    },
  })

  // Gender-separated working hours
  // FEMALE: morning session 08:00–14:30 all days
  // MALE:   afternoon/evening session 15:00–22:00 all days
  const genderHours = [
    { gender: 'FEMALE' as const, openTime: '08:00', closeTime: '14:30' },
    { gender: 'MALE'   as const, openTime: '15:00', closeTime: '22:00' },
  ]

  for (const { gender, openTime, closeTime } of genderHours) {
    for (let i = 0; i < 7; i++) {
      await prisma.workingHours.upsert({
        where: { dayOfWeek_gender: { dayOfWeek: i, gender } },
        update: { openTime, closeTime, isOpen: true },
        create: { dayOfWeek: i, gender, openTime, closeTime, isOpen: true },
      })
    }
  }

  // Sample bookings
  const services = await prisma.service.findMany({ where: { isActive: true } })
  const serviceMap = Object.fromEntries(services.map(s => [s.nameFa, s.id]))

  const sampleBookings = [
    { nameFa: 'نسیم',    customerName: 'علی رضایی',      customerPhone: '09121234567', daysOffset: -5,  startTime: '10:00', endTime: '11:00', status: 'PAID'            as const, refId: '123456781' },
    { nameFa: 'آفتاب',   customerName: 'مریم کریمی',     customerPhone: '09351234568', daysOffset: -3,  startTime: '14:00', endTime: '15:00', status: 'PAID'            as const, refId: '123456782' },
    { nameFa: 'ارغوان',  customerName: 'سارا محمدی',     customerPhone: '09901234569', daysOffset: -1,  startTime: '11:00', endTime: '12:00', status: 'CANCELLED'       as const, refId: null },
    { nameFa: 'باران',   customerName: 'رضا احمدی',      customerPhone: '09151234570', daysOffset:  1,  startTime: '09:00', endTime: '10:00', status: 'PAID'            as const, refId: '123456784' },
    { nameFa: 'نسیم',   customerName: 'فاطمه حسینی',    customerPhone: '09361234571', daysOffset:  2,  startTime: '15:00', endTime: '16:00', status: 'PENDING_PAYMENT' as const, refId: null },
    { nameFa: 'مشاوره', customerName: 'حسین قاسمی',     customerPhone: '09021234572', daysOffset:  3,  startTime: '10:30', endTime: '11:00', status: 'PAID'            as const, refId: '123456786' },
    { nameFa: 'آفتاب',  customerName: 'زهرا موسوی',     customerPhone: '09191234573', daysOffset:  5,  startTime: '13:00', endTime: '14:00', status: 'CONFIRMED'       as const, refId: '123456787' },
    { nameFa: 'ارغوان', customerName: 'محمد صادقی',     customerPhone: '09301234574', daysOffset:  7,  startTime: '16:00', endTime: '17:00', status: 'PAID'            as const, refId: '123456788' },
  ]

  for (const b of sampleBookings) {
    const serviceId = serviceMap[b.nameFa]
    if (!serviceId) continue
    await prisma.booking.upsert({
      where: { token: `seed-token-${b.customerPhone}` },
      update: {},
      create: {
        token:              `seed-token-${b.customerPhone}`,
        serviceId,
        customerName:       b.customerName,
        customerPhone:      b.customerPhone,
        date:               daysFromNow(b.daysOffset),
        startTime:          b.startTime,
        endTime:            b.endTime,
        gender:             'MALE',
        status:             b.status,
        zarinpalRefId:      b.refId,
      },
    })
  }

  // Admin user — idempotent pre-check avoids relying on error message parsing
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  if (adminEmail && adminPassword) {
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } })
    if (existing) {
      console.log('Admin user already exists, skipping')
    } else {
      await auth.api.signUpEmail({
        body: { email: adminEmail, password: adminPassword, name: 'Admin' },
      })
      console.log('Admin user created:', adminEmail)
    }
  } else {
    console.log('ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin user creation')
  }

  console.log('Seeded 4 room tiers, مشاوره, حمام طهورا, 1 add-on, 14 gender-separated working hours, admin user, 8 sample bookings, LOYALTY_AUTO discount code')
}

main().finally(() => prisma.$disconnect())
