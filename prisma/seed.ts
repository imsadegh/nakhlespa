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
    { nameFa: 'نسیم', descriptionFa: 'غرفه بهار', durationMinutes: 60, price: 700000, color: 'red', symbol: 'circle', tier: 1 },
    { nameFa: 'آفتاب', descriptionFa: 'غرفه تابستان', durationMinutes: 60, price: 850000, color: 'yellow', symbol: 'triangle', tier: 2 },
    { nameFa: 'ارغوان', descriptionFa: 'غرفه پاییز — VIP', durationMinutes: 60, price: 1000000, color: 'purple', symbol: 'quadrilateral', tier: 3 },
    { nameFa: 'باران', descriptionFa: 'غرفه زمستان', durationMinutes: 60, price: 950000, color: 'blue', symbol: 'octagon', tier: 4 },
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

  // Add-ons
  await prisma.addon.upsert({
    where: { nameFa: 'نوشیدنی ایوان گلاب' },
    update: { price: 150000, requiresTier: false },
    create: { nameFa: 'نوشیدنی ایوان گلاب', price: 150000, requiresTier: false },
  })

  await prisma.addon.upsert({
    where: { nameFa: 'حمام طهورا' },
    update: { price: 200000, requiresTier: true },
    create: { nameFa: 'حمام طهورا', price: 200000, requiresTier: true },
  })

  // Working hours: Saturday=0 to Friday=6, 9am–9pm
  for (let i = 0; i < 7; i++) {
    await prisma.workingHours.upsert({
      where: { dayOfWeek: i },
      update: { openTime: '09:00', closeTime: '21:00', isOpen: true },
      create: { dayOfWeek: i, openTime: '09:00', closeTime: '21:00', isOpen: true },
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

  console.log('Seeded 4 room tiers, مشاوره, 2 add-ons, working hours, admin user')
}

main().finally(() => prisma.$disconnect())
