// src/app/layout.tsx
import type { Metadata } from 'next'
import { Vazirmatn } from 'next/font/google'
import './globals.css'
import { startCronJobs } from '@/lib/cron'

// Only instance 0 runs the cron to prevent duplicate SMS sends in cluster mode
if (process.env.NODE_ENV === 'production' && typeof window === 'undefined' && process.env.NODE_APP_INSTANCE === '0') {
  startCronJobs()
}

const vazir = Vazirmatn({ subsets: ['arabic'], variable: '--font-vazir', display: 'swap' })

export const metadata: Metadata = {
  title: 'نخلسپا — رزرو آنلاین ماساژ',
  description: 'رزرو آنلاین خدمات ماساژ درمانی و آرامش‌بخش نخلسپا',
}

// This script is a hardcoded string with no user input — safe from XSS
const themeInitScript = `(function(){var t=localStorage.getItem('theme');if(t&&t!=='auto')document.documentElement.setAttribute('data-theme',t)})()`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={vazir.variable}>
      <head>
        {/* eslint-disable-next-line react/no-danger */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-vazir antialiased" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        {children}
      </body>
    </html>
  )
}
