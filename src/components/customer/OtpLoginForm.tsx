'use client'
import { useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import { createOtpRequestGate, getOtpErrorMessage, isOtpCode, normalizeOtpDigits } from '@/lib/customer-otp'

export function OtpLoginForm({ onAuthenticated, compact = false }: { onAuthenticated?: () => void; compact?: boolean } = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawNext = searchParams.get('next') ?? ''
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/my/bookings'

  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [devOtp, setDevOtp] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const verifyGate = useRef(createOtpRequestGate())

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
    const data = await res.json() as { devOtp?: string }
    setDevOtp(data.devOtp ?? null)
    setStep('otp')
  }

  async function handleVerify() {
    setError('')
    if (!isOtpCode(code)) {
      setError('کد باید ۶ رقم باشد')
      return
    }
    if (!verifyGate.current.tryStart()) return

    setLoading(true)
    try {
      const res = await fetch('/api/customer/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(getOtpErrorMessage(data.error))
        return
      }
      if (onAuthenticated) onAuthenticated()
      else router.push(next)
    } finally {
      verifyGate.current.finish()
      setLoading(false)
    }
  }

  return (
    <GlassCard className={`mx-auto flex w-full max-w-md flex-col gap-4 ${compact ? 'p-5' : 'p-6'}`}>
      {/* <h2 className={`${compact ? 'text-base' : 'text-lg'} text-center font-light`} style={{ color: 'var(--text-primary)' }}>
        ورود به حساب کاربری
      </h2> */}

      {step === 'phone' ? (
        <>
          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            شماره موبایل خود را وارد کنید
          </p>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(normalizeOtpDigits(e.target.value))}
            placeholder="۰۹۱۲۱۲۳۴۵۶۷"
            className="w-full rounded-lg border border-border/70 bg-background/40 px-4 py-3 text-center text-sm outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring"
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
          {devOtp && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-center" role="status">
              <p className="text-[11px] text-muted-foreground">کد تست محیط توسعه</p>
              <p className="mt-1 font-mono text-lg font-semibold tracking-[0.3em] text-foreground" dir="ltr">{devOtp}</p>
            </div>
          )}
          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={e => setCode(normalizeOtpDigits(e.target.value).replace(/\D/g, ''))}
            placeholder="_ _ _ _ _ _"
            className="w-full rounded-lg border border-border/70 bg-background/40 px-4 py-3 text-center text-lg tracking-widest outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring"
            style={{ color: 'var(--text-primary)', direction: 'ltr' }}
            maxLength={6}
          />
          <GoldButton onClick={handleVerify} className="w-full" disabled={loading || !isOtpCode(code)}>
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
