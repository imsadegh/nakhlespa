import { readFileSync } from 'node:fs'
import {
  CUSTOMIZATION_DEFAULTS,
  formatCustomization,
} from '../src/lib/booking-customization'
import { describe, expect, mock, test } from 'bun:test'

let adminBooking: { customization: typeof CUSTOMIZATION_DEFAULTS } | undefined

mock.module('@/lib/db', () => ({
  db: {
    query: {
      bookings: {
        findFirst: async () => adminBooking,
      },
    },
  },
}))

const { GET: getAdminBooking } = await import('../src/app/api/admin/bookings/[id]/route')

describe('booking customization display', () => {
  test('formats each of the five persisted choices with its label, value, and description', () => {
    expect(formatCustomization({
      ...CUSTOMIZATION_DEFAULTS,
      musicGenre: 'POP',
      pressureLevel: 'FIRM',
      soap: 'LUXURY',
      loofah: 'BRINGS_OWN',
      poultice: 'PRIVATE_BARLEY_COLD',
    })).toEqual([
      { key: 'musicGenre', label: 'موسیقی', value: 'پاپ', description: 'موسیقی پاپ' },
      { key: 'pressureLevel', label: 'فشار ماساژ', value: 'قوی', description: 'فشار قوی' },
      { key: 'soap', label: 'صابون حمام', value: 'لوکس', description: 'صابون لوکس' },
      { key: 'loofah', label: 'کیسه و لیف', value: 'همراه داشتن کیسه و لیف شخصی', description: 'مشتری کیسه و لیف شخصی خود را همراه دارد.' },
      { key: 'poultice', label: 'ضماد', value: 'خصوصی با آرد جو سبوس‌دار و سرکه سیب طبیعی', description: 'ضماد سرد با آرد جو سبوس‌دار و سرکه سیب طبیعی' },
    ])
  })

  test('uses ثبت نشده and empty descriptions for every legacy null customization row', () => {
    expect(formatCustomization(null)).toEqual([
      { key: 'musicGenre', label: 'موسیقی', value: 'ثبت نشده', description: '' },
      { key: 'pressureLevel', label: 'فشار ماساژ', value: 'ثبت نشده', description: '' },
      { key: 'soap', label: 'صابون حمام', value: 'ثبت نشده', description: '' },
      { key: 'loofah', label: 'کیسه و لیف', value: 'ثبت نشده', description: '' },
      { key: 'poultice', label: 'ضماد', value: 'ثبت نشده', description: '' },
    ])
  })

  test('admin GET returns the selected customization and 404 for a missing booking', async () => {
    const customization = { ...CUSTOMIZATION_DEFAULTS, soap: 'LUXURY' as const }
    adminBooking = { customization }

    const found = await getAdminBooking(new Request('http://localhost/api/admin/bookings/found'), {
      params: Promise.resolve({ id: 'found' }),
    })
    expect(found.status).toBe(200)
    expect(await found.json()).toEqual({ customization })

    adminBooking = undefined
    const missing = await getAdminBooking(new Request('http://localhost/api/admin/bookings/missing'), {
      params: Promise.resolve({ id: 'missing' }),
    })
    expect(missing.status).toBe(404)
    expect(await missing.json()).toEqual({ error: 'Booking not found' })
  })

  test('maps all five formatter rows in customer/admin displays and keeps preferences out of prices', () => {
    const review = readFileSync('src/components/booking/Step4Review.tsx', 'utf8')
    const detailPage = readFileSync('src/app/admin/(panel)/bookings/[id]/page.tsx', 'utf8')
    const detailDialog = readFileSync('src/app/admin/(panel)/bookings/BookingDetailDialog.tsx', 'utf8')

    expect(review).toMatch(/formatCustomization\(person\.customization\)\.map\(row =>/)
    expect(detailPage).toMatch(/formatCustomization\(booking\.customization\)\.map\(row =>/)
    expect(detailDialog).toMatch(/formatCustomization\(booking\.customization\)\.map\(row =>/)

    for (const source of [review, detailPage, detailDialog]) {
      expect(source).toContain('سفارشی‌سازی')
      expect(source).toContain('{row.key}')
      expect(source).toContain('{row.label}')
      expect(source).toContain('{row.value}')
    }

    expect(review).toContain('const personTotal = (svc?.price ?? 0) + selectedAddons.reduce')
    expect(detailPage).toContain('const totalPrice = booking.service.price + booking.addonsPricePaid')
    expect(detailDialog).toContain('const subtotal = booking.servicePrice + booking.addonsPricePaid')
    expect(detailDialog.slice(detailDialog.indexOf('{/* Price breakdown */}'))).not.toContain('customization')
  })
})
