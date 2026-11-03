import { expect, test } from 'bun:test'
import { getTehranDate, isSlotPast } from '../src/lib/slot-time'

test('disables elapsed and already-started slots at 12:50 Tehran time', () => {
  const now = new Date('2026-11-03T09:20:00Z')
  expect(isSlotPast('2026-11-03', '07:00', now)).toBe(true)
  expect(isSlotPast('2026-11-03', '12:30', now)).toBe(true)
  expect(isSlotPast('2026-11-03', '12:50', now)).toBe(true)
  expect(isSlotPast('2026-11-03', '13:00', now)).toBe(false)
  expect(isSlotPast('2026-11-04', '07:00', now)).toBe(false)
  expect(isSlotPast('2026-11-02', '23:30', now)).toBe(true)
})

test('uses Tehran calendar date across UTC midnight boundaries', () => {
  const now = new Date('2026-11-03T21:00:00Z')
  expect(getTehranDate(now)).toBe('2026-11-04')
  expect(isSlotPast('2026-11-03', '23:30', now)).toBe(true)
  expect(isSlotPast('2026-11-04', '00:00', now)).toBe(true)
  expect(isSlotPast('2026-11-04', '01:00', now)).toBe(false)
})
