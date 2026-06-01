'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const links = [
  { href: '/admin/dashboard', label: 'داشبورد', icon: '📊' },
  { href: '/admin/bookings', label: 'رزروها', icon: '📅' },
  { href: '/admin/schedule', label: 'زمان‌بندی', icon: '🕐' },
]

export function AdminSidebar() {
  const path = usePathname()
  return (
    <aside className="w-48 p-4 flex flex-col gap-2 border-l border-white/[0.08]">
      <div className="text-sm font-bold text-[#F3EFE8] mb-4 px-2">نخل<span className="text-[#C6A55B]">سپا</span></div>
      {links.map(l => (
        <Link key={l.href} href={l.href}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all',
            path.startsWith(l.href) ? 'glass-gold text-[#C6A55B]' : 'text-[#F3EFE8]/50 hover:text-[#F3EFE8] hover:bg-white/[0.05]'
          )}>
          <span>{l.icon}</span>{l.label}
        </Link>
      ))}
    </aside>
  )
}
