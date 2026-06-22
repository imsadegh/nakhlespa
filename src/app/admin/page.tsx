'use client'
import { useState } from 'react'
import { AmbientBackground } from '@/components/ui/AmbientBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

const inputClass = 'w-full glass rounded-xl px-4 py-3 text-sm bg-transparent outline-none focus:ring-1 focus:ring-[rgba(198,165,91,0.4)]'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { error: authError } = await authClient.signIn.email({
      email,
      password,
      callbackURL: '/admin/dashboard',
    })
    if (authError) {
      setError('ایمیل یا رمز اشتباه است')
      setLoading(false)
      return
    }
    router.push('/admin/dashboard')
  }

  return (
    <>
      <AmbientBackground />
      <div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-2xl font-bold mb-1 text-center" style={{ color: 'var(--text-primary)' }}>
            نخل<span className="text-[#C6A55B]">سپا</span>
          </div>
          <p className="text-xs text-center mb-8" style={{ color: 'var(--text-faint)' }}>پنل مدیریت</p>
          <GlassCard className="w-full p-6 space-y-3">
            <input
              className={inputClass}
              style={{ color: 'var(--text-primary)' }}
              type="email"
              placeholder="ایمیل"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <input
              className={inputClass}
              style={{ color: 'var(--text-primary)' }}
              type="password"
              placeholder="رمز عبور"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <GoldButton onClick={handleLogin} disabled={loading} className="w-full py-3 mt-2">
              {loading ? 'در حال ورود...' : 'ورود'}
            </GoldButton>
          </GlassCard>
        </div>
      </div>
    </>
  )
}
