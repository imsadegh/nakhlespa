import { eq } from 'drizzle-orm'
import { services } from '@/db/schema'
import { db } from '@/lib/db'
import GradientWaves from '@/components/ui/GradientWaves'
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
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <GradientWaves
          horizonColor="#e8dfcf"
          waveColor="#b5d5c0"
          crestColor="#d4b368"
          speed={0.24}
          amplitude={1.8}
          waveScale={0.55}
          waveRatio={0.9}
          swell={35}
          turbulence={20}
          tilt={1.11}
          zoom={1}
          height={5.5}
          fogDepth={15}
          detail="medium"
          brightness={0.72}
          opacity={0.48}
          mouseInteraction
          parallaxStrength={0.25}
          grain
          grainIntensity={0.025}
        />
      </div>
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
