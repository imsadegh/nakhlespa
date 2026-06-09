import type { ReactNode } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AmbientBackground } from '@/components/ui/AmbientBackground'

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AmbientBackground />
      <div className="relative z-10 flex min-h-screen max-w-5xl mx-auto">
        <AdminSidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </>
  )
}
