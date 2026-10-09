import { notFound } from 'next/navigation'
import { and, asc, eq } from 'drizzle-orm'
import { bookings } from '@/db/schema'
import { db } from '@/lib/db'
import { HEALTH_INTAKE_SECTIONS, type HealthIntake } from '@/lib/health-intake'
import { CUSTOMIZATION_FIELD_LABELS, formatCustomization } from '@/lib/booking-customization'
import { PrintHealthFormButton } from '@/components/admin/PrintHealthFormButton'
import type { BookingCustomization, CustomizationKey } from '@/types'

type PrintableBooking = {
  id: string
  customerName: string
  customerPhone: string
  gender: 'FEMALE' | 'MALE'
  date: Date
  startTime: string
  endTime: string
  groupToken: string | null
  healthIntake: HealthIntake | null
  customization: BookingCustomization | null
  customizations: { id: string; category: string; labelSnapshot: string; pricePaid: number }[]
  service: { nameFa: string }
}

const persianDigits = (value: string) => value.replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)])

function formatDate(date: Date) {
  return new Date(`${date.toISOString().split('T')[0]}T12:00:00`).toLocaleDateString('fa-IR')
}

export function HealthFormPage({ booking }: { booking: PrintableBooking }) {
  const intake = booking.healthIntake
  const sections = HEALTH_INTAKE_SECTIONS.map(section => ({
    ...section,
    conditions: section.conditions.filter(condition =>
      (!condition.femaleOnly || booking.gender === 'FEMALE') && intake?.conditions[condition.key],
    ),
  })).filter(section => section.conditions.length > 0)
  const customizationRows = booking.customizations.length > 0
    ? booking.customizations.map(item => ({
        id: item.id,
        category: CUSTOMIZATION_FIELD_LABELS[item.category as CustomizationKey] ?? item.category,
        value: item.labelSnapshot,
        pricePaid: item.pricePaid,
      }))
    : booking.customization
      ? formatCustomization(booking.customization).map(item => ({
          id: item.key,
          category: item.label,
          value: item.value,
          pricePaid: 0,
        }))
      : []

  return (
    <section dir="rtl" data-health-form-page className="health-form-page mx-auto max-w-3xl bg-white p-8 text-[#17251e]">
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-[#d8d2c4] pb-4">
        <div>
          <div className="mb-2 text-lg font-bold" aria-label="نخلسپا">
            نخل<span className="text-[#C6A55B]">سپا</span>
          </div>
          <h1 className="text-2xl font-semibold">فرم سلامت</h1>
          <p className="mt-1 text-sm text-[#5e665f]">لطفاً اطلاعات سلامت خود را با دقت بررسی کنید.</p>
        </div>
        <div className="print-hide"><PrintHealthFormButton /></div>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-2 border-b border-[#d8d2c4] pb-4 text-sm">
        <p><strong>نام و نام خانوادگی:</strong> {booking.customerName}</p>
        <p><strong>موبایل:</strong> {booking.customerPhone}</p>
        <p><strong>خدمت:</strong> {booking.service.nameFa}</p>
        <p className="col-span-2">
          <strong>تاریخ و ساعت:</strong>{' '}
          <span className="inline-flex items-baseline gap-2">
            <span>{formatDate(booking.date)}</span>
            <span dir="ltr" className="inline-block">{persianDigits(booking.startTime)} — {persianDigits(booking.endTime)}</span>
          </span>
        </p>
      </div>

      {customizationRows.length > 0 && (
        <div className="my-4 rounded-lg border border-[#d8d2c4] p-4 text-sm">
          <h2 className="mb-2 font-semibold">سفارشی‌سازی سفارش</h2>
          <div className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
            {customizationRows.map(item => (
              <div key={item.id} className="flex items-center justify-between gap-3 border-b border-[#eee9de] py-1.5">
                <span>{item.category}</span>
                <span className="text-left">
                  {item.value}{item.pricePaid > 0 ? ` (+${item.pricePaid.toLocaleString('fa-IR')} تومان)` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {intake ? (
        <>
          {intake.noneOfTheAbove ? (
            <p className="rounded-lg border border-[#d8d2c4] p-4 text-sm">
              هیچ بیماری یا مشکلی ندارم و در سلامت هستم.
            </p>
          ) : (
            <>
              <p className="mb-3 text-sm font-medium">
                مراجع اعلام کرده است که در حال حاضر موارد سلامت زیر را دارد:
              </p>
              <div className="space-y-4">
                {sections.map(section => (
                  <div key={section.key} className="rounded-lg border border-[#d8d2c4] p-4">
                    <h2 className="mb-3 text-base font-semibold">{section.label}</h2>
                    <div className="grid grid-cols-1 gap-y-2 sm:grid-cols-2 sm:gap-x-8">
                      {section.conditions.map(condition => (
                        <div key={condition.key} className="border-b border-[#eee9de] py-1.5 text-sm">
                          {condition.label}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="mt-4 rounded-lg border border-[#d8d2c4] p-4 text-sm">
            <h2 className="mb-2 font-semibold">توضیحات پزشکی</h2>
            <p className="min-h-8 whitespace-pre-wrap">{intake.medicalNotes || '—'}</p>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-[#d8d2c4] p-5 text-sm">
          <h2 className="font-semibold">وضعیت فرم سلامت</h2>
          <p className="mt-2">ثبت نشده</p>
        </div>
      )}

      <p className="mt-8 text-sm">
        اینجانب صحت اطلاعات درج‌شده در این فرم را تأیید می‌کنم.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-10 text-sm">
        <p>امضاء متقاضی: <span className="signature-line" /></p>
        <p>تاریخ: <span className="signature-line" data-print-date /></p>
      </div>

      <p className="mt-6 rounded-lg bg-[#f6f1e6] p-3 text-sm font-medium">
        نکته: لطفاً ۱۵ دقیقه قبل از زمان رزرو در مجموعه حضور داشته باشید تا خدمات بهتری دریافت کنید.
      </p>
    </section>
  )
}

export default async function HealthFormPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const booking = await db.query.bookings.findFirst({
    where: eq(bookings.id, id),
    with: { service: true, customizations: true },
  })
  if (!booking) notFound()

  const groupBookings = booking.groupToken
    ? await db.query.bookings.findMany({
        where: and(eq(bookings.groupToken, booking.groupToken)),
        with: { service: true, customizations: true },
        orderBy: asc(bookings.createdAt),
      })
    : [booking]

  return (
    <>
      <style>{`
        @page { size: A4; margin: 12mm; }
        .health-form-page { min-height: 267mm; }
        .signature-line { display: inline-block; width: 42mm; border-bottom: 1px solid #17251e; vertical-align: bottom; }
        @media screen { body { background: #f3f0e8; } }
        @media print {
          body { background: white !important; }
          .print-hide, nav, header, footer { display: none !important; }
          .health-form-page { max-width: none; min-height: 0; padding: 0; break-inside: avoid; page-break-after: always; }
          .health-form-page:last-child { page-break-after: auto; }
        }
      `}</style>
      <main className="health-form-surface py-8">
        {groupBookings.map(item => <HealthFormPage key={item.id} booking={item as PrintableBooking} />)}
      </main>
    </>
  )
}
