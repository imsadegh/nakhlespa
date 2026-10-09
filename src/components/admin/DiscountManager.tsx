'use client'
import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import { GhostButton } from '@/components/ui/GhostButton'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/DatePicker'
import { TicketPercent } from 'lucide-react'
import type { DiscountCodeDTO } from '@/types'

const discountTypeItems = [
  { value: 'PERCENT', label: 'درصدی' },
  { value: 'FIXED', label: 'مبلغ ثابت (تومان)' },
]

export function DiscountManager({ initial }: { initial: DiscountCodeDTO[] }) {
  const [codes, setCodes] = useState(initial)
  const [form, setForm] = useState({ code: '', type: 'PERCENT' as 'PERCENT' | 'FIXED', value: '', maxUses: '', expiresAt: '' })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    setError('')
    setCreating(true)
    const res = await fetch('/api/admin/discounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: form.code,
        type: form.type,
        value: Number(form.value),
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        expiresAt: form.expiresAt || undefined,
      }),
    })
    setCreating(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'خطا در ایجاد کد')
      return
    }
    const newCode = await res.json()
    setCodes(prev => [newCode, ...prev])
    setForm({ code: '', type: 'PERCENT', value: '', maxUses: '', expiresAt: '' })
  }

  async function handleToggle(id: string) {
    const res = await fetch(`/api/admin/discounts/${id}`, { method: 'PATCH' })
    if (!res.ok) return
    const updated = await res.json()
    setCodes(prev => prev.map(c => c.id === id ? updated : c))
  }

  return (
    <div className="space-y-6">
      <GlassCard className="space-y-5 p-5 sm:p-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#d4b368]/25 bg-[#d4b368]/10 text-[#e0c276]">
            <TicketPercent aria-hidden="true" className="size-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>کد تخفیف جدید</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>جزئیات کد، میزان تخفیف و زمان اعتبار را وارد کنید.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-2 sm:col-span-2">
            <Label htmlFor="discount-code">کد تخفیف</Label>
            <Input
              id="discount-code"
              placeholder="مثلاً SUMMER10"
              value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
              className="text-xs"
              dir="ltr"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <Label htmlFor="discount-type">نوع تخفیف</Label>
            <Select
              items={discountTypeItems}
              value={form.type}
              onValueChange={value => {
                if (value === 'PERCENT' || value === 'FIXED') setForm(f => ({ ...f, type: value }))
              }}
            >
              <SelectTrigger id="discount-type" className="glass data-[size=default]:h-10 w-full rounded-xl border-0 bg-transparent px-4 py-3 text-xs focus-visible:ring-1 focus-visible:ring-ring">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="PERCENT">درصدی</SelectItem>
                  <SelectItem value="FIXED">مبلغ ثابت (تومان)</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <Label htmlFor="discount-value">مقدار</Label>
            <Input
              id="discount-value"
              placeholder={form.type === 'PERCENT' ? 'مثلاً ۲۰' : 'مبلغ تومان'}
              value={form.value}
              onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
              type="number"
              className="text-xs"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <Label htmlFor="discount-max-uses">حداکثر تعداد استفاده (اختیاری)</Label>
            <Input
              id="discount-max-uses"
              placeholder="بدون محدودیت"
              value={form.maxUses}
              onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
              type="number"
              className="text-xs"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <Label htmlFor="discount-expires-at">تاریخ انقضا (اختیاری)</Label>
            <DatePicker
              id="discount-expires-at"
              value={form.expiresAt}
              onChange={value => setForm(f => ({ ...f, expiresAt: value }))}
              placeholder="انتخاب تاریخ"
              className="glass h-10 border-0 bg-transparent px-4 py-3 text-xs"
            />
          </div>
        </div>
        {error && <p className="text-xs text-red-400" role="alert">{error}</p>}
        <div className="flex justify-start border-t border-white/10 pt-4">
          <GoldButton onClick={handleCreate} disabled={creating || !form.code || !form.value} className="w-full sm:w-auto sm:min-w-44">
            {creating ? 'در حال ایجاد...' : 'ایجاد کد تخفیف'}
          </GoldButton>
        </div>
      </GlassCard>

      <GlassCard className="p-0 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/10">
              {['کد', 'نوع', 'مقدار', 'استفاده', 'انقضا', 'وضعیت', ''].map(h => (
                <th key={h} className="px-4 py-3 text-right font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {codes.map(c => {
              const isLoyalty = c.code === 'LOYALTY_AUTO'
              return (
                <tr key={c.id} className="border-b border-white/5">
                  <td className={`px-4 py-3 ${isLoyalty ? '' : 'font-mono'}`} style={{ color: 'var(--text-primary)' }}>
                    {isLoyalty ? 'تخفیف وفاداری (خودکار)' : c.code}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                    {c.type === 'PERCENT' ? 'درصدی' : 'ثابت'}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                    {c.type === 'PERCENT' ? `${c.value}٪` : `${c.value.toLocaleString('fa-IR')} ت`}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                    {c.usedCount.toLocaleString('fa-IR')} / {c.maxUses === null ? '∞' : c.maxUses.toLocaleString('fa-IR')}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text-muted)' }}>
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('fa-IR') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.isActive ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'}`}>
                      {c.isActive ? 'فعال' : 'غیرفعال'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {!isLoyalty && (
                      <GhostButton onClick={() => handleToggle(c.id)} className="text-[10px] px-2 py-1">
                        {c.isActive ? 'غیرفعال کن' : 'فعال کن'}
                      </GhostButton>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </GlassCard>
    </div>
  )
}
