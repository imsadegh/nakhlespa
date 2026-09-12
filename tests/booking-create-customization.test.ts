import { describe, expect, mock, test } from 'bun:test'
import { services, addons, workingHours } from '../src/db/schema'
import { getDefaultCustomization } from '../src/lib/booking-customization'
import { getDefaultHealthIntake } from '../src/lib/health-intake'

type QueryValue = unknown

function query(value: QueryValue) {
  return {
    limit: async () => value,
    then: (resolve: (value: QueryValue) => unknown, reject?: (error: unknown) => unknown) =>
      Promise.resolve(value).then(resolve, reject),
  }
}

const serviceRows = [
  { id: 'service-one', nameFa: 'Service One', descriptionFa: null, durationMinutes: 60, price: 100, color: null, symbol: null, tier: 1, isActive: true },
  { id: 'service-two', nameFa: 'Service Two', descriptionFa: null, durationMinutes: 90, price: 200, color: null, symbol: null, tier: 2, isActive: true },
  { id: 'service-vip', nameFa: 'VIP Service', descriptionFa: null, durationMinutes: 60, price: 500, color: null, symbol: null, tier: 3, isActive: true },
  { id: 'service-consultation', nameFa: 'Consultation', descriptionFa: null, durationMinutes: 30, price: 75, color: null, symbol: null, tier: null, isActive: true },
]
const addonRows = [
  { id: 'addon-one', price: 10, requiresTier: false },
  { id: 'addon-two', price: 20, requiresTier: false },
]
const workingDay = { id: 'working-day', dayOfWeek: 1, gender: 'FEMALE', openTime: '09:00', closeTime: '18:00', isOpen: true }

const persistedBookings: Record<string, unknown>[] = []
const calls = { addonLookup: 0, slotLookup: 0, discountLookup: 0, payment: 0, transaction: 0, paymentAmount: 0 }
let requestedServiceIds: string[] = []

const db = {
  select() {
    return {
      from(table: unknown) {
        return {
          where() {
            if (table === services) return query(serviceRows.filter(row => requestedServiceIds.includes(row.id)))
            if (table === addons) {
              calls.addonLookup++
              return query(addonRows)
            }
            if (table === workingHours) return query([workingDay])
            return query([])
          },
        }
      },
    }
  },
  transaction: async (callback: (tx: typeof db) => Promise<unknown>) => {
    calls.transaction++
    return callback(db)
  },
  insert(table: unknown) {
    return {
      values(values: Record<string, unknown> | Record<string, unknown>[]) {
        if (Array.isArray(values)) return query([])
        persistedBookings.push(values)
        return {
          ...query([]),
          returning: async () => [{ id: `booking-${persistedBookings.length}` }],
        }
      },
    }
  },
  update() {
    return { set: () => ({ where: async () => [] }) }
  },
  delete() {
    return { where: async () => [] }
  },
}

mock.module('@/lib/db', () => ({ db }))
mock.module('@/lib/slots', () => ({
  getAvailableSlots: async () => {
    calls.slotLookup++
    return [{ startTime: '10:00', endTime: '11:30', taken: false, availableCount: 2 }]
  },
}))
mock.module('@/lib/discounts', () => ({
  validatePromoCode: async () => {
    calls.discountLookup++
    return { valid: false, discountAmount: 0, codeId: '' }
  },
  checkLoyaltyDiscount: async () => {
    calls.discountLookup++
    return { eligible: false, discountAmount: 0, codeId: '' }
  },
}))
mock.module('@/lib/zarinpal', () => ({
  zarinpalRequest: async (amount: number) => {
    calls.payment++
    calls.paymentAmount = amount
    return { authority: 'authority', paymentUrl: 'https://payment.test/authority' }
  },
}))

const { POST } = await import('../src/app/api/bookings/create/route')

function resetSpies() {
  persistedBookings.length = 0
  requestedServiceIds = []
  Object.assign(calls, { addonLookup: 0, slotLookup: 0, discountLookup: 0, payment: 0, transaction: 0, paymentAmount: 0 })
}

function request(bookings: unknown[]) {
  requestedServiceIds = bookings.map((item) => (item as { serviceId: string }).serviceId)
  return new Request('http://localhost/api/bookings/create', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ bookings }),
  })
}

function booking(serviceId: string, customization: unknown, addonIds: string[] = []) {
  return { serviceId, customerName: serviceId, customerPhone: '09120000000', date: '2026-09-07', startTime: '10:00', addonIds, customization, healthIntake: { ...getDefaultHealthIntake(), noneOfTheAbove: true }, gender: 'FEMALE' }
}

describe('POST /api/bookings/create customization boundary', () => {
  test('persists two people with independent customization objects', async () => {
    resetSpies()
    const first = { ...getDefaultCustomization(), soap: 'LUXURY' as const }
    const second = { ...getDefaultCustomization(), musicGenre: 'POP' as const, loofah: 'BRINGS_OWN' as const }
    const response = await POST(request([booking('service-one', first, ['addon-one']), booking('service-two', second, ['addon-two'])]) as never)
    expect(response.status).toBe(200)
    expect(persistedBookings.map(row => row.customization)).toEqual([first, second])
    expect(persistedBookings[0].customization).not.toBe(persistedBookings[1].customization)
  })

  test.each([
    ['missing customization', undefined],
    ['malformed customization', { musicGenre: 'POP' }],
    ['unknown customization value', { ...getDefaultCustomization(), soap: 'UNKNOWN' }],
  ])('returns HTTP 400 for %s', async (_label, customization) => {
    resetSpies()
    const response = await POST(request([booking('service-one', customization)]) as never)
    expect(response.status).toBe(400)
  })

  test('normalizes a tier 3 loofah to VIP_FREE_NEW before persistence', async () => {
    resetSpies()
    const customization = { ...getDefaultCustomization(), loofah: 'PUBLIC' as const }
    const response = await POST(request([booking('service-vip', customization)]) as never)
    expect(response.status).toBe(200)
    expect(persistedBookings[0].customization).toEqual({ ...customization, loofah: 'VIP_FREE_NEW' })
  })

  test('rejects invalid customization before downstream side effects', async () => {
    resetSpies()
    const invalid = { ...getDefaultCustomization(), pressureLevel: 'INVALID' }
    const response = await POST(request([booking('service-one', invalid)]) as never)
    expect(response.status).toBe(400)
    expect(persistedBookings).toHaveLength(0)
    expect(calls.addonLookup).toBe(0)
    expect(calls.slotLookup).toBe(0)
    expect(calls.discountLookup).toBe(0)
    expect(calls.transaction).toBe(0)
    expect(calls.payment).toBe(0)
  })

  test('keeps the subtotal equal to service prices plus add-on prices', async () => {
    resetSpies()
    const response = await POST(request([booking('service-one', getDefaultCustomization(), ['addon-one']), booking('service-two', getDefaultCustomization(), ['addon-two'])]) as never)
    expect(response.status).toBe(200)
    expect(calls.paymentAmount).toBe(330)
    expect(persistedBookings.map(row => row.addonsPricePaid)).toEqual([10, 20])
  })

  test('includes paid customization choices in the payment amount', async () => {
    resetSpies()
    const customization = { ...getDefaultCustomization(), loofah: 'BUYS_FROM_US' as const, poultice: 'PRIVATE_BARLEY_COLD' as const }
    const response = await POST(request([booking('service-one', customization)]) as never)
    expect(response.status).toBe(200)
    expect(calls.paymentAmount).toBe(100 + 300000 + 600000)
  })

  test('persists null customization for non-tier services', async () => {
    resetSpies()
    const response = await POST(request([booking('service-consultation', undefined)] as never) as never)

    expect(response.status).toBe(200)
    expect(persistedBookings[0].customization).toBeNull()
  })
})
