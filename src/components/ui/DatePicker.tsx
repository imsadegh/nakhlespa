'use client'

import * as React from 'react'
import { format, getDate } from 'date-fns-jalali'
import { faIR } from 'date-fns-jalali/locale'
import { defaultLocale } from 'react-day-picker'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { CalendarIcon } from 'lucide-react'

// Merge faIR with the labels required by react-day-picker v10
const jalaliLocale = { ...faIR, labels: defaultLocale.labels }

interface DatePickerProps {
  value: string        // YYYY-MM-DD (Gregorian)
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

function toFaDate(iso: string) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return format(new Date(Date.UTC(y, m - 1, d) + 12 * 3600000), 'yyyy/MM/dd', { locale: faIR })
}

export function DatePicker({ value, onChange, placeholder = 'انتخاب تاریخ', className }: DatePickerProps) {
  const selected = value ? new Date(value + 'T12:00:00') : undefined

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          'flex items-center gap-2 w-full rounded-xl px-3 py-2 text-xs transition-all duration-150 cursor-pointer',
          'bg-white/[0.10] backdrop-blur-sm border border-white/[0.18] hover:bg-white/[0.16] hover:border-[rgba(198,165,91,0.5)]',
          'focus:outline-none focus:border-[rgba(198,165,91,0.6)] focus:ring-1 focus:ring-[rgba(198,165,91,0.3)]',
          className
        )}
      >
        <CalendarIcon className="size-3.5 shrink-0" style={{ color: 'var(--text-muted)' }} />
        <span style={{ color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {value ? toFaDate(value) : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 shadow-2xl rounded-xl overflow-hidden"
        style={{
          background: 'var(--picker-bg)',
          borderColor: 'var(--picker-border)',
          backdropFilter: 'blur(24px)',
        }}
        align="start"
        side="bottom"
      >
        <Calendar
          mode="single"
          selected={selected}
          onSelect={day => {
            if (!day) return
            const y = day.getFullYear()
            const m = String(day.getMonth() + 1).padStart(2, '0')
            const d = String(day.getDate()).padStart(2, '0')
            onChange(`${y}-${m}-${d}`)
          }}
          locale={jalaliLocale}
          weekStartsOn={6}
          formatters={{
            formatCaption: (date) => format(date, 'LLLL yyyy', { locale: faIR }),
            formatWeekdayName: (date) => format(date, 'EEEEE', { locale: faIR }),
            formatMonthDropdown: (date) => format(date, 'LLLL', { locale: faIR }),
            formatDay: (date) => getDate(date).toLocaleString('fa-IR'),
          }}
          className="[--cell-size:--spacing(8)] bg-transparent p-3"
          classNames={{
            day: 'rounded-lg',
            today: 'bg-[rgba(198,165,91,0.15)] text-[#C6A55B] rounded-lg',
            caption_label: 'text-sm font-medium',
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
