import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'bun:test'
import { CUSTOMER_BOOKING_PROJECTION } from '../src/lib/customer-booking'

describe('customer booking privacy boundary', () => {
  test('does not include health intake in the shared customer projection', () => {
    expect(CUSTOMER_BOOKING_PROJECTION.columns).not.toHaveProperty('healthIntake')
    expect(CUSTOMER_BOOKING_PROJECTION.with?.service?.columns).not.toHaveProperty('healthIntake')
    expect(CUSTOMER_BOOKING_PROJECTION.with?.addons?.with?.addon?.columns).not.toHaveProperty('healthIntake')
  })

  test('customer and public booking pages use the allowlisted projection', () => {
    const pageSources = [
      'src/app/my/bookings/page.tsx',
      'src/app/my/bookings/[token]/page.tsx',
      'src/app/booking/confirm/[token]/page.tsx',
    ].map(path => readFileSync(path, 'utf8'))

    for (const source of pageSources) {
      expect(source).toContain('CUSTOMER_BOOKING_PROJECTION')
    }
  })
})
