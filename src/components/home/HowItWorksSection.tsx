'use client'
import { motion, useReducedMotion } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'

const steps = [
  { n: '۱', title: 'انتخاب خدمت', desc: 'ماساژ درمانی یا آرامش‌بخش را انتخاب کنید', color: '#38BDF8' },
  { n: '۲', title: 'انتخاب زمان', desc: 'تاریخ و ساعت مناسب را از تقویم شمسی انتخاب کنید', color: '#A78BFA' },
  { n: '۳', title: 'پرداخت آنلاین', desc: 'پرداخت امن از طریق زرین‌پال و دریافت تأییدیه SMS', color: '#34D399' },
]

export function HowItWorksSection() {
  const reducedMotion = useReducedMotion()
  return (
    <section id="how" className="px-4 sm:px-8 lg:px-16 mb-10">
      <motion.p
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        className="tracking-[3px] mb-4 font-light"
        style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}
      >
        — چطور کار می‌کند
      </motion.p>
      <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: reducedMotion ? 0 : 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: reducedMotion ? 0 : 0.42, delay: reducedMotion ? 0 : i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            whileHover={reducedMotion ? undefined : { y: -4 }}
          >
            <GlassCard className="relative flex h-full items-start gap-4 overflow-hidden p-4 transition-colors hover:border-white/20 sm:flex-col sm:items-center sm:gap-3 sm:p-6 sm:text-center">
              <div aria-hidden="true" className="absolute -bottom-12 -left-10 size-28 rounded-full opacity-[0.08] blur-3xl" style={{ backgroundColor: s.color }} />
              <div className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold" style={{ color: s.color, borderColor: `${s.color}55`, backgroundColor: `${s.color}18`, boxShadow: `0 4px 16px ${s.color}35` }}>
                {s.n}
              </div>
              <div className="relative z-10">
                <h4 className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{s.title}</h4>
                <p className="text-[10px] sm:text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{s.desc}</p>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
