'use client'
import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import { GhostButton } from '@/components/ui/GhostButton'
import type { DiscountCodeDTO } from '@/types'

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
      <GlassCard className="p-5 space-y-3">
        <h2 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>کد تخفیف جدید</h2>
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="کد (مثلاً SUMMER10)"
            value={form.code}
            onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
            className="col-span-2 text-xs px-3 py-2 rounded-lg bg-white/5 border border-white/10 outline-none"
            style={{ color: 'var(--text-primary)', direction: 'ltr' }}
          />
          <select
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value as 'PERCENT' | 'FIXED' }))}
            className="text-xs px-3 py-2 rounded-lg bg-white/5 border border-white/10 outline-none"
            style={{ color: 'var(--text-primary)' }}
          >
            <option value="PERCENT">درصدی</option>
            <option value="FIXED">مبلغ ثابت (تومان)</option>
          </select>
          <input
            placeholder={form.type === 'PERCENT' ? 'مقدار (مثلاً ۲۰)' : 'مبلغ تومان'}
            value={form.value}
            onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
            type="number"
            className="text-xs px-3 py-2 rounded-lg bg-white/5 border border-white/10 outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
          <input
            placeholder="حداکثر تعداد استفاده (اختیاری)"
            value={form.maxUses}
            onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
            type="number"
            className="text-xs px-3 py-2 rounded-lg bg-white/5 border border-white/10 outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
          <input
            placeholder="تاریخ انقضا (اختیاری)"
            value={form.expiresAt}
            onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
            type="date"
            className="text-xs px-3 py-2 rounded-lg bg-white/5 border border-white/10 outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <GoldButton onClick={handleCreate} disabled={creating || !form.code || !form.value} className="w-full">
          {creating ? 'در حال ایجاد...' : 'ایجاد کد تخفیف'}
        </GoldButton>
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
                  <td className="px-4 py-3 font-mono" style={{ color: 'var(--text-primary)' }}>
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
