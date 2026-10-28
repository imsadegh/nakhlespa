import { beforeEach, expect, mock, test } from 'bun:test'
import { PgDialect } from 'drizzle-orm/pg-core'
import { bookings } from '../src/db/schema'

let bookingCount = 0
const countBookings = mock(async () => bookingCount)
const discount = { id: 'loyalty', code: 'LOYALTY_AUTO', isActive: true, expiresAt: null, type: 'PERCENT', value: 10 }
mock.module('@/lib/db', () => ({ db: {
  $count: countBookings,
  select: () => ({ from: (table: unknown) => {
    if (table === bookings) return Promise.resolve(bookingCount ? [{ count: bookingCount }] : [])
    return { where: () => ({ limit: async () => [discount] }) }
  } }),
} }))
const { checkLoyaltyDiscount } = await import('../src/lib/discounts')

beforeEach(() => {
  bookingCount = 0
  countBookings.mockClear()
})

test('an empty booking table returns no loyalty discount without crashing', async () => {
  expect(await checkLoyaltyDiscount('09123456789', 1000)).toEqual({ eligible: false, discountAmount: 0, codeId: '' })
})

test('customers with fewer than four paid bookings are not eligible', async () => {
  bookingCount = 3
  expect(await checkLoyaltyDiscount('09123456789', 1000)).toEqual({ eligible: false, discountAmount: 0, codeId: '' })
})

test('every fifth booking retains the loyalty discount', async () => {
  for (const count of [4, 9]) {
    bookingCount = count
    expect(await checkLoyaltyDiscount('09123456789', 1000)).toEqual({ eligible: true, discountAmount: 100, codeId: 'loyalty' })
  }
})

test('counts only paid or confirmed bookings for this customer', async () => {
  await checkLoyaltyDiscount('09123456789', 1000)
  const [table, filter] = countBookings.mock.calls[0] as unknown as [unknown, Parameters<PgDialect['sqlToQuery']>[0]]
  expect(table).toBe(bookings)
  expect(new PgDialect().sqlToQuery(filter).params).toEqual(['09123456789', 'PAID', 'CONFIRMED'])
})
