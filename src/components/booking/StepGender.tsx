'use client'
import { useEffect, useState } from 'react'
import type { WizardState, Gender } from '@/types'

type Props = { state: WizardState; update: (p: Partial<WizardState>) => void; goNext: () => void }

type GenderWindows = { FEMALE: string; MALE: string }

function toFaTime(t: string) {
  return t.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

export function StepGender({ state, update, goNext }: Props) {
  const [windows, setWindows] = useState<GenderWindows | null>(null)

  useEffect(() => {
    fetch('/api/working-hours')
      .then(r => r.json())
      .then((data: { gender: Gender; openTime: string; closeTime: string; isOpen: boolean }[]) => {
        // Pick the earliest openTime and latest closeTime per gender across all days
        const female = data.filter(h => h.gender === 'FEMALE' && h.isOpen)
        const male = data.filter(h => h.gender === 'MALE' && h.isOpen)
        const earliest = (rows: typeof female) => rows.map(h => h.openTime).sort()[0] ?? '—'
        const latest = (rows: typeof female) => rows.map(h => h.closeTime).sort().reverse()[0] ?? '—'
        setWindows({
          FEMALE: `${toFaTime(earliest(female))} — ${toFaTime(latest(female))}`,
          MALE: `${toFaTime(earliest(male))} — ${toFaTime(latest(male))}`,
        })
      })
      .catch(() => setWindows({ FEMALE: '۰۸:۰۰ — ۱۴:۳۰', MALE: '۱۵:۰۰ — ۲۲:۰۰' }))
  }, [])

  function select(gender: Gender) {
    update({ gender })
    goNext()
  }

  const cards: { gender: Gender; label: string; icon: string }[] = [
    { gender: 'FEMALE', label: 'خانم', icon: '♀' },
    { gender: 'MALE',   label: 'آقا',  icon: '♂' },
  ]

  return (
    <div>
      <h2 className="text-base font-light mb-0.5" style={{ color: 'var(--text-primary)' }}>انتخاب جلسه</h2>
      <p className="text-xs mb-5 font-light" style={{ color: 'var(--text-muted)' }}>
        لطفاً نوع جلسه را انتخاب کنید
      </p>

      <div className="flex flex-col gap-3">
        {cards.map(({ gender, label, icon }) => {
          const window = windows?.[gender]
          const selected = state.gender === gender
          return (
            <button
              key={gender}
              type="button"
              onClick={() => select(gender)}
              className="rounded-2xl border p-5 text-right transition-all duration-200 flex items-center gap-4"
              style={selected ? {
                background: 'var(--glass-gold-bg)',
                borderColor: 'rgba(198,165,91,0.6)',
                boxShadow: '0 0 0 1px rgba(198,165,91,0.3)',
              } : {
                background: 'var(--bg-surface)',
                borderColor: 'var(--border-base)',
              }}
            >
              <span className={`text-3xl ${gender === 'FEMALE' ? 'text-pink-400' : 'text-blue-400'}`}>
                {icon}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
                {window ? (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    ساعت {window}
                  </p>
                ) : (
                  <p className="text-xs" style={{ color: 'var(--text-faint)' }}>در حال بارگذاری...</p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
