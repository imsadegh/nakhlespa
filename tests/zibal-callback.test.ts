import { beforeEach, expect, mock, test } from 'bun:test'
import { NextRequest } from 'next/server'
import { bookings, services, bookingCustomizations, BookingStatus } from '../src/db/schema'

process.env.NEXT_PUBLIC_SITE_URL = 'https://spa.test'
process.env.ZIBAL_MOCK = 'false'

const payer = {
  id: 'payer', token: 'confirmation', serviceId: 'service', groupToken: 'group',
  status: BookingStatus.PENDING_PAYMENT, discountAmount: 50, addonsPricePaid: 20,
  date: new Date('2026-11-01'), startTime: '10:00', customerName: 'Customer', customerPhone: '09123456789',
}
let verified = false
let rejectPayment = false
let failSms = false
let expectedAmount = 190
let writes: Record<string, unknown>[] = []
let notifications = 0
let customizations = [{ pricePaid: 30 }]

const db = {
  select() {
    return { from(table: unknown) {
      return {
        innerJoin() { return { where() { return { limit: async () => [{ booking: payer, service: { nameFa: 'spa' } }] } } } },
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
  insert() { return { values() { return { returning: async () => [{ id: 'reminder' }] } } } },
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
mock.module('@/lib/queue', () => ({ smsQueue: { add: async () => {
  notifications++
  if (failSms) throw new Error('queue unavailable')
} } }))
mock.module('@/lib/smsir', () => ({ sendConfirmSms: async () => {}, sendAdminSms: async () => {} }))
const { GET } = await import('../src/app/api/bookings/verify/route')

beforeEach(() => {
  verified = false
  rejectPayment = false
  failSms = false
  writes = []
  notifications = 0
  payer.status = BookingStatus.PENDING_PAYMENT
  customizations = [{ pricePaid: 30 }]
  expectedAmount = 210
})

test('verifies group services, add-ons, customization prices and one group discount before recording payment', async () => {
  const response = await GET(new NextRequest('https://spa.test/api/bookings/verify?success=1&trackId=12345'))
  expect(response.headers.get('location')).toBe('https://spa.test/booking/confirm/confirmation')
  expect(writes[0]).toEqual({ status: BookingStatus.PAID, zarinpalRefId: '9876' })
  expect(notifications).toBe(2)
})

test('never records a failed verification as paid', async () => {
  rejectPayment = true
  const response = await GET(new NextRequest('https://spa.test/api/bookings/verify?success=1&trackId=12345'))
  expect(response.headers.get('location')).toBe('https://spa.test/booking/failed')
  expect(writes).toHaveLength(0)
})

test('keeps payment confirmed when notifications fail', async () => {
  failSms = true
  const response = await GET(new NextRequest('https://spa.test/api/bookings/verify?success=1&trackId=12345'))
  expect(response.headers.get('location')).toBe('https://spa.test/booking/confirm/confirmation')
  expect(writes.every(values => values.status === BookingStatus.PAID)).toBe(true)
})

test('a repeated callback does not send notifications again', async () => {
  payer.status = BookingStatus.PAID
  const response = await GET(new NextRequest('https://spa.test/api/bookings/verify?success=1&trackId=12345'))
  expect(response.headers.get('location')).toBe('https://spa.test/booking/confirm/confirmation')
  expect(verified).toBe(false)
  expect(notifications).toBe(0)
})

test('rejects cancelled and malformed callbacks', async () => {
  for (const query of ['success=0&trackId=12345', 'success=1', 'success=1&trackId=invalid', 'Status=OK&Authority=old']) {
    const response = await GET(new NextRequest(`https://spa.test/api/bookings/verify?${query}`))
    expect(response.headers.get('location')).toBe('https://spa.test/booking/failed')
  }
  expect(verified).toBe(false)
  expect(writes).toHaveLength(0)
})
