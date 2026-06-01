import { prisma } from '@/lib/prisma'
import { AmbientBackground } from '@/components/ui/AmbientBackground'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { HeroSection } from '@/components/home/HeroSection'
import { ServicesSection } from '@/components/home/ServicesSection'
import { HowItWorksSection } from '@/components/home/HowItWorksSection'
import { BookingCtaSection } from '@/components/home/BookingCtaSection'

export default async function HomePage() {
  const services = await prisma.service.findMany({ where: { isActive: true } })
  const serviceDTOs = services.map(s => ({
    id: s.id,
    nameFa: s.nameFa,
    descriptionFa: s.descriptionFa,
    durationMinutes: s.durationMinutes,
    price: s.price,
  }))
  return (
    <>
      <AmbientBackground />
      <div className="relative z-10 min-h-screen">
        <Navbar />
        <main className="mx-auto w-full max-w-screen-xl">
          <HeroSection />
          <ServicesSection services={serviceDTOs} />
          <HowItWorksSection />
          <BookingCtaSection />
        </main>
        <Footer />
      </div>
    </>
  )
}
