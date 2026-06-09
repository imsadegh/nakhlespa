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
    <aside className="w-48 p-4 flex flex-col gap-2 border-l border-border">
      <div className="text-sm font-bold mb-4 px-2 text-foreground">
        نخل<span className="text-[#C6A55B]">سپا</span>
      </div>
      {links.map(l => (
        <Link key={l.href} href={l.href}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all',
            path === l.href || path.startsWith(l.href + '/')
              ? 'glass-gold text-[#C6A55B]'
              : 'text-muted-foreground hover:bg-white/[0.05]'
          )}
        >
          <span>{l.icon}</span>{l.label}
        </Link>
      ))}
      <div className="flex-1" />
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all text-muted-foreground hover:bg-white/[0.05]"
      >
        <span>🚪</span>خروج
      </button>
    </aside>
  )
}
