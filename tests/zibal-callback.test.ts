import { beforeEach, expect, mock, test } from 'bun:test'
import { NextRequest } from 'next/server'
import { bookings, services, bookingCustomizations, BookingStatus } from '../src/db/schema'

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
let notifications = 0
let joinedReads = 0
let queuedJobs: { name: string; data: { phone: string; template: string } }[] = []
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
mock.module('@/lib/queue', () => ({ smsQueue: { add: async (name: string, data: { phone: string; template: string }) => {
  notifications++
  queuedJobs.push({ name, data })
  if (failSms) throw new Error('queue unavailable')
} } }))
const confirmSms = mock(async (_mobile: string, _params: unknown) => {})
const adminSms = mock(async (_mobile: string, _params: unknown) => {})
mock.module('@/lib/smsir', () => ({ sendConfirmSms: confirmSms, sendAdminSms: adminSms }))
const { GET } = await import('../src/app/api/bookings/verify/route')

beforeEach(() => {
  verified = false
  rejectPayment = false
  failSms = false
  writes = []
  notifications = 0
  joinedReads = 0
  queuedJobs = []
  confirmSms.mockClear()
  adminSms.mockClear()
  payer.status = BookingStatus.PENDING_PAYMENT
  customizations = [{ pricePaid: 30 }]
  expectedAmount = 210
})

test('sends each group member confirmations and reminders and notifies admin per booking', async () => {
  const response = await GET(new NextRequest('https://spa.test/api/bookings/verify?success=1&trackId=12345'))
  expect(response.headers.get('location')).toBe('https://spa.test/booking/confirm/confirmation')
  expect(writes[0]).toEqual({ status: BookingStatus.PAID, zibalRefId: '9876' })
  expect(notifications).toBe(4)
  expect(confirmSms.mock.calls.map(([phone, params]) => [phone, params.bookingCode])).toEqual([
    ['09123456789', 'NS-1234ABCD'], ['09876543210', 'NS-FRIEND1'],
  ])
  expect(adminSms.mock.calls.map(([phone, params]) => [phone, params.name, params.phone])).toEqual([
    [process.env.ADMIN_PHONE, 'Customer', '09123456789'],
    [process.env.ADMIN_PHONE, 'Friend', '09876543210'],
  ])
  expect(queuedJobs.map(({ name, data }) => [name, data.phone]).sort()).toEqual([
    ['reminder-24h', '09123456789'], ['reminder-24h', '09876543210'],
    ['reminder-2h', '09123456789'], ['reminder-2h', '09876543210'],
  ].sort())
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
