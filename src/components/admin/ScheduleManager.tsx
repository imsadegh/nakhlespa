'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import { DatePicker } from '@/components/ui/DatePicker'
import { TimePicker } from '@/components/ui/TimePicker'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CalendarDays, Clock3, LockKeyhole, Trash2 } from 'lucide-react'

const DAY_NAMES = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']

type Hour = { id: string; dayOfWeek: number; gender: 'FEMALE' | 'MALE'; openTime: string; closeTime: string; isOpen: boolean }
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
  const [activeTab, setActiveTab] = useState<'FEMALE' | 'MALE'>('FEMALE')
  const router = useRouter()

  const tabHours = localHours.filter(h => h.gender === activeTab)

  function updateHour(id: string, patch: Partial<Hour>) {
    setLocalHours(prev => prev.map(h => h.id === id ? { ...h, ...patch } : h))
  }

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
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>زمان‌بندی</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>ساعت کاری هفتگی و زمان‌های خارج از دسترس را مدیریت کنید.</p>
      </header>

      <GlassCard className="overflow-hidden p-0">
        <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#d4b368]/25 bg-[#d4b368]/10 text-[#e0c276]">
              <Clock3 aria-hidden="true" className="size-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>ساعت کاری هفتگی</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>برای هر روز، بازه حضور و وضعیت پذیرش را تنظیم کنید.</p>
            </div>
          </div>
          <div className="flex w-fit gap-1 rounded-xl border border-white/10 bg-black/10 p-1" role="tablist" aria-label="جنسیت ساعت کاری">
            {([{ value: 'FEMALE', label: 'خانم' }, { value: 'MALE', label: 'آقا' }] as const).map(tab => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.value}
                onClick={() => setActiveTab(tab.value)}
                className="rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4b368]"
                style={activeTab === tab.value ? (
                  tab.value === 'FEMALE'
                    ? { background: 'rgba(244,114,182,0.15)', color: '#f472b6' }
                    : { background: 'rgba(147,197,253,0.15)', color: '#93c5fd' }
                ) : { color: 'var(--text-muted)' }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b" style={{ borderColor: 'var(--border-base)' }}>
                <TableHead className="px-5 py-3 text-sm font-medium" style={{ color: 'var(--text-faint)' }}>روز</TableHead>
                <TableHead className="px-3 py-3 text-sm font-medium" style={{ color: 'var(--text-faint)' }}>شروع</TableHead>
                <TableHead className="px-3 py-3 text-sm font-medium" style={{ color: 'var(--text-faint)' }}>پایان</TableHead>
                <TableHead className="px-5 py-3 text-left text-sm font-medium" style={{ color: 'var(--text-faint)' }}>وضعیت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tabHours.map(h => (
                <TableRow key={h.id} className="border-b last:border-0" style={{ borderColor: 'var(--border-base)' }}>
                  <TableCell className="whitespace-nowrap px-5 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {DAY_NAMES[h.dayOfWeek]}
                  </TableCell>
                  <TableCell className="min-w-32 px-3 py-2">
                    <TimePicker value={h.openTime} onChange={v => updateHour(h.id, { openTime: v })} className="h-10 min-w-28 justify-center text-sm" />
                  </TableCell>
                  <TableCell className="min-w-32 px-3 py-2">
                    <TimePicker value={h.closeTime} onChange={v => updateHour(h.id, { closeTime: v })} className="h-10 min-w-28 justify-center text-sm" />
                  </TableCell>
                  <TableCell className="px-5 py-2 text-left">
                    <button type="button"
                      onClick={() => updateHour(h.id, { isOpen: !h.isOpen })}
                      aria-label={`${DAY_NAMES[h.dayOfWeek]}: ${h.isOpen ? 'باز' : 'بسته'}`}
                      className="inline-flex min-w-16 items-center justify-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4b368]"
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-start border-t border-white/10 p-4 sm:px-6">
          <GoldButton onClick={saveHours} className="w-full sm:w-auto sm:min-w-44">ذخیره ساعت‌ها</GoldButton>
        </div>
      </GlassCard>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#d4b368]/25 bg-[#d4b368]/10 text-[#e0c276]">
            <LockKeyhole aria-hidden="true" className="size-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>مسدود کردن زمان</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>برای تعطیلی یا زمان‌های رزرو‌نشده، یک بازه مشخص کنید.</p>
          </div>
        </div>

        <GlassCard className="space-y-5 p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-2">
              <Label htmlFor="block-date">تاریخ</Label>
              <DatePicker id="block-date" value={newBlock.date} onChange={v => setNewBlock(b => ({ ...b, date: v }))} className="h-10 w-full" />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <Label htmlFor="block-reason">دلیل <span className="font-normal" style={{ color: 'var(--text-faint)' }}>(اختیاری)</span></Label>
              <input
                id="block-reason"
                value={newBlock.reason}
                onChange={e => setNewBlock(b => ({ ...b, reason: e.target.value }))}
                placeholder="مثلاً تعطیلی مجموعه"
                className="glass flex h-10 w-full rounded-xl border-0 bg-transparent px-4 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <Label htmlFor="block-start">از ساعت</Label>
              <TimePicker id="block-start" value={newBlock.startTime} onChange={v => setNewBlock(b => ({ ...b, startTime: v }))} placeholder="انتخاب ساعت" className="h-10 w-full text-sm" />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <Label htmlFor="block-end">تا ساعت</Label>
              <TimePicker id="block-end" value={newBlock.endTime} onChange={v => setNewBlock(b => ({ ...b, endTime: v }))} placeholder="انتخاب ساعت" className="h-10 w-full text-sm" />
            </div>
          </div>
          <div className="flex justify-start border-t border-white/10 pt-4">
            <GoldButton onClick={addBlock} className="w-full sm:w-auto sm:min-w-44">افزودن بازه مسدود</GoldButton>
          </div>
        </GlassCard>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5" style={{ color: 'var(--text-muted)' }}>
            <CalendarDays aria-hidden="true" className="size-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>بازه‌های مسدودشده</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>زمان‌هایی که امکان رزرو ندارند.</p>
          </div>
        </div>
        <GlassCard className="divide-y divide-white/10 p-0">
          {blocks.length === 0 ? (
            <p className="p-5 text-sm" style={{ color: 'var(--text-muted)' }}>هنوز بازه‌ای مسدود نشده است.</p>
          ) : blocks.map(b => (
            <div key={b.id} className="flex items-center gap-3 p-4 sm:px-5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/5" style={{ color: 'var(--text-muted)' }}>
                <CalendarDays aria-hidden="true" className="size-4" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {toFaDate(b.date)} <span dir="ltr" className="inline-block">{toFaTime(b.startTime)}–{toFaTime(b.endTime)}</span>
                </div>
                {b.reason && <div className="truncate text-xs" style={{ color: 'var(--text-faint)' }}>{b.reason}</div>}
              </div>
              <button type="button" onClick={() => removeBlock(b.id)} aria-label="حذف بازه مسدودشده" className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-400/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
                <Trash2 aria-hidden="true" className="size-4" />
              </button>
            </div>
          ))}
        </GlassCard>
      </section>
    </div>
  )
}
