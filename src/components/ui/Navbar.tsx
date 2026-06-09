import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'
import { NavBookButton } from './NavBookButton'

export function Navbar() {
  return (
    <div className="fixed top-0 inset-x-0 z-50 flex justify-center px-4 pt-3 pointer-events-none">
    <nav className="w-full max-w-screen-xl flex items-center justify-between px-5 sm:px-7 py-3
      rounded-2xl pointer-events-auto
      backdrop-blur-[48px] saturate-150
      border shadow-[0_8px_32px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.18)]"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-base) 72%, transparent)',
        borderColor: 'var(--border-base)',
      }}>

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
    </div>
  )
}
