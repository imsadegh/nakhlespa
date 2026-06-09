'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { cn } from '@/lib/utils'

const browserSupabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const links = [
  { href: '/admin/dashboard', label: 'داشبورد', icon: '📊' },
  { href: '/admin/bookings', label: 'رزروها', icon: '📅' },
  { href: '/admin/schedule', label: 'زمان‌بندی', icon: '🕐' },
]

export function AdminSidebar() {
  const path = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await browserSupabase.auth.signOut()
    router.push('/admin')
  }

  return (
    <aside className="w-48 p-4 flex flex-col gap-2 border-l" style={{ borderColor: 'var(--border-base)' }}>
      <div className="text-sm font-bold mb-4 px-2" style={{ color: 'var(--text-primary)' }}>
        نخل<span className="text-[#C6A55B]">سپا</span>
      </div>
      {links.map(l => (
        <Link key={l.href} href={l.href}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all',
            path === l.href || path.startsWith(l.href + '/')
              ? 'glass-gold text-[#C6A55B]'
              : 'hover:bg-white/[0.05]'
          )}
          style={path === l.href || path.startsWith(l.href + '/') ? {} : { color: 'var(--text-muted)' }}
        >
          <span>{l.icon}</span>{l.label}
        </Link>
      ))}
      <div className="flex-1" />
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all hover:bg-white/[0.05]"
        style={{ color: 'var(--text-muted)' }}
      >
        <span>🚪</span>خروج
      </button>
    </aside>
  )
}
