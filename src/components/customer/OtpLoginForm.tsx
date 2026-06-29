'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'

export function OtpLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/my/bookings'

  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSend() {
    setError('')
    if (!/^09\d{9}$/.test(phone)) {
      setError('شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد')
      return
    }
    setLoading(true)
    const res = await fetch('/api/customer/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    })
    setLoading(false)
    if (res.status === 429) {
      setError('تعداد درخواست بیش از حد مجاز است. لطفاً ۱۰ دقیقه صبر کنید.')
      return
    }
    if (!res.ok) {
      setError('خطا در ارسال کد. دوباره تلاش کنید.')
      return
    }
    setStep('otp')
  }

  async function handleVerify() {
    setError('')
    setLoading(true)
    const res = await fetch('/api/customer/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    })
    setLoading(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error === 'expired' ? 'کد منقضی شده است. دوباره درخواست دهید.' : 'کد وارد شده اشتباه است.')
      return
    }
    router.push(next)
  }

  return (
    <GlassCard className="w-full max-w-sm p-6 space-y-4">
      <h1 className="text-lg font-light text-center" style={{ color: 'var(--text-primary)' }}>
        ورود به حساب کاربری
      </h1>

      {step === 'phone' ? (
        <>
          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            شماره موبایل خود را وارد کنید
          </p>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="۰۹۱۲۱۲۳۴۵۶۷"
            className="w-full text-sm px-4 py-3 rounded-lg bg-white/5 border border-white/10 outline-none text-center"
            style={{ color: 'var(--text-primary)', direction: 'ltr' }}
            maxLength={11}
          />
          <GoldButton onClick={handleSend} className="w-full" disabled={loading}>
            {loading ? 'در حال ارسال...' : 'ارسال کد'}
          </GoldButton>
        </>
      ) : (
        <>
          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            کد ۶ رقمی ارسال شده به {phone} را وارد کنید
          </p>
          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="_ _ _ _ _ _"
            className="w-full text-lg tracking-widest px-4 py-3 rounded-lg bg-white/5 border border-white/10 outline-none text-center"
            style={{ color: 'var(--text-primary)', direction: 'ltr' }}
            maxLength={6}
          />
          <GoldButton onClick={handleVerify} className="w-full" disabled={loading || code.length !== 6}>
            {loading ? 'در حال بررسی...' : 'تأیید و ورود'}
          </GoldButton>
          <button
            type="button"
            onClick={() => { setStep('phone'); setCode(''); setError('') }}
            className="w-full text-xs underline"
            style={{ color: 'var(--text-muted)' }}
          >
            تغییر شماره
          </button>
        </>
      )}

      {error && <p className="text-xs text-red-400 text-center">{error}</p>}
    </GlassCard>
  )
}
