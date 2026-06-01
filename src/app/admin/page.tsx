'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { AmbientBackground } from '@/components/ui/AmbientBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import { useRouter } from 'next/navigation'

// createBrowserClient stores session in cookies (not localStorage) so proxy.ts can read it
const browserSupabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const inputClass = 'w-full glass rounded-xl px-4 py-3 text-sm text-[#F3EFE8] placeholder:text-[#F3EFE8]/30 bg-transparent outline-none focus:ring-1 focus:ring-[rgba(198,165,91,0.4)]'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { error } = await browserSupabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('ایمیل یا رمز اشتباه است')
      setLoading(false)
      return
    }
    router.push('/admin/dashboard')
  }

  return (
    <>
      <AmbientBackground />
      <div className="relative z-10 max-w-sm mx-auto min-h-screen flex flex-col items-center justify-center px-6">
        <div className="text-2xl font-bold text-[#F3EFE8] mb-1">نخل<span className="text-[#C6A55B]">سپا</span></div>
        <p className="text-xs text-[#F3EFE8]/40 mb-8">پنل مدیریت</p>
        <GlassCard className="w-full p-6 space-y-3">
          <input className={inputClass} type="email" placeholder="ایمیل" value={email} onChange={e => setEmail(e.target.value)} />
          <input className={inputClass} type="password" placeholder="رمز عبور" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <GoldButton onClick={handleLogin} disabled={loading} className="w-full py-3 mt-2">
            {loading ? 'در حال ورود...' : 'ورود'}
          </GoldButton>
        </GlassCard>
      </div>
    </>
  )
}
