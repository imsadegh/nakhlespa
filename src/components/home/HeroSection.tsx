'use client'
import { motion } from 'framer-motion'
import { BookButton } from '@/components/booking/BookButton'
import { GhostButton } from '@/components/ui/GhostButton'
import { GlassCard } from '@/components/ui/GlassCard'

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }

export function HeroSection() {
  return (
    <section className="px-4 sm:px-8 lg:px-16 pt-14 pb-10">
      <motion.div
        initial="hidden" animate="show"
        variants={{ show: { transition: { staggerChildren: 0.1 } } }}
        className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center"
      >
        <div>
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full text-[13px] tracking-[2px] text-[#C6A55B] bg-[rgba(198,165,91,0.08)] border border-[rgba(198,165,91,0.22)] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C6A55B] animate-pulse" />
            ماساژ و آرامش
          </motion.div>

          <motion.h1 variants={fadeUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-light leading-relaxed tracking-tight mb-4"
            style={{ color: 'var(--text-primary)' }}>
            لحظه‌ای برای{' '}
            <span className="font-bold bg-gradient-to-r from-[#C6A55B] via-[#e8c87a] to-[#A8873A] bg-[length:200%] text-transparent bg-clip-text [animation:shimmer_4s_linear_infinite]">
              خودت
            </span>{' '}
            باش
          </motion.h1>

          <motion.p variants={fadeUp}
            className="text-sm sm:text-base font-light leading-loose mb-8 max-w-md"
            style={{ color: 'var(--text-muted)' }}>
            ماساژ تخصصی درمانی و آرامش‌بخش با بهترین متخصصان — در فضایی آرام و انحصاری
          </motion.p>

          <motion.div variants={fadeUp} className="flex gap-3 mb-10 flex-wrap">
            <BookButton className="py-2.5">← رزرو آنلاین</BookButton>
            <GhostButton className="py-2.5">مشاهده خدمات</GhostButton>
          </motion.div>
        </div>

        <motion.div variants={fadeUp} className="flex gap-2 sm:gap-4 lg:flex-col xl:flex-row">
          {[['۵۰۰+', 'مشتری راضی'], ['۱۰+', 'سال تجربه'], ['۲۴/۷', 'رزرو آنلاین']].map(([num, lbl]) => (
            <GlassCard key={lbl} className="flex-1 py-4 px-2 sm:px-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-[#C6A55B] mb-1">{num}</div>
              <div className="tracking-wide" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>{lbl}</div>
            </GlassCard>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
