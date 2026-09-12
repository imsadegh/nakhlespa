import { readFileSync } from 'node:fs'
import { describe, expect, mock, test } from 'bun:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

let requestedId = ''
const sampleBookings = new Map<string, any>()

mock.module('@/lib/db', () => ({
  db: {
    query: {
      bookings: {
        findFirst: async () => sampleBookings.get(requestedId),
        findMany: async () => [...sampleBookings.values()],
      },
    },
  },
}))

const { default: HealthFormPrintPage } = await import('@/app/admin/(panel)/bookings/[id]/health-form/page')

function booking(overrides: Record<string, unknown> = {}) {
  return {
    id: 'booking-1',
    customerName: 'سارا رضایی',
    customerPhone: '09123456789',
    gender: 'FEMALE',
    date: new Date('2026-09-12T00:00:00.000Z'),
    startTime: '14:00',
    endTime: '15:00',
    groupToken: null,
    healthIntake: {
      version: 1,
      noneOfTheAbove: false,
      conditions: { pregnancy: true, diabetes: true, bruising: true },
      medicalNotes: 'حساسیت به فشار زیاد',
    },
    service: { nameFa: 'ماساژ آرامش', durationMinutes: 60 },
    ...overrides,
  }
}

async function renderPage(id = 'booking-1') {
  requestedId = id
  return renderToStaticMarkup(await HealthFormPrintPage({ params: Promise.resolve({ id }) }))
}

describe('admin health intake print page', () => {
  test('prints identity, booking details, reminder, answers, notes, and physical signature lines', async () => {
    sampleBookings.clear()
    sampleBookings.set('booking-1', booking())

    const html = await renderPage()

    expect(html).toContain('سارا رضایی')
    expect(html).toContain('09123456789')
    expect(html).toContain('ماساژ آرامش')
    expect(html).toContain('۱۴۰۵')
    expect(html).toContain('۱۴:۰۰')
    expect(html).toContain('لطفاً ۱۵ دقیقه قبل از زمان رزرو در مجموعه حضور داشته باشید تا خدمات بهتری دریافت کنید.')
    expect(html).toContain('بیماری‌ها')
    expect(html).toContain('پوست و حساسیت')
    expect(html).toContain('دارو و درمان')
    expect(html).toContain('وضعیت فعلی بدن')
    expect(html).toContain('دیابت')
    expect(html).toContain('بله')
    expect(html).toContain('خیر')
    expect(html).toContain('حساسیت به فشار زیاد')
    expect(html).toContain('امضاء متقاضی')
    expect(html).toContain('تاریخ')
    expect(html).toContain('@page')
    expect(html).toContain('page-break-after')
  })

  test('prints one page per group member and omits pregnancy for male data', async () => {
    sampleBookings.clear()
    sampleBookings.set('booking-1', booking({ groupToken: 'group-1' }))
    sampleBookings.set('booking-2', booking({
      id: 'booking-2',
      customerName: 'علی رضایی',
      gender: 'MALE',
      healthIntake: { version: 1, noneOfTheAbove: true, conditions: {}, medicalNotes: '' },
    }))

    const html = await renderPage()

    expect(html.match(/data-health-form-page/g)?.length).toBe(2)
    expect(html).toContain('علی رضایی')
    expect(html).not.toMatch(/علی رضایی[\s\S]*?بارداری/)
  })

  test('shows ثبت نشده for legacy null intake without inventing answers', async () => {
    sampleBookings.clear()
    sampleBookings.set('booking-1', booking({ healthIntake: null }))

    const html = await renderPage()

    expect(html).toContain('ثبت نشده')
    expect(html).not.toContain('بله')
    expect(html).not.toContain('خیر')
  })
})

describe('print health form button', () => {
  test('uses the admin route and only invokes browser printing', () => {
    const source = readFileSync('src/components/admin/PrintHealthFormButton.tsx', 'utf8')
    expect(source).toContain('window.print()')
    expect(source).toContain('/health-form')
    expect(source).not.toMatch(/fetch\(|localStorage|signature.*(?:upload|save|persist)/i)
  })
})
