import { PrismaClient, BookingStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

function daysFromNow(days: number): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

async function seedBookings() {
  const services = await prisma.service.findMany()
  if (services.length === 0) {
    console.log('No services found — skipping booking seed')
    return
  }

  const [svc1, svc2] = services

  const bookings = [
    {
      customerName: 'علی رضایی',
      customerPhone: '09121111111',
      date: daysFromNow(1),
      startTime: '10:00',
      endTime: '11:00',
      status: BookingStatus.PAID,
      serviceId: svc1.id,
      zarinpalRefId: '123456001',
    },
    {
      customerName: 'مریم احمدی',
      customerPhone: '09122222222',
      date: daysFromNow(2),
      startTime: '11:30',
      endTime: '13:00',
      status: BookingStatus.PAID,
      serviceId: svc2.id,
      zarinpalRefId: '123456002',
    },
    {
      customerName: 'حسین کریمی',
      customerPhone: '09123333333',
      date: daysFromNow(3),
      startTime: '14:00',
      endTime: '15:00',
      status: BookingStatus.CONFIRMED,
      serviceId: svc1.id,
      zarinpalRefId: '123456003',
    },
    {
      customerName: 'زهرا محمدی',
      customerPhone: '09124444444',
      date: daysFromNow(-2),
      startTime: '09:00',
      endTime: '10:00',
      status: BookingStatus.PAID,
      serviceId: svc1.id,
      zarinpalRefId: '123456004',
    },
    {
      customerName: 'رضا نوری',
      customerPhone: '09125555555',
      date: daysFromNow(-1),
      startTime: '16:00',
      endTime: '17:30',
      status: BookingStatus.CANCELLED,
      serviceId: svc2.id,
      zarinpalRefId: null,
    },
    {
      customerName: 'فاطمه صادقی',
      customerPhone: '09126666666',
      date: daysFromNow(0),
      startTime: '12:00',
      endTime: '13:00',
      status: BookingStatus.PENDING_PAYMENT,
      serviceId: svc1.id,
      zarinpalRefId: null,
    },
  ]

  for (const b of bookings) {
    await prisma.booking.create({ data: b })
  }

  console.log(`Seeded ${bookings.length} bookings`)
}

async function main() {
  await prisma.service.upsert({
    where: { nameFa: 'ماساژ درمانی' },
    update: { descriptionFa: 'Swedish · Deep Tissue · Sports', durationMinutes: 90, price: 350000 },
    create: { nameFa: 'ماساژ درمانی', descriptionFa: 'Swedish · Deep Tissue · Sports', durationMinutes: 90, price: 350000 },
  })

  await prisma.service.upsert({
    where: { nameFa: 'مشاوره' },
    update: { descriptionFa: 'مشاوره تخصصی', durationMinutes: 30, price: 250000 },
    create: { nameFa: 'مشاوره', descriptionFa: 'مشاوره تخصصی', durationMinutes: 30, price: 250000 },
  })

  // Saturday=0 to Friday=6, open 9am–9pm every day
  for (let i = 0; i < 7; i++) {
    await prisma.workingHours.upsert({
      where: { dayOfWeek: i },
      update: { openTime: '09:00', closeTime: '21:00', isOpen: true },
      create: { dayOfWeek: i, openTime: '09:00', closeTime: '21:00', isOpen: true },
    })
  }

  await seedBookings()
}

main().finally(() => prisma.$disconnect())
