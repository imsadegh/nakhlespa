'use client'

import * as React from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { ClockIcon } from 'lucide-react'

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00', '15', '30', '45']

function toFaTime(t: string) {
  return t.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

interface TimePickerProps {
  value: string        // HH:mm
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export function TimePicker({ value, onChange, placeholder, className }: TimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [hh, mm] = value ? value.split(':') : ['', '']

  function select(h: string, m: string) {
    onChange(`${h}:${m}`)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'flex items-center gap-2 w-full rounded-xl px-3 py-2 text-xs transition-all duration-150 cursor-pointer',
          'bg-white/[0.10] backdrop-blur-sm border border-white/[0.18] hover:bg-white/[0.16] hover:border-[rgba(198,165,91,0.5)]',
          'focus:outline-none focus:border-[rgba(198,165,91,0.6)] focus:ring-1 focus:ring-[rgba(198,165,91,0.3)]',
          className
        )}
      >
        <ClockIcon className="size-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
        <span style={{ color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {value ? toFaTime(value) : (placeholder ?? 'انتخاب ساعت')}
        </span>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-2 shadow-2xl rounded-xl overflow-hidden border"
        style={{
          background: 'var(--picker-bg)',
          borderColor: 'var(--picker-border)',
          backdropFilter: 'blur(24px)',
        }}
        align="start"
        side="bottom"
      >
        <div className="flex gap-1">
          {/* Hour column */}
          <div className="flex-1 flex flex-col gap-0.5 max-h-48 overflow-y-auto scroll-smooth">
            <p className="text-[9px] px-1 pb-1 sticky top-0" style={{ color: 'var(--text-faint)', background: 'var(--picker-bg)' }}>ساعت</p>
            {HOURS.map(h => (
              <button
                key={h}
                onClick={() => select(h, mm || '00')}
                className={cn(
                  'w-full rounded-lg px-2 py-1 text-xs text-center transition-colors',
                  hh === h ? 'glass-gold text-[#C6A55B]' : ''
                )}
                style={hh === h ? undefined : {
                  color: 'var(--text-muted)',
                }}
                onMouseEnter={e => { if (hh !== h) e.currentTarget.style.background = 'var(--bg-surface)' }}
                onMouseLeave={e => { if (hh !== h) e.currentTarget.style.background = '' }}
              >
                {toFaTime(h)}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px my-1 rounded-full" style={{ background: 'var(--border-base)' }} />

          {/* Minute column */}
          <div className="flex-1 flex flex-col gap-0.5">
            <p className="text-[9px] px-1 pb-1" style={{ color: 'var(--text-faint)' }}>دقیقه</p>
            {MINUTES.map(m => (
              <button
                key={m}
                onClick={() => select(hh || '00', m)}
                className={cn(
                  'w-full rounded-lg px-2 py-1 text-xs text-center transition-colors',
                  mm === m ? 'glass-gold text-[#C6A55B]' : ''
                )}
                style={mm === m ? undefined : {
                  color: 'var(--text-muted)',
                }}
                onMouseEnter={e => { if (mm !== m) e.currentTarget.style.background = 'var(--bg-surface)' }}
                onMouseLeave={e => { if (mm !== m) e.currentTarget.style.background = '' }}
              >
                {toFaTime(m)}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
