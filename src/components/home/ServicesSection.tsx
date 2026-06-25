'use client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useBookingDialog } from '@/components/booking/BookingDialogProvider'
import { GlassCard } from '@/components/ui/GlassCard'
import BorderGlow from '@/components/ui/BorderGlow'
import { TierIcon } from '@/components/ui/TierIcon'
import type { ServiceDTO } from '@/types'

const DESCRIPTIONS: Record<string, string> = {
  'نسیم':        'لحظه‌ای از آرامش؛ سبک، لطیف و رهایی‌بخش. مناسب برای اولین تجربه یا وقتی فقط به یک نفس عمیق نیاز دارید.',
  'آفتاب':       'گرمای دلنشین یک ساعت ماساژ تخصصی که انرژی را به جریان می‌اندازد و تنش‌های روزمره را می‌زداید.',
  'باران':       'نود دقیقه غرق شدن در سکوت و آرامش. ماساژ عمیق‌تر برای آن‌هایی که بدنشان استراحتی جدی‌تر می‌طلبد.',
  'ارغوان':      'تجربه VIP دو ساعته با بالاترین سطح توجه و مراقبت. اتاق اختصاصی، روغن‌های ممتاز و سکوتی کامل.',
  'حمام طهورا':  'یک ریچوال سه‌ساعته از سر تا پا؛ حمام، بخور و ماساژ در فضایی که برای پاک‌سازی روح و جسم طراحی شده.',
  'مشاوره':      'پیش از هر خدمتی، با متخصص ما مشورت کنید تا بهترین برنامه مراقبتی متناسب با نیازتان طراحی شود.',
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} دقیقه`
  if (minutes % 60 === 0) return `${minutes / 60} ساعت`
  return `${Math.floor(minutes / 60)} ساعت و ${minutes % 60} دقیقه`
}

export function ServicesSection({ services }: { services: ServiceDTO[] }) {
  const { open, available } = useBookingDialog()
  const router = useRouter()
  const handleBook = () => available ? open() : router.push('/book')

  return (
    <section id="services" className="px-4 sm:px-8 lg:px-16 mb-10">
      <motion.p
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        className="tracking-[3px] mb-6 font-light"
        style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}
      >
        — خدمات ما
      </motion.p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((svc, i) => {
          const description = DESCRIPTIONS[svc.nameFa] ?? svc.descriptionFa ?? ''
          const isGold = svc.tier === 3
          return (
            <motion.div
              key={svc.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <button onClick={handleBook} className="w-full text-right h-full">
                <BorderGlow
                  borderRadius={16}
                  glowColor="42 65 72"
                  colors={isGold ? ['#C6A55B', '#E8C97A', '#A8873A'] : ['#C6A55B', '#9B8B6E', '#D4B87A']}
                  glowRadius={36}
                  glowIntensity={0.9}
                  edgeSensitivity={25}
                  coneSpread={20}
                  fillOpacity={0.2}
                  backgroundColor="transparent"
                  className="h-full w-full"
                >
                <GlassCard gold={isGold} className="relative overflow-hidden h-full flex flex-col p-5 gap-4 cursor-pointer group">

                  {/* header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="w-11 h-11 rounded-[13px] flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'rgba(198,165,91,0.12)',
                        border: '1px solid rgba(198,165,91,0.25)',
                      }}
                    >
                      <TierIcon symbol={svc.symbol} color={svc.color} size={22} />
                    </div>

                    {/* duration pill */}
                    <span
                      className="text-[10px] font-light px-2.5 py-1 rounded-full flex-shrink-0"
                      style={{
                        color: '#C6A55B',
                        background: 'rgba(198,165,91,0.10)',
                        border: '1px solid rgba(198,165,91,0.20)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {formatDuration(svc.durationMinutes)}
                    </span>
                  </div>

                  {/* name + description */}
                  <div className="flex-1 flex flex-col gap-2">
                    <h3 className="text-sm font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
                      {svc.nameFa}
                    </h3>
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: 'var(--text-muted)', lineHeight: '1.75' }}
                    >
                      {description}
                    </p>
                  </div>

                  {/* footer row */}
                  <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(198,165,91,0.12)' }}>
                    <span className="text-xs font-semibold" style={{ color: '#C6A55B' }}>
                      از {svc.price.toLocaleString('fa-IR')} تومان
                    </span>
                    <span
                      className="text-[11px] flex items-center gap-1 opacity-50 group-hover:opacity-100 group-hover:gap-2 transition-all duration-300"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      رزرو
                      <span>←</span>
                    </span>
                  </div>

                </GlassCard>
                </BorderGlow>
              </button>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
