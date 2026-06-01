'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'

export function BookingCtaSection() {
  return (
    <motion.section
      className="px-6 mb-8"
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <GlassCard className="p-7 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[rgba(198,165,91,0.18)] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-[rgba(31,94,70,0.25)] blur-2xl pointer-events-none" />
        <h2 className="text-xl font-semibold text-[#F3EFE8] mb-2 relative">آماده رزرو هستید؟</h2>
        <p className="text-xs text-[#F3EFE8]/45 leading-loose mb-6 relative font-light">
          همین الان نوبت بگیرید — بعد از تأیید، پرداخت آنلاین از طریق زرین‌پال انجام می‌شود.
        </p>
        <Link href="/book" className="block relative">
          <GoldButton className="w-full text-sm py-4 rounded-[14px]">← رزرو نوبت آنلاین</GoldButton>
        </Link>
      </GlassCard>
    </motion.section>
  )
}
