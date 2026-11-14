import { expect, test } from 'bun:test'
import { getReservedMinutes, getAvailablePlaces } from './booking-timing'

test('adds rest for each completed hour of the session', () => {
  expect([40, 60, 100, 120, 180].map(getReservedMinutes)).toEqual([40, 67, 107, 134, 201])
})

test('uses peak occupancy and allows back-to-back reservations', () => {
  const bookings = [{ start: 0, end: 60 }, { start: 60, end: 120 }]
  expect(getAvailablePlaces(3, bookings, 30, 90)).toBe(2)
  expect(getAvailablePlaces(1, bookings, 30, 90)).toBe(0)
  expect(getAvailablePlaces(1, bookings, 120, 150)).toBe(1)
})
