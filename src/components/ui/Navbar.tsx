import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'
import { NavBookButton } from './NavBookButton'

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 py-3.5
      backdrop-blur-[48px] border-b border-white/[0.08]
      shadow-[0_1px_0_rgba(255,255,255,0.06),0_4px_24px_rgba(0,0,0,0.25)]"
      style={{ backgroundColor: 'color-mix(in srgb, var(--bg-base) 70%, transparent)' }}>

      <Link href="/" className="text-lg font-bold hover:opacity-80 transition-opacity"
        style={{ color: 'var(--text-primary)' }}>
        نخل<span className="text-[#C6A55B]">سپا</span>
      </Link>

      <div className="hidden sm:flex gap-5">
        <Link href="/#services" className="text-xs transition-colors hover:text-[#C6A55B]"
          style={{ color: 'var(--text-muted)' }}>خدمات</Link>
        <Link href="/#how" className="text-xs transition-colors hover:text-[#C6A55B]"
          style={{ color: 'var(--text-muted)' }}>درباره ما</Link>
        <Link href="/#contact" className="text-xs transition-colors hover:text-[#C6A55B]"
          style={{ color: 'var(--text-muted)' }}>تماس</Link>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NavBookButton />
      </div>
    </nav>
  )
}
