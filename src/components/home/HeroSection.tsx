'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { GoldButton } from '@/components/ui/GoldButton'
import { GhostButton } from '@/components/ui/GhostButton'
import { GlassCard } from '@/components/ui/GlassCard'

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }

export function HeroSection() {
  return (
    <section className="px-6 pt-14 pb-8">
      <motion.div
        initial="hidden" animate="show"
        variants={{ show: { transition: { staggerChildren: 0.1 } } }}
      >
        <motion.div variants={fadeUp} className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full text-[9px] tracking-[3.5px] text-[#C6A55B] bg-[rgba(198,165,91,0.08)] border border-[rgba(198,165,91,0.22)] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C6A55B] animate-pulse" />
          SPA &amp; WELLNESS
        </motion.div>

        <motion.h1 variants={fadeUp} className="text-4xl font-light leading-relaxed text-[#F3EFE8] mb-4 tracking-tight">
          لحظه‌ای برای{' '}
          <span className="font-bold bg-gradient-to-r from-[#C6A55B] via-[#e8c87a] to-[#A8873A] bg-[length:200%] text-transparent bg-clip-text [animation:shimmer_4s_linear_infinite]">
            خودت
          </span>{' '}
          باش
        </motion.h1>

        <motion.p variants={fadeUp} className="text-sm font-light text-[#F3EFE8]/50 leading-loose mb-8 max-w-xs">
          ماساژ تخصصی درمانی و آرامش‌بخش با بهترین متخصصان — در فضایی آرام و انحصاری
        </motion.p>

        <motion.div variants={fadeUp} className="flex gap-3 mb-10 flex-wrap">
          <Link href="/book"><GoldButton>← رزرو آنلاین</GoldButton></Link>
          <GhostButton>مشاهده خدمات</GhostButton>
        </motion.div>

        <motion.div variants={fadeUp} className="flex gap-2">
          {[['۵۰۰+', 'مشتری راضی'], ['۱۰+', 'سال تجربه'], ['۲۴/۷', 'رزرو آنلاین']].map(([num, lbl]) => (
            <GlassCard key={lbl} className="flex-1 py-3 px-2 text-center">
              <div className="text-xl font-bold text-[#C6A55B] mb-1">{num}</div>
              <div className="text-[8px] text-[#F3EFE8]/40 tracking-wide">{lbl}</div>
            </GlassCard>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
