'use client'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { BookButton } from '@/components/booking/BookButton'

export function BookingCtaSection() {
  return (
    <motion.section
      className="px-4 sm:px-8 lg:px-16 mb-10"
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <GlassCard className="p-7 sm:p-10 relative">
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[rgba(198,165,91,0.18)] blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-[rgba(31,94,70,0.25)] blur-2xl" />
        </div>
        <div className="relative sm:flex sm:items-center sm:justify-between sm:gap-8">
          <div className="mb-6 sm:mb-0">
            <h2 className="text-xl sm:text-2xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>آماده رزرو هستید؟</h2>
            <p className="text-xs sm:text-sm leading-loose font-light" style={{ color: 'var(--text-muted)' }}>
              همین الان نوبت بگیرید — بعد از تأیید، پرداخت آنلاین از طریق زرین‌پال انجام می‌شود.
            </p>
          </div>
          <BookButton className="w-full sm:w-auto text-sm py-4 px-8 rounded-[14px] flex-shrink-0">← رزرو نوبت آنلاین</BookButton>
        </div>
      </GlassCard>
    </motion.section>
  )
}
