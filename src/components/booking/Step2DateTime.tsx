'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GoldButton } from '@/components/ui/GoldButton'
import { GhostButton } from '@/components/ui/GhostButton'
import type { WizardState, SlotDTO } from '@/types'
import { getTehranDate, isSlotPast } from '@/lib/slot-time'

type Props = { state: WizardState; update: (p: Partial<WizardState>) => void; goNext: () => void; goBack: () => void }

function toFaTime(t: string) {
  return t.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

function toFaNum(n: number) {
  return String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

function getDates(now: Date, count = 14) {
  const today = getTehranDate(now)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(`${today}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + i)
    return d.toISOString().split('T')[0]
  })
}

const JS_TO_IR: Record<number, number> = { 6: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 }

function iranianDayOfWeek(dateStr: string): number {
  const [y, mo, d] = dateStr.split('-').map(Number)
  return JS_TO_IR[new Date(Date.UTC(y, mo - 1, d)).getUTCDay()]
}

export function Step2DateTime({ state, update, goNext, goBack }: Props) {
  const [slots, setSlots] = useState<SlotDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [closedDays, setClosedDays] = useState<Set<number> | null>(null)
  const [now, setNow] = useState(() => new Date())
  const dates = getDates(now)
  const selectedTimeExpired = !!state.date && !!state.startTime && isSlotPast(state.date, state.startTime, now)

  useEffect(() => {
    const tick = () => setNow(new Date())
    const timer = window.setInterval(tick, 1000)
    window.addEventListener('focus', tick)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', tick)
    }
  }, [])

  useEffect(() => {
    if (selectedTimeExpired) update({ startTime: undefined, endTime: undefined })
  }, [selectedTimeExpired, update])

  const firstServiceId = state.persons[0]?.serviceId
  const personCount = state.persons.length
  // Check specific room conflicts and shared package capacity once everyone has a service.
  const allServiceIds = state.persons.map(p => p.serviceId).filter(Boolean)
  const allServicesChosen = allServiceIds.length === personCount && personCount > 0
  const bookingPlansKey = JSON.stringify(state.persons.map(person => ({ serviceId: person.serviceId, addonIds: person.addonIds })))

  useEffect(() => {
    if (!state.gender) return
    fetch('/api/working-hours')
      .then(r => r.json())
      .then((data: { dayOfWeek: number; gender: string; isOpen: boolean }[]) => {
        const genderData = data.filter(h => h.gender === state.gender)
        setClosedDays(new Set(genderData.filter(h => !h.isOpen).map(h => h.dayOfWeek)))
      })
      .catch(() => setClosedDays(new Set()))
  }, [state.gender])

  useEffect(() => {
    if (!state.date || !firstServiceId || !state.gender) return
    setSlots([]); update({ startTime: undefined, endTime: undefined })
    setLoading(true)
    const params = new URLSearchParams({ date: state.date, serviceId: firstServiceId, gender: state.gender })
    if (allServicesChosen) params.set('bookingPlans', bookingPlansKey)
    else params.set('count', String(personCount))
    const url = `/api/slots?${params}`
    fetch(url)
      .then(r => r.json())
      .then((data: SlotDTO[]) => setSlots(data))
      .finally(() => setLoading(false))
  }, [state.date, firstServiceId, allServicesChosen, bookingPlansKey, personCount, state.gender, update])

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
            const closed = closedDays !== null && closedDays.has(iranianDayOfWeek(d))
            if (closed) {
              return (
                <div key={d} title="این روز تعطیل است"
                  className="relative flex-shrink-0 px-4 py-2.5 rounded-xl text-xs select-none cursor-not-allowed overflow-hidden"
                  style={{
                    color: 'var(--text-faint)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-base)',
                    opacity: 0.5,
                  }}>
                  <span className="line-through">{label}</span>
                  <span className="pointer-events-none absolute inset-0 rounded-xl"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(255,255,255,0.06) 4px, rgba(255,255,255,0.06) 5px)',
                    }} />
                </div>
              )
            }
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
          ) : (
            <motion.div className="flex flex-wrap gap-2 mb-4"
              variants={{ show: { transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="show">
              {slots.map(slot => {
                const selected = state.startTime === slot.startTime
                const expired = slot.expired || isSlotPast(state.date!, slot.startTime, now)
                if (slot.taken || expired) {
                  return (
                    <motion.button key={slot.startTime} type="button" disabled
                      title={expired ? 'زمان این نوبت گذشته است' : 'این ساعت برای خدمات انتخابی در دسترس نیست'}
                      variants={{ hidden: { opacity: 0, scale: 0.85 }, show: { opacity: 1, scale: 1 } }}
                      className="relative flex flex-col items-center px-4 py-2 rounded-xl text-xs select-none cursor-not-allowed overflow-hidden"
                      style={{ color: 'var(--text-faint)', background: 'var(--bg-surface)', border: '1px solid var(--border-base)', opacity: 0.5 }}>
                      <span className="line-through">{toFaTime(slot.startTime)}</span>
                      {expired && <span className="text-[9px] mt-0.5">زمان گذشته</span>}
                      <span className="pointer-events-none absolute inset-0 rounded-xl"
                        style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(255,255,255,0.06) 4px, rgba(255,255,255,0.06) 5px)' }} />
                    </motion.button>
                  )
                }
                return (
                  <motion.button key={slot.startTime} type="button"
                    variants={{ hidden: { opacity: 0, scale: 0.85 }, show: { opacity: 1, scale: 1 } }}
                    onClick={() => {
                      if (!isSlotPast(state.date!, slot.startTime)) update({ startTime: slot.startTime, endTime: slot.endTime })
                    }}
                    className={`flex flex-col items-center px-4 py-2 rounded-xl text-xs transition-all ${selected ? 'bg-[#C6A55B] text-[#0F3D2E] font-bold shadow-[0_4px_16px_rgba(198,165,91,0.35)]' : ''}`}
                    style={selected ? {} : { color: 'var(--text-muted)', background: 'var(--bg-surface)', border: '1px solid var(--border-base)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)' }}>
                    <span>{toFaTime(slot.startTime)}</span>
                    <span className={`text-[9px] mt-0.5 ${slot.availableCount === 1 ? 'text-amber-400' : selected ? 'text-[#0F3D2E]/70' : ''}`}
                      style={slot.availableCount > 1 && !selected ? { color: 'var(--text-faint)' } : {}}>
                      {toFaNum(slot.availableCount)} غرفه خالی
                    </span>
                  </motion.button>
                )
              })}
            </motion.div>
          )}
        </>
      )}

      <div className="flex gap-3 mt-2">
        <GhostButton onClick={goBack} className="flex-1">→ برگشت</GhostButton>
        <GoldButton onClick={() => {
          if (state.date && state.startTime && !isSlotPast(state.date, state.startTime)) goNext()
        }} className="flex-1" disabled={!state.startTime || selectedTimeExpired}>ادامه ←</GoldButton>
      </div>
    </div>
  )
}
