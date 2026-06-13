'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GoldButton } from '@/components/ui/GoldButton'
import { GhostButton } from '@/components/ui/GhostButton'
import type { WizardState } from './BookingWizard'
import type { SlotDTO } from '@/types'

type Props = { state: WizardState; update: (p: Partial<WizardState>) => void; goNext: () => void; goBack: () => void }

function toFaTime(t: string) {
  return t.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

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
      <h2 className="text-base font-light mb-0.5" style={{ color: 'var(--text-primary)' }}>انتخاب تاریخ</h2>
      <p className="text-xs mb-3 font-light" style={{ color: 'var(--text-muted)' }}>تاریخ مورد نظر را انتخاب کنید</p>

      <div className="relative mb-3">
        {/* fade edges */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-3 w-8 z-10"
          style={{ background: 'linear-gradient(to left, var(--bg-base), transparent)' }} />
        <div className="pointer-events-none absolute left-0 top-0 bottom-3 w-8 z-10"
          style={{ background: 'linear-gradient(to right, var(--bg-base), transparent)' }} />
        <div className="flex gap-2 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
          {dates.map(d => {
            const [y, mo, day] = d.split('-').map(Number)
            const label = new Date(y, mo - 1, day).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })
            const selected = state.date === d
            return (
              <button key={d} type="button" onClick={() => update({ date: d })}
                className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs transition-all ${selected ? 'bg-[#C6A55B] text-[#0F3D2E] font-bold shadow-[0_4px_16px_rgba(198,165,91,0.4)]' : ''}`}
                style={selected ? {} : {
                  color: 'var(--text-muted)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-base)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
                }}>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {state.date && (
        <>
          <p className="text-[10px] tracking-widest mb-3" style={{ color: 'var(--text-faint)' }}>— ساعت‌های موجود</p>
          {loading ? (
            <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>در حال بارگذاری...</p>
          ) : slots.length === 0 ? (
            <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>ظرفیتی برای این روز موجود نیست</p>
          ) : slots.every(s => s.taken) ? (
            <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>تمام ساعت‌های این روز رزرو شده‌اند</p>
          ) : (
            <motion.div className="flex flex-wrap gap-2 mb-4"
              variants={{ show: { transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="show">
              {slots.map(slot => {
                const selected = state.startTime === slot.startTime
                if (slot.taken) {
                  return (
                    <motion.div key={slot.startTime} title="این ساعت رزرو شده است"
                      variants={{ hidden: { opacity: 0, scale: 0.85 }, show: { opacity: 1, scale: 1 } }}
                      className="relative px-4 py-2 rounded-xl text-xs select-none cursor-not-allowed overflow-hidden"
                      style={{
                        color: 'var(--text-faint)',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-base)',
                        opacity: 0.5,
                      }}>
                      <span className="line-through">{toFaTime(slot.startTime)}</span>
                      {/* diagonal stripe overlay */}
                      <span className="pointer-events-none absolute inset-0 rounded-xl"
                        style={{
                          backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(255,255,255,0.06) 4px, rgba(255,255,255,0.06) 5px)',
                        }} />
                    </motion.div>
                  )
                }
                return (
                  <motion.button key={slot.startTime} type="button"
                    variants={{ hidden: { opacity: 0, scale: 0.85 }, show: { opacity: 1, scale: 1 } }}
                    onClick={() => update({ startTime: slot.startTime, endTime: slot.endTime })}
                    className={`px-4 py-2 rounded-xl text-xs transition-all ${selected ? 'bg-[#C6A55B] text-[#0F3D2E] font-bold shadow-[0_4px_16px_rgba(198,165,91,0.35)]' : ''}`}
                    style={selected ? {} : {
                      color: 'var(--text-muted)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-base)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
                    }}>
                    {toFaTime(slot.startTime)}
                  </motion.button>
                )
              })}
            </motion.div>
          )}
        </>
      )}

      <div className="flex gap-3 mt-2">
        <GhostButton onClick={goBack} className="flex-1">→ برگشت</GhostButton>
        <GoldButton onClick={goNext} className="flex-1" disabled={!state.startTime}>ادامه ←</GoldButton>
      </div>
    </div>
  )
}
