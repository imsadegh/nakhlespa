import type { ReactNode } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AmbientBackground } from '@/components/ui/AmbientBackground'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { PageTransition } from '@/components/admin/PageTransition'

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '11rem',
          '--sidebar-width-mobile': '13rem',
        } as React.CSSProperties
      }
    >
      <AdminSidebar />
      <SidebarInset className="relative">
        <AmbientBackground />
        <div className="relative z-10">
          <header className="flex h-12 items-center gap-2 px-4 md:hidden">
            <SidebarTrigger />
          </header>
          <main className="p-6 max-w-4xl mx-auto w-full">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
