'use client'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import { TierIcon } from '@/components/ui/TierIcon'
import type { ServiceDTO, AddonDTO } from '@/types'
import type { WizardState } from './BookingWizard'

type Props = {
  state: WizardState
  update: (p: Partial<WizardState>) => void
  goNext: () => void
  services: ServiceDTO[]
  addons: AddonDTO[]
}

const TIER_COLORS: Record<string, string> = {
  red: '#E05C5C',
  yellow: '#D4A929',
  purple: '#9B59B6',
  blue: '#4A90D9',
}

export function Step1Service({ state, update, goNext, services, addons }: Props) {
  const selectedService = services.find(s => s.id === state.serviceId)
  const availableAddons = addons.filter(a => !a.requiresTier || (selectedService?.tier ?? null) !== null)

  const totalPrice = (selectedService?.price ?? 0) +
    state.addonIds
      .map(id => addons.find(a => a.id === id)?.price ?? 0)
      .reduce((s, p) => s + p, 0)

  function toggleAddon(id: string) {
    const next = state.addonIds.includes(id)
      ? state.addonIds.filter(x => x !== id)
      : [...state.addonIds, id]
    update({ addonIds: next })
  }

  function selectService(svc: ServiceDTO) {
    const cleanedAddonIds = svc.tier === null
      ? state.addonIds.filter(id => !addons.find(a => a.id === id)?.requiresTier)
      : state.addonIds
    update({ serviceId: svc.id, endTime: undefined, addonIds: cleanedAddonIds })
  }

  const tierServices = services.filter(s => s.tier !== null).sort((a, b) => (a.tier ?? 0) - (b.tier ?? 0))
  const otherServices = services.filter(s => s.tier === null)

  return (
    <div>
      <h2 className="text-base font-light mb-0.5" style={{ color: 'var(--text-primary)' }}>انتخاب غرفه</h2>
      <p className="text-xs mb-3 font-light" style={{ color: 'var(--text-muted)' }}>یک غرفه انتخاب کنید</p>

      {/* Tier services: 2-column grid */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {tierServices.map((svc, i) => {
          const selected = state.serviceId === svc.id
          const tierColor = svc.color ? TIER_COLORS[svc.color] ?? '#C6A55B' : '#C6A55B'
          return (
            <motion.div key={svc.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <button type="button" className="w-full text-right h-full" onClick={() => selectService(svc)}>
                <GlassCard
                  gold={selected}
                  className={`flex flex-col items-center gap-2 p-3 cursor-pointer transition-all h-full ${selected ? 'shadow-[0_0_0_2px_#C6A55B,0_8px_32px_rgba(198,165,91,0.3)]' : ''}`}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[rgba(198,165,91,0.08)] border border-[rgba(198,165,91,0.2)]">
                    <TierIcon symbol={svc.symbol} color={svc.color} size={20} />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                      {svc.descriptionFa}
                      {svc.tier === 3 && <span className="mr-1 text-[9px] font-medium" style={{ color: tierColor }}>VIP</span>}
                    </h3>
                    <p className="text-[10px] text-[#C6A55B] font-semibold">{svc.price.toLocaleString('fa-IR')} ت</p>
                  </div>
                </GlassCard>
              </button>
            </motion.div>
          )
        })}
      </div>

      {/* Non-tier services: full-width rows */}
      <div className="flex flex-col gap-2 mb-4">
        {otherServices.map((svc, i) => {
          const selected = state.serviceId === svc.id
          return (
            <motion.div key={svc.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (tierServices.length + i) * 0.06 }}>
              <button type="button" className="w-full text-right" onClick={() => selectService(svc)}>
                <GlassCard
                  gold={selected}
                  className={`flex items-center gap-3 p-3 cursor-pointer transition-all ${selected ? 'shadow-[0_0_0_2px_#C6A55B,0_8px_32px_rgba(198,165,91,0.3)]' : ''}`}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-[rgba(198,165,91,0.08)] border border-[rgba(198,165,91,0.2)]">
                    <TierIcon symbol={svc.symbol} color={svc.color} size={18} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{svc.nameFa}</h3>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {svc.descriptionFa} — {svc.durationMinutes} دقیقه
                    </p>
                  </div>
                  <span className="text-xs text-[#C6A55B] font-semibold">{svc.price.toLocaleString('fa-IR')} ت</span>
                </GlassCard>
              </button>
            </motion.div>
          )
        })}
      </div>

      {selectedService && availableAddons.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>افزودنی‌ها</p>
          <div className="flex flex-col gap-2">
            {availableAddons.map(addon => {
              const checked = state.addonIds.includes(addon.id)
              return (
                <button
                  key={addon.id}
                  type="button"
                  aria-pressed={checked}
                  className="w-full text-right"
                  onClick={() => toggleAddon(addon.id)}
                >
                  <GlassCard className={`flex items-center gap-3 p-2.5 cursor-pointer transition-all ${checked ? 'shadow-[0_0_0_1.5px_#C6A55B]' : ''}`}>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${checked ? 'bg-[#C6A55B] border-[#C6A55B]' : 'border-[rgba(198,165,91,0.4)]'}`}>
                      {checked && <span aria-hidden="true" className="text-black text-[10px] font-bold">✓</span>}
                    </div>
                    <span className="flex-1 text-xs" style={{ color: 'var(--text-primary)' }}>{addon.nameFa}</span>
                    <span className="text-xs text-[#C6A55B]">+{addon.price.toLocaleString('fa-IR')} ت</span>
                  </GlassCard>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {selectedService && (
        <div className="flex justify-between text-xs mb-3 px-1">
          <span style={{ color: 'var(--text-muted)' }}>جمع کل</span>
          <span className="font-semibold text-[#C6A55B]">{totalPrice.toLocaleString('fa-IR')} تومان</span>
        </div>
      )}

      <GoldButton className="w-full" onClick={goNext} disabled={!state.serviceId}>ادامه ←</GoldButton>
    </div>
  )
}
