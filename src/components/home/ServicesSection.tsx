'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { GlassCard } from '@/components/ui/GlassCard'
import type { ServiceDTO } from '@/types'

const icons: Record<string, string> = { 'ماساژ درمانی': '💆', 'ماساژ آرامش‌بخش': '🌿' }

export function ServicesSection({ services }: { services: ServiceDTO[] }) {
  return (
    <section id="services" className="px-6 mb-8">
      <motion.p
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        className="text-[10px] tracking-[3px] text-[#F3EFE8]/30 mb-3 font-light"
      >
        — خدمات ما
      </motion.p>
      <div className="flex flex-col gap-3">
        {services.map((svc, i) => (
          <motion.div
            key={svc.id}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            whileHover={{ x: -3, y: -1 }}
          >
            <Link href="/book">
              <GlassCard gold={i === 1} className="flex items-center gap-4 p-5 cursor-pointer relative overflow-hidden">
                <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-2xl flex-shrink-0 bg-[rgba(198,165,91,0.14)] border border-[rgba(198,165,91,0.28)]">
                  {icons[svc.nameFa] ?? '✦'}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-[#F3EFE8] mb-0.5">{svc.nameFa}</h3>
                  <p className="text-[10px] text-[#F3EFE8]/40">{svc.descriptionFa}</p>
                </div>
                <div className="text-left flex flex-col items-end gap-1">
                  <span className="text-xs text-[#C6A55B] font-semibold">از {svc.price.toLocaleString('fa-IR')}</span>
                  <span className="text-base text-[#F3EFE8]/20">←</span>
                </div>
              </GlassCard>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
