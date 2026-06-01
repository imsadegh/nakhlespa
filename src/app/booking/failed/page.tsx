import { AmbientBackground } from '@/components/ui/AmbientBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import Link from 'next/link'

export default function FailedPage() {
  return (
    <>
      <AmbientBackground />
      <div className="relative z-10 max-w-lg mx-auto min-h-screen flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 rounded-full glass flex items-center justify-center text-4xl mb-6">✗</div>
        <h1 className="text-2xl font-light text-[#F3EFE8] mb-2">پرداخت ناموفق</h1>
        <p className="text-xs text-[#F3EFE8]/40 mb-8 text-center font-light max-w-xs">پرداخت انجام نشد. می‌توانید مجدداً تلاش کنید یا با پشتیبانی تماس بگیرید.</p>
        <GlassCard className="w-full p-5 mb-6 text-center">
          <p className="text-xs text-[#F3EFE8]/50">در صورت کسر وجه از حساب، مبلغ ظرف ۷۲ ساعت برگشت داده می‌شود.</p>
        </GlassCard>
        <Link href="/book" className="w-full mb-3">
          <GoldButton className="w-full py-4">← تلاش مجدد</GoldButton>
        </Link>
        <Link href="/" className="text-xs text-[#F3EFE8]/40 hover:text-[#F3EFE8] transition-colors">بازگشت به خانه</Link>
      </div>
    </>
  )
}
