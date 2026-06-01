'use client'
import Link from 'next/link'
import { GoldButton } from './GoldButton'

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 bg-[rgba(4,16,11,0.45)] backdrop-blur-[48px] border-b border-white/[0.08] shadow-[0_1px_0_rgba(255,255,255,0.06),0_4px_24px_rgba(0,0,0,0.4)]">
      <div className="text-lg font-bold text-[#F3EFE8]">
        نخل<span className="text-[#C6A55B]">سپا</span>
      </div>
      <div className="flex gap-5">
        <Link href="#services" className="text-xs text-[#F3EFE8]/55 hover:text-[#F3EFE8] transition-colors">خدمات</Link>
        <Link href="#how" className="text-xs text-[#F3EFE8]/55 hover:text-[#F3EFE8] transition-colors">درباره ما</Link>
        <Link href="#contact" className="text-xs text-[#F3EFE8]/55 hover:text-[#F3EFE8] transition-colors">تماس</Link>
      </div>
      <Link href="/book">
        <GoldButton className="text-xs px-4 py-2">رزرو</GoldButton>
      </Link>
    </nav>
  )
}
