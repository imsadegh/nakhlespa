import { afterAll, expect, mock, setSystemTime, test } from 'bun:test'
import { blockedSlots, bookings, workingHours, services } from '../src/db/schema'
import type { Gender } from '../src/types'
import type { SQL } from 'drizzle-orm'
import { PgDialect } from 'drizzle-orm/pg-core'

let existing: { serviceId: string; nameFa: string; tier: null; startTime: string; endTime: string }[] = []
let includeVip = false
let blocks: { gender: Gender | null; startTime: string; endTime: string }[] = []
let blockQuery: ReturnType<PgDialect['sqlToQuery']> | undefined

const db = {
  $count: () => 4,
  select: () => ({ from: (table: unknown) => {
    const rows = table === workingHours ? [{ openTime: '07:00', closeTime: '18:00' }]
      : table === services ? [
        { id: 'package', nameFa: 'نفس تازه', durationMinutes: 60, tier: null },
        ...(includeVip ? [{ id: 'vip', nameFa: 'شاهانه', durationMinutes: 120, tier: null }] : []),
      ] : table === bookings ? existing : table === blockedSlots ? blocks : []
    const result = { then: (resolve: (value: unknown) => unknown) => Promise.resolve(rows).then(resolve), limit: async () => rows }
    const joined = { ...result, where: (condition: SQL) => {
      if (table === blockedSlots) blockQuery = new PgDialect().sqlToQuery(condition)
      return result
    } }
    return { ...joined, innerJoin: () => joined }
  } }),
}
mock.module('@/lib/db', () => ({ db }))
const { getSlotsForServices } = await import('../src/lib/slots')
setSystemTime(new Date('2026-11-03T09:20:00Z'))
afterAll(() => setSystemTime())

const regular = { serviceId: 'package', addonIds: [] }
const vip = { serviceId: 'vip', addonIds: [] }
const generate = (date: string) => getSlotsForServices(date, [regular], 'FEMALE')

test('applies gender-specific blocks only to that schedule and shared blocks to both', async () => {
  blocks = [
    { gender: 'MALE', startTime: '09:00', endTime: '10:00' },
    { gender: null, startTime: '13:00', endTime: '14:00' },
  ]
  try {
    const women = await generate('2026-11-04')
    const men = await getSlotsForServices('2026-11-04', [regular], 'MALE')
    expect(women.find(slot => slot.startTime === '09:00')?.taken).toBe(false)
    expect(men.find(slot => slot.startTime === '09:00')?.taken).toBe(true)
    expect(women.find(slot => slot.startTime === '13:00')?.taken).toBe(true)
    expect(men.find(slot => slot.startTime === '13:00')?.taken).toBe(true)
  } finally {
    blocks = []
  }
})

test('looks up blocks by inclusive date range as well as single-day date', async () => {
  await generate('2026-11-04')
  expect(blockQuery?.sql).toContain('"blocked_slots"."date" = $1')
  expect(blockQuery?.sql).toContain('"blocked_slots"."date" <= $2')
  expect(blockQuery?.sql).toContain('"blocked_slots"."endDate" >= $3')
  expect(blockQuery?.params).toEqual(Array(3).fill('2026-11-04T00:00:00.000Z'))
})

test('retains elapsed slots and reserves the rest period before closing', async () => {
  const slots = await generate('2026-11-03')
  expect(slots.find(slot => slot.startTime === '12:30')).toMatchObject({ taken: true, expired: true, availableCount: 0 })
  expect(slots.find(slot => slot.startTime === '13:00')).toMatchObject({ taken: false, availableCount: 2, endTime: '14:07' })
  expect(slots.some(slot => slot.startTime === '17:00')).toBe(false)
  expect((await generate('2026-11-04'))[0]).toMatchObject({ startTime: '07:00', taken: false })
  expect((await generate('2026-11-02')).every(slot => slot.taken && slot.expired)).toBe(true)
})

test('shares two places across all bookings and allows only one overlapping VIP', async () => {
  const available = async (plans: typeof regular[], startTime = '13:00') =>
    (await getSlotsForServices('2026-11-04', plans, 'FEMALE')).find(slot => slot.startTime === startTime)?.taken === false
  includeVip = true
  try {
    expect(await available([regular, vip])).toBe(true)
    expect(await available([regular, regular, vip])).toBe(false)
    expect(await available([vip, vip])).toBe(false)
    existing = [{ serviceId: 'vip', nameFa: 'شاهانه', tier: null, startTime: '13:00', endTime: '15:14' }]
    expect(await available([regular, vip], '15:00')).toBe(false)
    includeVip = false
    expect(await available([regular], '15:00')).toBe(true)
    expect(await available([regular, regular], '15:00')).toBe(false)
    expect(await available([regular, regular], '15:30')).toBe(true)
    includeVip = true
    expect(await available([regular, vip], '15:30')).toBe(true)
  } finally {
    existing = []
    includeVip = false
  }
})
