'use client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useBookingDialog } from '@/components/booking/BookingDialogProvider'
import { GlassCard } from '@/components/ui/GlassCard'
import type { ServiceDTO } from '@/types'

const icons: Record<string, string> = { 'ماساژ درمانی': '💆', 'ماساژ آرامش‌بخش': '🌿' }

export function ServicesSection({ services }: { services: ServiceDTO[] }) {
  const { open, available } = useBookingDialog()
  const router = useRouter()
  const handleBook = () => available ? open() : router.push('/book')
  return (
    <section id="services" className="px-4 sm:px-8 lg:px-16 mb-10">
      <motion.p
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        className="tracking-[3px] mb-4 font-light"
        style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}
      >
        — خدمات ما
      </motion.p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {services.map((svc, i) => (
          <motion.div
            key={svc.id}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            whileHover={{ y: -3 }}
          >
            <button onClick={handleBook} className="w-full text-right">
              <GlassCard gold={i === 1} className="flex items-center gap-4 p-5 cursor-pointer relative overflow-hidden h-full">
                <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-2xl flex-shrink-0 bg-[rgba(198,165,91,0.14)] border border-[rgba(198,165,91,0.28)]">
                  {icons[svc.nameFa] ?? '✦'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{svc.nameFa}</h3>
                  <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{svc.descriptionFa}</p>
                </div>
                <div className="text-left flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xs text-[#C6A55B] font-semibold">از {svc.price.toLocaleString('fa-IR')}</span>
                  <span className="text-base" style={{ color: 'var(--text-faint)' }}>←</span>
                </div>
              </GlassCard>
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
