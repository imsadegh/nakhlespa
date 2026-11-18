export const MAX_SIMULTANEOUS_BOOKINGS = 2

type TimeRange = { start: number; end: number }

export function getReservedMinutes(sessionMinutes: number) {
  return sessionMinutes + Math.floor(sessionMinutes / 60) * 7
}

export function getAvailablePlaces(capacity: number, bookings: TimeRange[], start: number, end: number) {
  const overlapping = bookings.filter(range => range.start < end && range.end > start)
  // Occupancy can only increase at the start of a reservation.
  const points = [start, ...overlapping.map(range => Math.max(start, range.start))]
  const peak = Math.max(...points.map(point =>
    overlapping.filter(range => range.start <= point && point < range.end).length,
  ))
  return capacity - peak
}
