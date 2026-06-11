'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import { DatePicker } from '@/components/ui/DatePicker'
import { TimePicker } from '@/components/ui/TimePicker'

const DAY_NAMES = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']

type Hour = { id: string; dayOfWeek: number; openTime: string; closeTime: string; isOpen: boolean }
type Block = { id: string; date: Date; startTime: string; endTime: string; reason: string | null }

function toFaDate(date: Date) {
  return new Date(date.toISOString().split('T')[0] + 'T12:00:00').toLocaleDateString('fa-IR')
}

function toFaTime(t: string) {
  return t.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

export function ScheduleManager({ hours, blocks }: { hours: Hour[]; blocks: Block[] }) {
  const [localHours, setLocalHours] = useState(hours)
  const [newBlock, setNewBlock] = useState({ date: '', startTime: '', endTime: '', reason: '' })
  const router = useRouter()

  async function saveHours() {
    const res = await fetch('/api/admin/schedule/hours', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(localHours),
    })
    if (res.ok) toast.success('ساعت کاری ذخیره شد')
    else toast.error('خطا در ذخیره‌سازی')
    router.refresh()
  }

  async function addBlock() {
    if (!newBlock.date || !newBlock.startTime || !newBlock.endTime) {
      toast.error('تاریخ و ساعت را تکمیل کنید')
      return
    }
    const res = await fetch('/api/admin/schedule/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBlock),
    })
    if (res.ok) {
      toast.success('بازه مسدود شد')
      setNewBlock({ date: '', startTime: '', endTime: '', reason: '' })
    } else {
      toast.error('خطا در افزودن بلاک')
    }
    router.refresh()
  }

  async function removeBlock(id: string) {
    const res = await fetch(`/api/admin/schedule/block/${id}`, { method: 'DELETE' })
    if (res.ok) toast.success('بلاک حذف شد')
    else toast.error('خطا در حذف')
    router.refresh()
  }

  return (
    <div>
      <h1 className="text-xl font-light mb-6" style={{ color: 'var(--text-primary)' }}>زمان‌بندی</h1>

      <h2 className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>ساعت کاری</h2>
      <GlassCard className="mb-4 overflow-hidden">
        {localHours.map((h, i) => (
          <div key={h.id} className={`flex items-center gap-2 px-3 py-1.5 ${i < localHours.length - 1 ? 'border-b' : ''}`} style={{ borderColor: 'var(--border-base)' }}>
            <span className="w-14 flex-shrink-0" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{DAY_NAMES[h.dayOfWeek]}</span>
            <TimePicker value={h.openTime} onChange={v => { const next = [...localHours]; next[i] = { ...h, openTime: v }; setLocalHours(next) }} className="min-w-[90px]" />
            <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>تا</span>
            <TimePicker value={h.closeTime} onChange={v => { const next = [...localHours]; next[i] = { ...h, closeTime: v }; setLocalHours(next) }} className="min-w-[90px]" />
            <div className="flex-1" />
            <button type="button"
              onClick={() => { const next = [...localHours]; next[i] = { ...h, isOpen: !h.isOpen }; setLocalHours(next) }}
              className="inline-flex items-center justify-center text-xs px-3 py-1 rounded-full font-medium transition-all duration-150 min-w-[52px] border"
              style={h.isOpen ? {
                background: 'rgba(31,94,70,0.20)',
                borderColor: 'rgba(74,180,120,0.35)',
                color: 'var(--color-green-soft)',
              } : {
                background: 'var(--glass-bg)',
                borderColor: 'var(--border-base)',
                color: 'var(--text-muted)',
              }}>
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
        {/* Reason input styled to match DatePicker/TimePicker triggers */}
        <input
          value={newBlock.reason}
          onChange={e => setNewBlock(b => ({ ...b, reason: e.target.value }))}
          placeholder="دلیل (اختیاری)"
          className="flex w-full rounded-xl px-3 py-2 text-xs transition-all duration-150 cursor-text outline-none"
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--border-base)',
            color: newBlock.reason ? 'var(--text-primary)' : undefined,
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(198,165,91,0.6)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-base)' }}
        />
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
