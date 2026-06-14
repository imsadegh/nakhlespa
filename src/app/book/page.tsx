import { prisma } from '@/lib/prisma'
import { AmbientBackground } from '@/components/ui/AmbientBackground'
import { Navbar } from '@/components/ui/Navbar'
import { BookingWizard } from '@/components/booking/BookingWizard'

export default async function BookPage() {
  const services = await prisma.service.findMany({ where: { isActive: true } })
  const serviceDTOs = services.map(s => ({
    id: s.id,
    nameFa: s.nameFa,
    descriptionFa: s.descriptionFa,
    durationMinutes: s.durationMinutes,
    price: s.price,
    color: s.color,
    symbol: s.symbol,
    tier: s.tier,
  }))
  return (
    <>
      <AmbientBackground />
      <div className="relative z-10 max-w-lg mx-auto min-h-screen">
        <Navbar />
        <BookingWizard services={serviceDTOs} />
      </div>
    </>
  )
}
