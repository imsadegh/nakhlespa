import { eq } from 'drizzle-orm'
import { services } from '@/db/schema'
import { db } from '@/lib/db'
import { AmbientBackground } from '@/components/ui/AmbientBackground'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { HeroSection } from '@/components/home/HeroSection'
import { ServicesSection } from '@/components/home/ServicesSection'
import { HowItWorksSection } from '@/components/home/HowItWorksSection'
import { BookingCtaSection } from '@/components/home/BookingCtaSection'
import { BookingDialogProvider } from '@/components/booking/BookingDialogProvider'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
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
    <BookingDialogProvider services={serviceDTOs}>
      <AmbientBackground />
      <div className="relative z-10 min-h-screen">
        <Navbar />
        <main className="mx-auto w-full max-w-screen-xl pt-20">
          <HeroSection />
          <ServicesSection services={serviceDTOs} />
          <HowItWorksSection />
          <BookingCtaSection />
        </main>
        <Footer />
      </div>
    </BookingDialogProvider>
  )
}
