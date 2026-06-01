import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.service.upsert({
    where: { nameFa: 'ماساژ درمانی' },
    update: { descriptionFa: 'Swedish · Deep Tissue · Sports', durationMinutes: 60, price: 350000 },
    create: { nameFa: 'ماساژ درمانی', descriptionFa: 'Swedish · Deep Tissue · Sports', durationMinutes: 60, price: 350000 },
  })

  await prisma.service.upsert({
    where: { nameFa: 'ماساژ آرامش‌بخش' },
    update: { descriptionFa: 'Aromatherapy · Hot Stone · Luxury', durationMinutes: 90, price: 450000 },
    create: { nameFa: 'ماساژ آرامش‌بخش', descriptionFa: 'Aromatherapy · Hot Stone · Luxury', durationMinutes: 90, price: 450000 },
  })

  // Saturday=0 to Friday=6, open 9am–9pm every day
  for (let i = 0; i < 7; i++) {
    await prisma.workingHours.upsert({
      where: { dayOfWeek: i },
      update: { openTime: '09:00', closeTime: '21:00', isOpen: true },
      create: { dayOfWeek: i, openTime: '09:00', closeTime: '21:00', isOpen: true },
    })
  }
}

main().finally(() => prisma.$disconnect())
