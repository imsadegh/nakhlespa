import { afterEach, beforeEach, expect, mock, spyOn, test } from 'bun:test'
import { NextRequest } from 'next/server'
import { services, bookingCustomizations, BookingStatus } from '../src/db/schema'

process.env.NEXT_PUBLIC_SITE_URL = 'https://spa.test'
process.env.ZIBAL_MOCK = 'false'

const payer = {
  id: 'payer', token: 'confirmation', bookingCode: 'NS-1234ABCD', serviceId: 'service', groupToken: 'group',
  status: BookingStatus.PENDING_PAYMENT, discountAmount: 50, addonsPricePaid: 20,
  date: new Date('2026-11-01'), startTime: '10:00', customerName: 'Customer', customerPhone: '09123456789',
}
const friend = {
  ...payer, id: 'friend', token: 'friend-confirmation', bookingCode: 'NS-FRIEND1',
  addonsPricePaid: 10, customerName: 'Friend', customerPhone: '09876543210',
}
const groupRows = [
  { booking: payer, service: { nameFa: 'spa', price: 100 } },
  { booking: friend, service: { nameFa: 'spa', price: 100 } },
]
let verified = false
let rejectPayment = false
let failSms = false
let expectedAmount = 190
let writes: Record<string, unknown>[] = []
let joinedReads = 0
let messages: { bookingId: string; template: string; sendAt: Date; nextAttemptAt: Date }[] = []
let customizations = [{ pricePaid: 30 }]

const db = {
  select() {
    return { from(table: unknown) {
      return {
        innerJoin() { return { where() {
          joinedReads++
          return joinedReads === 1
            ? { limit: async () => [{ booking: payer, service: { nameFa: 'spa', price: 100 } }] }
            : Promise.resolve(groupRows)
        } } },
        where: async () => table === services ? [{ id: 'service', price: 100 }]
          : table === bookingCustomizations ? customizations : [payer, { ...payer, id: 'second', addonsPricePaid: 10 }],
      }
    } }
  },
  update() {
    return { set(values: Record<string, unknown>) {
      expect(verified).toBe(true)
      writes.push(values)
      return { where() {
        return { returning: async () => [{ id: payer.id }], then: (resolve: (value: unknown) => unknown) => Promise.resolve([]).then(resolve) }
      } }
    } }
  },
  insert() { return { values: async (rows: typeof messages) => { messages.push(...rows) } } },
  async transaction(callback: (tx: any) => Promise<unknown>): Promise<unknown> { return callback(db) },
}
mock.module('@/lib/db', () => ({ db }))
mock.module('@/lib/zibal', () => ({ zibalVerify: async (trackId: string, amount: number) => {
  expect(writes).toHaveLength(0)
  expect(trackId).toBe('12345')
  expect(amount).toBe(expectedAmount)
  if (rejectPayment) throw new Error('payment rejected')
  verified = true
  return { refId: '9876' }
} }))
const adminSms = mock(async (_mobile: string, _params: { name: string; phone: string }) => {
  if (failSms) throw new Error('SMS unavailable')
})
mock.module('@/lib/smsir', () => ({ sendAdminSms: adminSms }))
const { GET } = await import('../src/app/api/bookings/verify/route')

let clock: ReturnType<typeof spyOn<typeof Date, 'now'>>

beforeEach(() => {
  clock = spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-30T06:30:00Z'))
  verified = false
  rejectPayment = false
  failSms = false
  writes = []
  joinedReads = 0
  messages = []
  adminSms.mockClear()
  payer.status = BookingStatus.PENDING_PAYMENT
  customizations = [{ pricePaid: 30 }]
  expectedAmount = 210
})

afterEach(() => clock.mockRestore())

test('schedules both reminder offsets in Tehran time', async () => {
  await GET(new NextRequest('https://spa.test/api/bookings/verify?success=1&trackId=12345'))
  const hour = 60 * 60 * 1000
  expect(messages.map(({ template, sendAt }) => [template, sendAt.getTime() - Date.now()]).sort()).toEqual([
    ['confirm', 0], ['confirm', 0],
    ['reminder24h', 24 * hour], ['reminder24h', 24 * hour],
    ['reminder2h', 46 * hour], ['reminder2h', 46 * hour],
  ])
})

test('for a booking three hours away, schedules confirmation and only the two-hour reminder', async () => {
  clock.mockReturnValue(Date.parse('2026-11-01T03:30:00Z'))
  await GET(new NextRequest('https://spa.test/api/bookings/verify?success=1&trackId=12345'))
  expect(messages.map(({ template, nextAttemptAt }) => [template, nextAttemptAt.getTime() - Date.now()]).sort()).toEqual([
    ['confirm', 0], ['confirm', 0],
    ['reminder2h', 60 * 60 * 1000], ['reminder2h', 60 * 60 * 1000],
  ])
})

test('sends each group member confirmations and reminders and notifies admin per booking', async () => {
  const response = await GET(new NextRequest('https://spa.test/api/bookings/verify?success=1&trackId=12345'))
  expect(response.headers.get('location')).toBe('https://spa.test/booking/confirm/confirmation')
  expect(writes[0]).toEqual({ status: BookingStatus.PAID, zibalRefId: '9876' })
  expect(adminSms.mock.calls.map(([phone, params]) => [phone, params.name, params.phone])).toEqual([
    [process.env.ADMIN_PHONE, 'Customer', '09123456789'],
    [process.env.ADMIN_PHONE, 'Friend', '09876543210'],
  ])
  expect(messages.map(({ template, bookingId }) => [template, bookingId]).sort()).toEqual([
    ['confirm', 'payer'], ['confirm', 'friend'],
    ['reminder24h', 'payer'], ['reminder24h', 'friend'],
    ['reminder2h', 'payer'], ['reminder2h', 'friend'],
  ].sort())
})

test('never records a failed verification as paid', async () => {
  rejectPayment = true
  const response = await GET(new NextRequest('https://spa.test/api/bookings/verify?success=1&trackId=12345'))
  expect(response.headers.get('location')).toBe('https://spa.test/booking/failed')
  expect(writes).toHaveLength(0)
  expect(messages).toHaveLength(0)
})

test('keeps payment confirmed when notifications fail', async () => {
  failSms = true
  const response = await GET(new NextRequest('https://spa.test/api/bookings/verify?success=1&trackId=12345'))
  expect(response.headers.get('location')).toBe('https://spa.test/booking/confirm/confirmation')
  expect(writes.every(values => values.status === BookingStatus.PAID)).toBe(true)
  expect(messages.filter(({ template }) => template === 'confirm')).toHaveLength(2)
})

test('a repeated callback does not send notifications again', async () => {
  payer.status = BookingStatus.PAID
  const response = await GET(new NextRequest('https://spa.test/api/bookings/verify?success=1&trackId=12345'))
  expect(response.headers.get('location')).toBe('https://spa.test/booking/confirm/confirmation')
  expect(verified).toBe(false)
  expect(messages).toHaveLength(0)
})

test('rejects cancelled and malformed callbacks', async () => {
  for (const query of ['success=0&trackId=12345', 'success=1', 'success=1&trackId=invalid', 'Status=OK&Authority=old']) {
    const response = await GET(new NextRequest(`https://spa.test/api/bookings/verify?${query}`))
    expect(response.headers.get('location')).toBe('https://spa.test/booking/failed')
  }
  expect(verified).toBe(false)
  expect(writes).toHaveLength(0)
})
