// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { startCronJobs } from '@/lib/cron'
import { Toaster } from '@/components/ui/sonner'

// Only instance 0 runs the cron to prevent duplicate SMS sends in cluster mode
if (process.env.NODE_ENV === 'production' && typeof window === 'undefined' && process.env.NODE_APP_INSTANCE === '0') {
  startCronJobs()
}

const vazir = localFont({
  src: '../../public/fonts/Vazirmatn[wght].woff2',
  variable: '--font-vazir',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'نخلسپا — رزرو آنلاین ماساژ',
  description: 'رزرو آنلاین خدمات ماساژ درمانی و آرامش‌بخش نخلسپا',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

// This script is a hardcoded string with no user input — safe from XSS
const themeInitScript = `(function(){var t=localStorage.getItem('theme');var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var isDark=t==='dark'||((!t||t==='auto')&&prefersDark);if(t&&t!=='auto')document.documentElement.setAttribute('data-theme',t);if(isDark)document.documentElement.classList.add('dark')})()`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={vazir.variable} suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-vazir antialiased" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        {children}
        <Toaster position="bottom-center" dir="rtl" richColors />
      </body>
    </html>
  )
}
