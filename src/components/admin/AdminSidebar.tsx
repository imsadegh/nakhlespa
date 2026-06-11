'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { LayoutDashboard, CalendarDays, Clock, LogOut } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const browserSupabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const links = [
  { href: '/admin/dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { href: '/admin/bookings',  label: 'رزروها',   icon: CalendarDays },
  { href: '/admin/schedule',  label: 'زمان‌بندی', icon: Clock },
]

export function AdminSidebar() {
  const path = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await browserSupabase.auth.signOut()
    router.push('/admin')
  }

  return (
    <Sidebar side="right" dir="rtl" collapsible="offcanvas">
      <SidebarHeader className="px-4 py-4">
        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          نخل<span className="text-[#C6A55B]">سپا</span>
        </span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {links.map(({ href, label, icon: Icon }) => {
                const active = path === href || path.startsWith(href + '/')
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      render={<Link href={href} />}
                      isActive={active}
                      tooltip={label}
                    >
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2 pb-4 flex flex-col gap-1">
        <ThemeToggle />
        <SidebarMenuButton onClick={handleLogout} className="w-full text-destructive hover:text-destructive">
          <LogOut />
          <span>خروج</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  )
}
