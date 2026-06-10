'use client'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'

const steps = [
  { n: '۱', title: 'انتخاب خدمت', desc: 'ماساژ درمانی یا آرامش‌بخش را انتخاب کنید' },
  { n: '۲', title: 'انتخاب زمان', desc: 'تاریخ و ساعت مناسب را از تقویم شمسی انتخاب کنید' },
  { n: '۳', title: 'پرداخت آنلاین', desc: 'پرداخت امن از طریق زرین‌پال و دریافت تأییدیه SMS' },
]

export function HowItWorksSection() {
  return (
    <section id="how" className="px-4 sm:px-8 lg:px-16 mb-10">
      <motion.p
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        className="tracking-[3px] mb-4 font-light"
        style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}
      >
        — چطور کار می‌کند
      </motion.p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.12 }}
          >
            <GlassCard className="flex sm:flex-col items-start sm:items-center sm:text-center gap-4 sm:gap-3 p-4 sm:p-6 h-full">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-[#0F3D2E] bg-gradient-to-br from-[#C6A55B] to-[#A8873A] flex-shrink-0 shadow-[0_4px_12px_rgba(198,165,91,0.3)]">
                {s.n}
              </div>
              <div>
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
