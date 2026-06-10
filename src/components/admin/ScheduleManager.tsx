'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/DatePicker'
import { TimePicker } from '@/components/ui/TimePicker'

const DAY_NAMES = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']

type Hour = { id: string; dayOfWeek: number; openTime: string; closeTime: string; isOpen: boolean }
type Block = { id: string; date: Date; startTime: string; endTime: string; reason: string | null }

function toFaDate(date: Date) {
  return new Date(date.toISOString().split('T')[0] + 'T12:00:00').toLocaleDateString('fa-IR')
}

// Convert HH:mm to Persian digits
function toFaTime(t: string) {
  return t.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

export function ScheduleManager({ hours, blocks }: { hours: Hour[]; blocks: Block[] }) {
  const [localHours, setLocalHours] = useState(hours)
  const [newBlock, setNewBlock] = useState({ date: '', startTime: '', endTime: '', reason: '' })
  const router = useRouter()

  async function saveHours() {
    await fetch('/api/admin/schedule/hours', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(localHours),
    })
    router.refresh()
  }

  async function addBlock() {
    if (!newBlock.date || !newBlock.startTime || !newBlock.endTime) return
    await fetch('/api/admin/schedule/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBlock),
    })
    setNewBlock({ date: '', startTime: '', endTime: '', reason: '' })
    router.refresh()
  }

  async function removeBlock(id: string) {
    await fetch(`/api/admin/schedule/block/${id}`, { method: 'DELETE' })
    router.refresh()
  }


  return (
    <div>
      <h1 className="text-xl font-light mb-6" style={{ color: 'var(--text-primary)' }}>زمان‌بندی</h1>

      <h2 className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>ساعت کاری</h2>
      <GlassCard className="mb-4 overflow-hidden">
        {localHours.map((h, i) => (
          <div key={h.id} className={`flex items-center gap-2 px-3 py-1.5 ${i < localHours.length - 1 ? 'border-b border-white/[0.06]' : ''}`}>
            <span className="w-14 flex-shrink-0" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{DAY_NAMES[h.dayOfWeek]}</span>
            <TimePicker value={h.openTime} onChange={v => { const next = [...localHours]; next[i] = { ...h, openTime: v }; setLocalHours(next) }} className="min-w-[90px]" />
            <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>تا</span>
            <TimePicker value={h.closeTime} onChange={v => { const next = [...localHours]; next[i] = { ...h, closeTime: v }; setLocalHours(next) }} className="min-w-[90px]" />
            <div className="flex-1" />
            <button type="button"
              onClick={() => { const next = [...localHours]; next[i] = { ...h, isOpen: !h.isOpen }; setLocalHours(next) }}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-all duration-150 min-w-[52px] ${
                h.isOpen
                  ? 'bg-[rgba(31,94,70,0.35)] text-[#6abf8a] border border-[rgba(74,180,120,0.3)] hover:bg-[rgba(31,94,70,0.5)]'
                  : 'bg-white/[0.08] border border-white/[0.14] hover:bg-white/[0.14]'
              }`}
              style={h.isOpen ? {} : { color: 'var(--text-muted)' }}>
              {h.isOpen ? 'باز' : 'بسته'}
            </button>
          </div>
        ))}
      </GlassCard>
      <GoldButton onClick={saveHours} className="w-full mb-6">ذخیره ساعت‌ها</GoldButton>

      <h2 className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>مسدود کردن زمان</h2>
      <GlassCard className="p-4 mb-4 flex flex-col gap-3">
        <DatePicker value={newBlock.date} onChange={v => setNewBlock(b => ({ ...b, date: v }))} />
        <div className="flex gap-2">
          <TimePicker value={newBlock.startTime} onChange={v => setNewBlock(b => ({ ...b, startTime: v }))} placeholder="از ساعت" className="flex-1" />
          <TimePicker value={newBlock.endTime} onChange={v => setNewBlock(b => ({ ...b, endTime: v }))} placeholder="تا ساعت" className="flex-1" />
        </div>
        <Input value={newBlock.reason} onChange={e => setNewBlock(b => ({ ...b, reason: e.target.value }))}
          placeholder="دلیل (اختیاری)" />
        <GoldButton onClick={addBlock} className="w-full">افزودن بلاک</GoldButton>
      </GlassCard>

      <div className="flex flex-col gap-2">
        {blocks.map(b => (
          <GlassCard key={b.id} className="flex items-center gap-3 p-3">
            <div className="flex-1">
              <div className="text-xs" style={{ color: 'var(--text-primary)' }}>
                {toFaDate(b.date)} {toFaTime(b.startTime)}–{toFaTime(b.endTime)}
              </div>
              {b.reason && <div className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{b.reason}</div>}
            </div>
            <button type="button" onClick={() => removeBlock(b.id)} className="text-red-400 text-xs hover:text-red-300 transition-colors">
              حذف
            </button>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
