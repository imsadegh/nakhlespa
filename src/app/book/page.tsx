import { services } from '@/db/schema'
import { db } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { AmbientBackground } from '@/components/ui/AmbientBackground'
import { Navbar } from '@/components/ui/Navbar'
import { BookingWizard } from '@/components/booking/BookingWizard'

export const dynamic = 'force-dynamic'

export default async function BookPage() {
  const serviceRows = await db.select().from(services).where(eq(services.isActive, true))
  const serviceDTOs = serviceRows.map(s => ({
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
