import { expect, mock, test } from 'bun:test'
import type { NewBlockedSlot } from '../src/db/schema'

const saved: NewBlockedSlot[] = []
mock.module('@/lib/db', () => ({
  db: {
    insert: () => ({
      values: (block: NewBlockedSlot) => {
        saved.push(block)
        return { returning: async () => [block] }
      },
    }),
  },
}))

const { POST } = await import('../src/app/api/admin/schedule/block/route')
const range = { date: '2026-11-14', startTime: '09:00', endTime: '10:00' }

function request(body: unknown) {
  return POST(new Request('http://localhost/api/admin/schedule/block', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as never)
}

test('stores the selected schedule and defaults older requests to both', async () => {
  for (const gender of ['FEMALE', 'MALE', null, undefined]) {
    expect((await request({ ...range, gender })).status).toBe(200)
    expect(saved.at(-1)?.gender).toBe(gender ?? null)
  }
})

test('rejects invalid scopes and time ranges before inserting', async () => {
  const count = saved.length
  for (const patch of [{ gender: 'OTHER' }, { date: '2026-02-30' }, { endTime: '08:59' }, { endDate: '2026-11-13' }, { endDate: '2027-02-29' }]) {
    expect((await request({ ...range, ...patch })).status).toBe(400)
  }
  expect(saved).toHaveLength(count)
})

test('stores a six-month all-day closure as one block', async () => {
  const count = saved.length
  const response = await request({ date: range.date, endDate: '2027-05-14', allDay: true, gender: 'FEMALE' })
  expect(response.status).toBe(200)
  expect(saved).toHaveLength(count + 1)
  expect(saved.at(-1)).toMatchObject({
    date: new Date('2026-11-14'), endDate: new Date('2027-05-14'),
    startTime: '00:00', endTime: '24:00', gender: 'FEMALE',
  })
})
