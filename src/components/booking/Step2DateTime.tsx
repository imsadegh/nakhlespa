'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GoldButton } from '@/components/ui/GoldButton'
import { GhostButton } from '@/components/ui/GhostButton'
import type { WizardState } from './BookingWizard'
import type { SlotDTO } from '@/types'

type Props = { state: WizardState; update: (p: Partial<WizardState>) => void; goNext: () => void; goBack: () => void }

function getDates(count = 14) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i + 1)
    return d.toISOString().split('T')[0]
  })
}

export function Step2DateTime({ state, update, goNext, goBack }: Props) {
  const [slots, setSlots] = useState<SlotDTO[]>([])
  const [loading, setLoading] = useState(false)
  const dates = getDates()

  useEffect(() => {
    if (!state.date || !state.serviceId) return
    setSlots([]); update({ startTime: undefined, endTime: undefined })
    setLoading(true)
    fetch(`/api/slots?date=${state.date}&serviceId=${state.serviceId}`)
      .then(r => r.json())
      .then((data: SlotDTO[]) => { setSlots(data) })
      .finally(() => setLoading(false))
  }, [state.date, state.serviceId, update])

  return (
    <div>
      <h2 className="text-xl font-light text-[#F3EFE8] mb-1">انتخاب تاریخ</h2>
      <p className="text-xs text-[#F3EFE8]/40 mb-5 font-light">تاریخ مورد نظر را انتخاب کنید</p>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-6" style={{ scrollbarWidth: 'none' }}>
        {dates.map(d => {
          const label = new Date(d).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })
          const selected = state.date === d
          return (
            <button key={d} type="button" onClick={() => update({ date: d })}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs transition-all ${selected ? 'bg-[#C6A55B] text-[#0F3D2E] font-bold shadow-[0_4px_16px_rgba(198,165,91,0.4)]' : 'glass text-[#F3EFE8]/60 hover:text-[#F3EFE8]'}`}>
              {label}
            </button>
          )
        })}
      </div>

      {state.date && (
        <>
          <p className="text-[10px] tracking-widest text-[#F3EFE8]/30 mb-3">— ساعت‌های موجود</p>
          {loading ? (
            <p className="text-xs text-[#F3EFE8]/40 text-center py-8">در حال بارگذاری...</p>
          ) : slots.length === 0 ? (
            <p className="text-xs text-[#F3EFE8]/40 text-center py-8">ظرفیتی برای این روز موجود نیست</p>
          ) : (
            <motion.div className="flex flex-wrap gap-2 mb-8"
              variants={{ show: { transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="show">
              {slots.map(slot => {
                const selected = state.startTime === slot.startTime
                return (
                  <motion.button key={slot.startTime} type="button"
                    variants={{ hidden: { opacity: 0, scale: 0.85 }, show: { opacity: 1, scale: 1 } }}
                    onClick={() => update({ startTime: slot.startTime, endTime: slot.endTime })}
                    className={`px-4 py-2 rounded-xl text-xs transition-all ${selected ? 'bg-[#C6A55B] text-[#0F3D2E] font-bold shadow-[0_4px_16px_rgba(198,165,91,0.35)]' : 'glass text-[#F3EFE8]/70 hover:text-[#F3EFE8]'}`}>
                    {slot.startTime}
                  </motion.button>
                )
              })}
            </motion.div>
          )}
        </>
      )}

      <div className="flex gap-3">
        <GhostButton onClick={goBack} className="flex-1">→ برگشت</GhostButton>
        <GoldButton onClick={goNext} className="flex-1" disabled={!state.startTime}>ادامه ←</GoldButton>
      </div>
    </div>
  )
}
