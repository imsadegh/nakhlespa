'use client'
import { motion, useReducedMotion } from 'framer-motion'
import { BookButton } from '@/components/booking/BookButton'
import { GhostButton } from '@/components/ui/GhostButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { CalendarDays, Award, UsersRound, type LucideIcon } from 'lucide-react'

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }
const stats: { value: string; label: string; icon: LucideIcon; color: string }[] = [
  { value: '۵۰۰+', label: 'مشتری راضی', icon: UsersRound, color: '#38BDF8' },
  { value: '۱۰+', label: 'سال تجربه', icon: Award, color: '#A78BFA' },
  { value: '۲۴/۷', label: 'رزرو آنلاین', icon: CalendarDays, color: '#34D399' },
]

export function HeroSection() {
  const reducedMotion = useReducedMotion()
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

        <motion.div
          variants={{
            hidden: { opacity: 0, y: reducedMotion ? 0 : 20 },
            show: { opacity: 1, y: 0, transition: { duration: reducedMotion ? 0 : 0.45, staggerChildren: reducedMotion ? 0 : 0.08 } },
          }}
          className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-1 xl:grid-cols-3"
        >
          {stats.map(({ value, label, icon: Icon, color }) => (
            <motion.div key={label} variants={fadeUp} whileHover={reducedMotion ? undefined : { y: -3 }} transition={{ duration: 0.18 }}>
              <GlassCard className="relative flex h-full min-h-28 flex-col items-center justify-center gap-2 overflow-hidden px-2 py-3 text-center sm:min-h-32 sm:px-4">
                <div aria-hidden="true" className="absolute -top-6 size-20 rounded-full opacity-[0.08] blur-2xl" style={{ backgroundColor: color }} />
                <Icon aria-hidden="true" size={18} strokeWidth={1.8} style={{ color }} />
                <div className="text-xl font-bold leading-none sm:text-2xl" style={{ color }}>{value}</div>
                <div className="text-[10px] tracking-wide sm:text-xs" style={{ color: 'var(--text-faint)' }}>{label}</div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
