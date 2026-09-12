import { describe, expect, mock, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { services, addons, workingHours } from '../src/db/schema'
import { getDefaultCustomization } from '../src/lib/booking-customization'

const validHealthIntake = {
  version: 1 as const,
  noneOfTheAbove: false,
  conditions: { diabetes: true as const },
  medicalNotes: '',
}

function query(value: unknown) {
  return {
    limit: async () => value,
    then: (resolve: (value: unknown) => unknown, reject?: (error: unknown) => unknown) =>
      Promise.resolve(value).then(resolve, reject),
  }
}

const serviceRows = [
  { id: 'service-one', nameFa: 'Service One', descriptionFa: null, durationMinutes: 60, price: 100, color: null, symbol: null, tier: 1, isActive: true },
  { id: 'service-two', nameFa: 'Service Two', descriptionFa: null, durationMinutes: 90, price: 200, color: null, symbol: null, tier: 2, isActive: true },
]
const addonRows = [{ id: 'addon-one', price: 10, requiresTier: false }]
const workingDay = { id: 'working-day', dayOfWeek: 1, gender: 'FEMALE', openTime: '09:00', closeTime: '18:00', isOpen: true }
const maleWorkingDay = { ...workingDay, id: 'male-working-day', gender: 'MALE' }

const persistedBookings: Record<string, unknown>[] = []
const calls = { slotLookup: 0, discountLookup: 0, payment: 0, transaction: 0, paymentAmount: 0 }
let requestedServiceIds: string[] = []

const db = {
  select() {
    return {
      from(table: unknown) {
        return {
          where() {
            if (table === services) return query(serviceRows.filter(row => requestedServiceIds.includes(row.id)))
            if (table === addons) return query(addonRows)
            if (table === workingHours) return query([workingDay, maleWorkingDay])
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

function reset() {
  persistedBookings.length = 0
  requestedServiceIds = []
  Object.assign(calls, { slotLookup: 0, discountLookup: 0, payment: 0, transaction: 0, paymentAmount: 0 })
}

function request(bookings: unknown[]) {
  requestedServiceIds = bookings.map(item => (item as { serviceId: string }).serviceId)
  return new Request('http://localhost/api/bookings/create', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ bookings }),
  })
}

function booking(serviceId: string, healthIntake: unknown, gender = 'FEMALE') {
  return {
    serviceId,
    customerName: serviceId,
    customerPhone: '09120000000',
    date: '2026-09-07',
    startTime: '10:00',
    addonIds: [],
    customization: getDefaultCustomization(),
    healthIntake,
    gender,
  }
}

describe('POST /api/bookings/create health intake boundary', () => {
  test.each([
    ['missing health intake', undefined],
    ['incomplete health intake', { version: 1, noneOfTheAbove: false, conditions: {}, medicalNotes: '' }],
  ])('returns HTTP 400 for %s before downstream side effects', async (_label, healthIntake) => {
    reset()
    const response = await POST(request([booking('service-one', healthIntake)]) as never)
    expect(response.status).toBe(400)
    expect(persistedBookings).toHaveLength(0)
    expect(calls.slotLookup).toBe(0)
    expect(calls.discountLookup).toBe(0)
    expect(calls.transaction).toBe(0)
    expect(calls.payment).toBe(0)
  })

  test('rejects pregnancy for male bookings before downstream side effects', async () => {
    reset()
    const response = await POST(request([booking('service-one', { ...validHealthIntake, conditions: { pregnancy: true } }, 'MALE')]) as never)
    expect(response.status).toBe(400)
    expect(calls.slotLookup).toBe(0)
    expect(calls.discountLookup).toBe(0)
    expect(calls.transaction).toBe(0)
    expect(calls.payment).toBe(0)
  })

  test('persists valid male intake without pregnancy', async () => {
    reset()
    const response = await POST(request([booking('service-one', validHealthIntake, 'MALE')]) as never)
    expect(response.status).toBe(200)
    expect(persistedBookings[0].healthIntake).toEqual(validHealthIntake)
  })

  test('persists valid female intake with pregnancy', async () => {
    reset()
    const intake = { ...validHealthIntake, conditions: { pregnancy: true as const } }
    const response = await POST(request([booking('service-one', intake)]) as never)
    expect(response.status).toBe(200)
    expect(persistedBookings[0].healthIntake).toEqual(intake)
  })

  test('persists normalized none-of-the-above intake', async () => {
    reset()
    const intake = { version: 1 as const, noneOfTheAbove: true, conditions: { diabetes: true as const }, medicalNotes: '' }
    const response = await POST(request([booking('service-one', intake)]) as never)
    expect(response.status).toBe(200)
    expect(persistedBookings[0].healthIntake).toEqual({ ...intake, conditions: {} })
  })

  test('persists independent health data for two bookings and preserves pricing', async () => {
    reset()
    const first = validHealthIntake
    const second = { ...validHealthIntake, conditions: { bloodPressure: true as const }, medicalNotes: 'note' }
    const response = await POST(request([booking('service-one', first), booking('service-two', second)]) as never)
    expect(response.status).toBe(200)
    expect(persistedBookings.map(row => row.healthIntake)).toEqual([first, second])
    expect(persistedBookings[0].healthIntake).not.toBe(persistedBookings[1].healthIntake)
    expect(calls.paymentAmount).toBe(300)
  })

  test('includes each person health intake in the review request payload', () => {
    const source = readFileSync('src/components/booking/Step4Review.tsx', 'utf8')
    expect(source).toContain('healthIntake: person.healthIntake')
  })
})
