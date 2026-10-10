'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, CalendarDays, Clock, Leaf, LogOut, PanelRightClose, PanelRightOpen, Tag } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { authClient } from '@/lib/auth-client'

const links = [
  { href: '/admin/dashboard',  label: 'داشبورد',   icon: LayoutDashboard },
  { href: '/admin/bookings',   label: 'رزروها',    icon: CalendarDays },
  { href: '/admin/schedule',   label: 'زمان‌بندی',  icon: Clock },
  { href: '/admin/discounts',  label: 'تخفیف‌ها',  icon: Tag },
]

export function AdminSidebar() {
  const path = usePathname()
  const router = useRouter()
  const { open, toggleSidebar } = useSidebar()

  async function handleLogout() {
    await authClient.signOut()
    router.push('/admin')
  }

  return (
    <Sidebar side="right" dir="rtl" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <div className="flex items-center gap-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary/15 text-sidebar-primary group-data-[collapsible=icon]:hidden">
            <Leaf className="size-[18px]" />
          </span>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <div className="text-base font-bold tracking-wide text-sidebar-foreground">
              نخل<span className="text-sidebar-primary">سپا</span>
            </div>
            <div className="text-[11px] text-sidebar-foreground/55">پنل مدیریت</div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label={open ? 'جمع کردن نوار کناری' : 'باز نگه داشتن نوار کناری'}
            title={open ? 'جمع کردن نوار کناری' : 'باز نگه داشتن نوار کناری'}
            className="hidden size-8 shrink-0 rounded-lg text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-primary md:inline-flex group-data-[collapsible=icon]:mx-auto"
          >
            {open ? <PanelRightClose /> : <PanelRightOpen />}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[11px] tracking-wide text-sidebar-foreground/45">ناوبری</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {links.map(({ href, label, icon: Icon }) => {
                const active = path === href || path.startsWith(href + '/')
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton
                      render={<Link href={href} />}
                      isActive={active}
                      size="lg"
                      tooltip={{ children: label, side: 'left' }}
                      className="h-11 rounded-xl px-3 text-[0.9rem] font-medium transition-colors data-[active=true]:border-r-2 data-[active=true]:border-sidebar-primary data-[active=true]:bg-sidebar-primary/12 data-[active=true]:font-semibold data-[active=true]:text-sidebar-primary"
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

      <SidebarFooter className="gap-2 border-t border-sidebar-border px-2 pb-4 pt-3">
        <ThemeToggle className="group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:[&_span]:hidden" />
        <SidebarMenuButton onClick={handleLogout} size="lg" className="h-11 rounded-xl px-3 text-destructive hover:bg-destructive/10 hover:text-destructive group-data-[collapsible=icon]:[&>span:last-child]:hidden">
          <LogOut />
          <span>خروج</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  )
}
