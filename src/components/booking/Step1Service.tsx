'use client'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import type { ServiceDTO } from '@/types'
import type { WizardState } from './BookingWizard'

type Props = { state: WizardState; update: (p: Partial<WizardState>) => void; goNext: () => void; services: ServiceDTO[] }
const icons: Record<string, string> = { 'ماساژ درمانی': '💆', 'ماساژ آرامش‌بخش': '🌿' }

export function Step1Service({ state, update, goNext, services }: Props) {
  return (
    <div>
      <h2 className="text-xl font-light mb-1" style={{ color: 'var(--text-primary)' }}>خدمت مورد نظر</h2>
      <p className="text-xs mb-6 font-light" style={{ color: 'var(--text-muted)' }}>یک سرویس انتخاب کنید</p>
      <div className="flex flex-col gap-3 mb-8">
        {services.map((svc, i) => {
          const selected = state.serviceId === svc.id
          return (
            <motion.div key={svc.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <button type="button" className="w-full text-right" onClick={() => update({ serviceId: svc.id, endTime: undefined })}>
                <GlassCard
                  gold={selected}
                  className={`flex items-center gap-4 p-5 cursor-pointer transition-all ${selected ? 'shadow-[0_0_0_2px_#C6A55B,0_8px_32px_rgba(198,165,91,0.3)]' : ''}`}
                >
                  <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-2xl flex-shrink-0 bg-[rgba(198,165,91,0.14)] border border-[rgba(198,165,91,0.28)]">
                    {icons[svc.nameFa] ?? '✦'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{svc.nameFa}</h3>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{svc.descriptionFa} — {svc.durationMinutes} دقیقه</p>
                  </div>
                  <span className="text-xs text-[#C6A55B] font-semibold">{svc.price.toLocaleString('fa-IR')} ت</span>
                </GlassCard>
              </button>
            </motion.div>
          )
        })}
      </div>
      <GoldButton className="w-full py-4" onClick={goNext} disabled={!state.serviceId}>ادامه ←</GoldButton>
    </div>
  )
}
