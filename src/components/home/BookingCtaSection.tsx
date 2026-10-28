'use client'
import { motion, useReducedMotion } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { BookButton } from '@/components/booking/BookButton'

export function BookingCtaSection() {
  const reducedMotion = useReducedMotion()
  return (
    <motion.section
      className="px-4 sm:px-8 lg:px-16 mb-10"
      initial={{ opacity: 0, y: reducedMotion ? 0 : 24, scale: reducedMotion ? 1 : 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: reducedMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <GlassCard className="relative overflow-hidden border-[rgba(198,165,91,0.28)] p-6 sm:p-10">
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(115deg, color-mix(in srgb, var(--orb-c) 4%, transparent), transparent 48%, color-mix(in srgb, var(--orb-b) 6%, transparent))',
            }}
          />
        </div>
        <div className="relative sm:flex sm:items-center sm:justify-between sm:gap-8">
          <div className="mb-6 sm:mb-0">
            <span className="mb-3 inline-flex rounded-full border border-[#C6A55B]/30 bg-[#C6A55B]/10 px-3 py-1 text-[10px] font-medium text-[#E4C474]">رزرو آنلاین</span>
            <h2 className="text-xl sm:text-2xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>آماده رزرو هستید؟</h2>
            <p className="text-xs sm:text-sm leading-loose font-light" style={{ color: 'var(--text-muted)' }}>
              همین الان نوبت بگیرید — بعد از تأیید، پرداخت آنلاین از طریق زیبال انجام می‌شود.
            </p>
          </div>
          <motion.div whileHover={reducedMotion ? undefined : { y: -2 }} whileTap={reducedMotion ? undefined : { scale: 0.98 }} transition={{ duration: 0.16 }} className="shrink-0">
            <BookButton className="w-full sm:w-auto text-sm py-4 px-8 rounded-[14px]">← رزرو نوبت آنلاین</BookButton>
          </motion.div>
        </div>
      </GlassCard>
    </motion.section>
  )
}
