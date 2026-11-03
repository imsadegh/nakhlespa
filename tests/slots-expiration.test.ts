import { afterAll, expect, mock, setSystemTime, test } from 'bun:test'
import { workingHours, services } from '../src/db/schema'

const db = {
  $count: () => 4,
  select: () => ({ from: (table: unknown) => {
    const rows = table === workingHours ? [{ openTime: '07:00', closeTime: '18:00' }]
      : table === services ? [{ id: 'package', durationMinutes: 60, tier: null, totalRooms: 4 }] : []
    const result = { then: (resolve: (value: unknown) => unknown) => Promise.resolve(rows).then(resolve), limit: async () => rows }
    return { ...result, where: () => result }
  } }),
}
mock.module('@/lib/db', () => ({ db }))
const { getAvailableSlots, getSlotsForServices } = await import('../src/lib/slots')
setSystemTime(new Date('2026-11-03T09:20:00Z'))
afterAll(() => setSystemTime())

for (const [name, generate] of [
  ['single service', (date: string) => getAvailableSlots(date, 60, 1, 'FEMALE')],
  ['group services', (date: string) => getSlotsForServices(date, [{ serviceId: 'package', addonIds: [] }], 'FEMALE')],
] as const) {
  test(`${name}: retains elapsed slots as unavailable and leaves future slots available`, async () => {
    const slots = await generate('2026-11-03')
    expect(slots.find(slot => slot.startTime === '12:30')).toMatchObject({ taken: true, expired: true, availableCount: 0 })
    expect(slots.find(slot => slot.startTime === '13:00')).toMatchObject({ taken: false, availableCount: 4 })
    expect((await generate('2026-11-04'))[0]).toMatchObject({ startTime: '07:00', taken: false })
    expect((await generate('2026-11-02')).every(slot => slot.taken && slot.expired)).toBe(true)
  })
}
