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
    <section id="how" className="px-6 mb-8">
      <motion.p
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        className="text-[10px] tracking-[3px] text-[#F3EFE8]/30 mb-3 font-light"
      >
        — چطور کار می‌کند
      </motion.p>
      <div className="flex flex-col gap-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.12 }}
          >
            <GlassCard className="flex items-center gap-4 p-4">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-[#0F3D2E] bg-gradient-to-br from-[#C6A55B] to-[#A8873A] flex-shrink-0 shadow-[0_4px_12px_rgba(198,165,91,0.3)]">
                {s.n}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#F3EFE8] mb-0.5">{s.title}</h4>
                <p className="text-[10px] text-[#F3EFE8]/40">{s.desc}</p>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
