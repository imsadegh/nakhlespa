// src/app/layout.tsx
import type { Metadata } from 'next'
import { Vazirmatn } from 'next/font/google'
import './globals.css'

const vazir = Vazirmatn({ subsets: ['arabic'], variable: '--font-vazir', display: 'swap' })

export const metadata: Metadata = {
  title: 'نخلسپا — رزرو آنلاین ماساژ',
  description: 'رزرو آنلاین خدمات ماساژ درمانی و آرامش‌بخش نخلسپا',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={vazir.variable}>
      <body className="font-vazir bg-bg-base text-cream antialiased">{children}</body>
    </html>
  )
}
