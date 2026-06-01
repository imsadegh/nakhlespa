import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.service.createMany({
    data: [
      { nameFa: 'ماساژ درمانی', descriptionFa: 'Swedish · Deep Tissue · Sports', durationMinutes: 60, price: 350000 },
      { nameFa: 'ماساژ آرامش‌بخش', descriptionFa: 'Aromatherapy · Hot Stone · Luxury', durationMinutes: 90, price: 450000 },
    ],
  })

  // Saturday=0 to Friday=6, open 9am–9pm every day
  await prisma.workingHours.createMany({
    data: Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      openTime: '09:00',
      closeTime: '21:00',
      isOpen: true,
    })),
  })
}

main().finally(() => prisma.$disconnect())
