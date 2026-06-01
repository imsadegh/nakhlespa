'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'

const DAY_NAMES = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']

type Hour = { id: string; dayOfWeek: number; openTime: string; closeTime: string; isOpen: boolean }
type Block = { id: string; date: Date; startTime: string; endTime: string; reason: string | null }

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

  const inputClass = 'glass rounded-xl px-3 py-2 text-xs text-[#F3EFE8] bg-transparent outline-none focus:ring-1 focus:ring-[rgba(198,165,91,0.4)]'

  return (
    <div>
      <h1 className="text-xl font-light text-[#F3EFE8] mb-6">زمان‌بندی</h1>

      <h2 className="text-sm text-[#F3EFE8]/60 mb-3">ساعت کاری</h2>
      <div className="flex flex-col gap-2 mb-6">
        {localHours.map((h, i) => (
          <GlassCard key={h.id} className="flex items-center gap-3 p-3">
            <span className="text-xs text-[#F3EFE8]/60 w-16 flex-shrink-0">{DAY_NAMES[h.dayOfWeek]}</span>
            <input type="time" value={h.openTime}
              onChange={e => { const next = [...localHours]; next[i] = { ...h, openTime: e.target.value }; setLocalHours(next) }}
              className={inputClass} />
            <span className="text-[#F3EFE8]/30 text-xs">تا</span>
            <input type="time" value={h.closeTime}
              onChange={e => { const next = [...localHours]; next[i] = { ...h, closeTime: e.target.value }; setLocalHours(next) }}
              className={inputClass} />
            <button type="button"
              onClick={() => { const next = [...localHours]; next[i] = { ...h, isOpen: !h.isOpen }; setLocalHours(next) }}
              className={`text-[9px] px-2 py-1 rounded-full transition-all ${h.isOpen ? 'bg-[rgba(31,94,70,0.3)] text-[#4F6F52]' : 'bg-white/[0.08] text-[#F3EFE8]/30'}`}>
              {h.isOpen ? 'باز' : 'بسته'}
            </button>
          </GlassCard>
        ))}
      </div>
      <GoldButton onClick={saveHours} className="w-full mb-8">ذخیره ساعت‌ها</GoldButton>

      <h2 className="text-sm text-[#F3EFE8]/60 mb-3">مسدود کردن زمان</h2>
      <GlassCard className="p-4 mb-4 flex flex-col gap-3">
        <input type="date" value={newBlock.date} onChange={e => setNewBlock(b => ({ ...b, date: e.target.value }))} className={inputClass} />
        <div className="flex gap-2">
          <input type="time" value={newBlock.startTime} onChange={e => setNewBlock(b => ({ ...b, startTime: e.target.value }))} className={`${inputClass} flex-1`} />
          <input type="time" value={newBlock.endTime} onChange={e => setNewBlock(b => ({ ...b, endTime: e.target.value }))} className={`${inputClass} flex-1`} />
        </div>
        <input value={newBlock.reason} onChange={e => setNewBlock(b => ({ ...b, reason: e.target.value }))} placeholder="دلیل (اختیاری)" className={inputClass} />
        <GoldButton onClick={addBlock} className="w-full">افزودن بلاک</GoldButton>
      </GlassCard>

      <div className="flex flex-col gap-2">
        {blocks.map(b => (
          <GlassCard key={b.id} className="flex items-center gap-3 p-3">
            <div className="flex-1">
              <div className="text-xs text-[#F3EFE8]">
                {new Date(b.date.toISOString().split('T')[0] + 'T12:00:00').toLocaleDateString('fa-IR')}
                {' '}{b.startTime}–{b.endTime}
              </div>
              {b.reason && <div className="text-[10px] text-[#F3EFE8]/40">{b.reason}</div>}
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
