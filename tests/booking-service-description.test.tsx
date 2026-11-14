import { expect, test } from 'bun:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Step1Service } from '../src/components/booking/Step1Service'
import { CONSULTATION_DESCRIPTION } from '../src/lib/spa-packages'

test('shows package bullets in price order with consultation last', () => {
  const service = { durationMinutes: 40, price: 800000, color: null, symbol: null, tier: null }
  const html = renderToStaticMarkup(<Step1Service
    state={{ persons: [{ serviceId: '', addonIds: [], customization: null, healthIntake: null, customerName: '', customerPhone: '', customerNotes: '' }] }}
    update={() => {}}
    goNext={() => {}}
    addons={[]}
    services={[
      { ...service, id: 'consult', nameFa: 'مشاوره', descriptionFa: null, price: 500000 },
      { ...service, id: 'vip', nameFa: 'شاهانه', descriptionFa: null, price: 3900000 },
      { ...service, id: 'package', nameFa: 'نفس تازه', descriptionFa: 'کیسه‌کشی در حمام، ۲۰ دقیقه ماساژ ریلکسی' },
    ]}
  />)

  expect(html.match(/role="listitem"/g)).toHaveLength(2)
  expect(html).toContain('کیسه‌کشی در حمام</span>')
  expect(html).toContain('۲۰ دقیقه ماساژ ریلکسی</span>')
  expect(html).toContain(`${CONSULTATION_DESCRIPTION}</p>`)
  expect(Array.from(html.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g), match => match[1]))
    .toEqual(['نفس تازه', 'شاهانه', 'مشاوره'])
})
