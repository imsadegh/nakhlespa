'use client'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import { TierIcon } from '@/components/ui/TierIcon'
import { getCustomizationAdditionalPrice, getDefaultCustomization, normalizeCustomization } from '@/lib/booking-customization'
import type { ServiceDTO, AddonDTO, WizardState, Person } from '@/types'

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

function emptyPerson(): Person {
  return {
    serviceId: '',
    addonIds: [],
    customization: getDefaultCustomization(),
    healthIntake: null,
    customerName: '',
    customerPhone: '',
    customerNotes: '',
  }
}

function updatePerson(persons: Person[], index: number, patch: Partial<Person>): Person[] {
  return persons.map((p, i) => i === index ? { ...p, ...patch } : p)
}

export function Step1Service({ state, update, goNext, services, addons }: Props) {
  const persons = state.persons
  const tierServices = services.filter(s => s.tier !== null).sort((a, b) => (a.tier ?? 0) - (b.tier ?? 0))
  const otherServices = services.filter(s => s.tier === null)

  // Services already claimed by other persons — each room has capacity 1
  const takenServiceIds = (personIndex: number) =>
    new Set(persons.filter((_, i) => i !== personIndex && persons[i].serviceId !== '').map(p => p.serviceId))

  const totalPrice = persons.reduce((sum, person) => {
    const svc = services.find(s => s.id === person.serviceId)
    const addonSum = person.addonIds.reduce((a, id) => a + (addons.find(ad => ad.id === id)?.price ?? 0), 0)
    const customizationSum = getCustomizationAdditionalPrice(person.customization, svc?.tier)
    return sum + (svc?.price ?? 0) + addonSum + customizationSum
  }, 0)

  const allPersonsHaveService = persons.every(p => p.serviceId !== '')

  function setPerson(index: number, patch: Partial<Person>) {
    update({ persons: updatePerson(persons, index, patch) })
  }

  function addPerson() {
    update({ persons: [...persons, emptyPerson()] })
  }

  function removePerson(index: number) {
    update({ persons: persons.filter((_, i) => i !== index) })
  }

  function selectService(index: number, svc: ServiceDTO) {
    const person = persons[index]
    const cleanedAddonIds = svc.tier === null
      ? person.addonIds.filter(id => !addons.find(a => a.id === id)?.requiresTier)
      : person.addonIds
    const customization = svc.tier === null
      ? null
      : normalizeCustomization(
        person.customization ?? getDefaultCustomization(),
        svc.tier,
      )
    setPerson(index, { serviceId: svc.id, addonIds: cleanedAddonIds, customization })
  }

  function toggleAddon(index: number, addonId: string) {
    const person = persons[index]
    const next = person.addonIds.includes(addonId)
      ? person.addonIds.filter(x => x !== addonId)
      : [...person.addonIds, addonId]
    setPerson(index, { addonIds: next })
  }

  return (
    <div>
      <h2 className="text-base font-light mb-0.5" style={{ color: 'var(--text-primary)' }}>انتخاب غرفه</h2>
      <p className="text-xs mb-3 font-light" style={{ color: 'var(--text-muted)' }}>برای هر نفر یک غرفه انتخاب کنید</p>

      <div className="flex flex-col gap-3">
        {persons.map((person, personIndex) => {
          const selectedService = services.find(s => s.id === person.serviceId)
          const availableAddons = addons.filter(a => !a.requiresTier || (selectedService?.tier ?? null) !== null)
          const taken = takenServiceIds(personIndex)

          return (
            <div key={personIndex} className="rounded-2xl border p-2.5" style={{ borderColor: 'var(--border-base)', background: 'var(--bg-surface)' }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  نفر {String(personIndex + 1).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])}
                  {personIndex === 0 && <span className="mr-1 text-[10px]" style={{ color: 'var(--text-faint)' }}>(پرداخت‌کننده)</span>}
                </span>
                {persons.length > 1 && (
                  <button type="button" onClick={() => removePerson(personIndex)}
                    className="min-h-7 rounded-lg border border-destructive/35 bg-destructive/5 px-2.5 py-1 text-xs text-destructive transition-colors hover:border-destructive/50 hover:bg-destructive/10">
                    حذف
                  </button>
                )}
              </div>

              {/* Tier service grid */}
              <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                {tierServices.map((svc, i) => {
                  const selected = person.serviceId === svc.id
                  const isTaken = taken.has(svc.id)
                  const tierColor = svc.color ? TIER_COLORS[svc.color] ?? '#C6A55B' : '#C6A55B'
                  return (
                    <motion.div key={svc.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <button
                        type="button"
                        className={`w-full text-right h-full ${isTaken ? 'cursor-not-allowed' : ''}`}
                        onClick={() => !isTaken && selectService(personIndex, svc)}
                        title={isTaken ? 'این غرفه توسط نفر دیگری انتخاب شده' : undefined}
                      >
                        <GlassCard gold={selected}
                          className={`relative flex flex-col items-center gap-1 p-2 transition-all h-full overflow-hidden ${selected ? 'shadow-[0_0_0_2px_#C6A55B,0_8px_32px_rgba(198,165,91,0.3)]' : ''} ${isTaken ? 'opacity-40' : 'cursor-pointer'}`}>
                          {isTaken && (
                            <span className="pointer-events-none absolute inset-0 rounded-xl"
                              style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(255,255,255,0.06) 4px, rgba(255,255,255,0.06) 5px)' }} />
                          )}
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[rgba(198,165,91,0.08)] border border-[rgba(198,165,91,0.2)]">
                            <TierIcon symbol={svc.symbol} color={svc.color} size={18} />
                          </div>
                          <div className="text-center">
                            <h3 className="text-[11px] font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                              {svc.descriptionFa}
                              {svc.tier === 3 && <span className="mr-1 text-[9px] font-medium" style={{ color: tierColor }}>VIP</span>}
                            </h3>
                            <p className="text-sm font-bold text-[#C6A55B]">{svc.price.toLocaleString('fa-IR')} ت</p>
                          </div>
                        </GlassCard>
                      </button>
                    </motion.div>
                  )
                })}
              </div>

              {/* Non-tier services */}
              <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                {otherServices.map(svc => {
                  const selected = person.serviceId === svc.id
                  const isTaken = taken.has(svc.id)
                  return (
                    <button
                      key={svc.id}
                      type="button"
                      className={`w-full text-right ${isTaken ? 'cursor-not-allowed' : ''}`}
                      onClick={() => !isTaken && selectService(personIndex, svc)}
                      title={isTaken ? 'این غرفه توسط نفر دیگری انتخاب شده' : undefined}
                    >
                      <GlassCard gold={selected}
                        className={`relative flex h-full flex-col items-center gap-1 p-2 text-center transition-all overflow-hidden ${selected ? 'shadow-[0_0_0_2px_#C6A55B,0_8px_32px_rgba(198,165,91,0.3)]' : ''} ${isTaken ? 'opacity-40' : 'cursor-pointer'}`}>
                        {isTaken && (
                          <span className="pointer-events-none absolute inset-0 rounded-xl"
                            style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(255,255,255,0.06) 4px, rgba(255,255,255,0.06) 5px)' }} />
                        )}
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-[rgba(198,165,91,0.2)] bg-[rgba(198,165,91,0.08)]">
                          <TierIcon symbol={svc.symbol} color={svc.color} size={16} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{svc.nameFa}</h3>
                          <p className="truncate text-[10px]" style={{ color: 'var(--text-muted)' }}>{svc.descriptionFa} — {svc.durationMinutes} دقیقه</p>
                        </div>
                        <span className="text-sm font-bold text-[#C6A55B]">{svc.price.toLocaleString('fa-IR')} ت</span>
                      </GlassCard>
                    </button>
                  )
                })}
              </div>

              {/* Add-ons for this person */}
              {selectedService && availableAddons.length > 0 && (
                <div className="mt-1.5">
                  <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>افزودنی‌ها</p>
                  <div className="flex flex-col gap-1">
                    {availableAddons.map(addon => {
                      const checked = person.addonIds.includes(addon.id)
                      return (
                        <button key={addon.id} type="button" aria-pressed={checked} className="w-full text-right"
                          onClick={() => toggleAddon(personIndex, addon.id)}>
                          <GlassCard className={`flex items-center gap-2 p-1.5 cursor-pointer transition-all ${checked ? 'shadow-[0_0_0_1.5px_#C6A55B]' : ''}`}>
                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${checked ? 'bg-[#C6A55B] border-[#C6A55B]' : 'border-[rgba(198,165,91,0.4)]'}`}>
                              {checked && <span aria-hidden="true" className="text-black text-[9px] font-bold">✓</span>}
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
            </div>
          )
        })}
      </div>

      {/* Add person button — only show when all current persons have a service selected */}
      {allPersonsHaveService && (
        <button type="button" onClick={addPerson}
          className="w-full mt-3 py-2.5 rounded-xl text-xs transition-all"
          style={{ color: '#C6A55B', border: '1px dashed rgba(198,165,91,0.5)', background: 'rgba(198,165,91,0.04)' }}>
          + افزودن نفر دیگر
        </button>
      )}

      {totalPrice > 0 && (
        <div className="flex justify-between text-xs mt-3 mb-3 px-1">
          <span style={{ color: 'var(--text-muted)' }}>جمع کل</span>
          <span className="font-semibold text-[#C6A55B]">{totalPrice.toLocaleString('fa-IR')} تومان</span>
        </div>
      )}

      <GoldButton className="w-full" onClick={goNext} disabled={!allPersonsHaveService}>ادامه ←</GoldButton>
    </div>
  )
}
