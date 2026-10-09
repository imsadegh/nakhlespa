'use client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useBookingDialog } from '@/components/booking/BookingDialogProvider'
import { GlassCard } from '@/components/ui/GlassCard'
import { TierIcon } from '@/components/ui/TierIcon'

const PRODUCT_STEPS: Record<string, string[]> = {
  'نفس تازه': ['کیسه‌کشی در حمام', '۲۰ دقیقه ماساژ ریلکسی', 'لیف پایانی', 'پذیرایی متناسب با مزاج'],
  'احیاگر': ['پذیرایی', 'کیسه‌کشی بدن و حوله‌آتشین', '۵۰ دقیقه ماساژ حرفه‌ای', 'عصب‌گیری عمومی', 'سدر و حنا و لیف نهایی'],
  'دریای آرامش': ['پذیرایی متناسب با مزاج', 'کیسه‌کشی و سنگ‌پا', '۴۰ دقیقه ماساژ ریلکسی', 'مناسب رفع خستگی عمیق'],
  'سبک بال': ['پذیرایی', 'پاکسازی بدن با لوفا', 'روغن‌مالی با روغن گل بنفشه', '۲۰ دقیقه ماساژ ریلکسی', 'لیف پایانی'],
  'شاهانه': ['پذیرایی', 'کیسه‌کشی بدن', '۹۰ دقیقه ماساژ حرفه‌ای', 'عصب‌گیری عمومی', 'مشت‌ومال، سدر و حنا', 'لیف نهایی'],
  'حمام طهورا': ['گرمایش از کف', 'کیسه و لیف سنتی', 'مشت‌ومال', 'ضماد سرد و گرم', 'آماده‌سازی برای ماساژ'],
}

const PRODUCTS = [
  { nameFa: 'نفس تازه', category: 'اقتصادی', price: 800_000 },
  { nameFa: 'احیاگر', category: 'بازیابی بدن', price: 2_050_000 },
  { nameFa: 'دریای آرامش', category: 'ریلکسی', price: 1_100_000 },
  { nameFa: 'سبک بال', category: 'پاکسازی', price: 1_300_000 },
  { nameFa: 'شاهانه', category: 'ویژه و اختصاصی', price: 3_900_000 },
  { nameFa: 'حمام طهورا', category: 'افزودنی حمام', price: 1_200_000 },
]

export function ServicesSection() {
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {PRODUCTS.map((product, i) => {
          const price = product.price
          const isGold = product.nameFa === 'شاهانه'
          return (
            <motion.div
              key={product.nameFa}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <button onClick={handleBook} className="w-full text-right h-full">
                <GlassCard gold={isGold} className="relative flex h-full min-h-[350px] cursor-pointer flex-col gap-4 overflow-hidden p-4 transition-shadow group hover:shadow-xl sm:p-5">

                  {/* header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[13px] sm:h-11 sm:w-11"
                      style={{
                        background: 'rgba(198,165,91,0.12)',
                        border: '1px solid rgba(198,165,91,0.25)',
                      }}
                    >
                      <TierIcon symbol={null} color="yellow" size={22} />
                    </div>

                    {/* duration pill */}
                    <span
                      className="flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium"
                      style={{
                        color: '#C6A55B',
                        background: 'rgba(198,165,91,0.10)',
                        border: '1px solid rgba(198,165,91,0.20)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {product.category}
                    </span>
                  </div>

                  {/* name + description */}
                  <div className="flex flex-1 flex-col gap-3">
                    <h3 className="text-base font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
                      {product.nameFa}
                    </h3>
                    <ul className="list-inside list-disc space-y-1.5 text-[11px] leading-6 marker:text-[#C6A55B] sm:text-xs">
                      {PRODUCT_STEPS[product.nameFa].map(step => <li key={step}>{step}</li>)}
                    </ul>
                  </div>

                  {/* footer row */}
                  <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(198,165,91,0.18)' }}>
                    {price !== undefined && (
                      <span className="text-sm font-bold" style={{ color: '#C6A55B' }}>
                        از {price.toLocaleString('fa-IR')} تومان
                      </span>
                    )}
                    <span
                      className="flex items-center gap-1 text-[11px] opacity-60 transition-all duration-300 group-hover:gap-2 group-hover:opacity-100"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      رزرو
                      <span>←</span>
                    </span>
                  </div>

                </GlassCard>
              </button>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
