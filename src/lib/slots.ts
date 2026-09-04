import { and, eq, inArray, isNotNull, ne } from 'drizzle-orm'
import { db } from '@/lib/db'
import { BookingStatus, blockedSlots, bookings, services, workingHours } from '@/db/schema'
import type { SlotDTO } from '@/types'

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) throw new Error(`Invalid time format: "${t}"`)
  return h * 60 + m
}

function minutesToTime(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

function parseDateUTC(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

async function getWorkingDay(jsDate: Date, gender: 'FEMALE' | 'MALE') {
  const jsDayMap: Record<number, number> = { 6: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 }
  const dayOfWeek = jsDayMap[jsDate.getUTCDay()]
  const [row] = await db.select().from(workingHours).where(and(eq(workingHours.dayOfWeek, dayOfWeek), eq(workingHours.gender, gender), eq(workingHours.isOpen, true))).limit(1)
  return row
}

async function getBlockedRanges(jsDate: Date) {
  const blocked = await db.select({ startTime: blockedSlots.startTime, endTime: blockedSlots.endTime }).from(blockedSlots).where(eq(blockedSlots.date, jsDate))
  return blocked.map(b => ({ start: timeToMinutes(b.startTime), end: timeToMinutes(b.endTime) }))
}

export async function getAvailableSlots(
  date: string,
  durationMinutes: number,
  count = 1,
  gender: 'FEMALE' | 'MALE',
): Promise<SlotDTO[]> {
  const jsDate = parseDateUTC(date)
  const workingDay = await getWorkingDay(jsDate, gender)
  if (!workingDay) return []

  const open = timeToMinutes(workingDay.openTime)
  const close = timeToMinutes(workingDay.closeTime)

  const [{ totalRooms }] = await db.select({ totalRooms: db.$count(services, and(eq(services.isActive, true), isNotNull(services.tier))) }).from(services)

  const existingBookings = await db.select({ startTime: bookings.startTime, endTime: bookings.endTime }).from(bookings).where(and(eq(bookings.date, jsDate), ne(bookings.status, BookingStatus.CANCELLED), eq(bookings.gender, gender)))

  const existingBookingRanges = existingBookings.map(b => ({
    start: timeToMinutes(b.startTime),
    end: timeToMinutes(b.endTime),
  }))

  const bookingsForSlot = (slotStart: number, slotEnd: number): number =>
    existingBookingRanges.filter(r => r.start < slotEnd && r.end > slotStart).length

  const blockedRanges = await getBlockedRanges(jsDate)

  const slots: SlotDTO[] = []
  let cursor = open
  while (cursor + durationMinutes <= close) {
    const slotEnd = cursor + durationMinutes
    const slotStartStr = minutesToTime(cursor)

    const isAdminBlocked = blockedRanges.some(r => cursor < r.end && slotEnd > r.start)
    if (isAdminBlocked) {
      slots.push({ startTime: slotStartStr, endTime: minutesToTime(slotEnd), taken: true, availableCount: 0 })
      cursor += 30
      continue
    }

    const booked = bookingsForSlot(cursor, slotEnd)
    const availableCount = Math.max(0, totalRooms - booked)
    slots.push({
      startTime: slotStartStr,
      endTime: minutesToTime(slotEnd),
      taken: availableCount < count,
      availableCount,
    })
    cursor += 30
  }
  return slots
}

export async function getSlotsForRooms(
  date: string,
  serviceIds: string[],
  gender: 'FEMALE' | 'MALE',
): Promise<SlotDTO[]> {
  if (serviceIds.length === 0) return []

  const jsDate = parseDateUTC(date)
  const workingDay = await getWorkingDay(jsDate, gender)
  if (!workingDay) return []

  const open = timeToMinutes(workingDay.openTime)
  const close = timeToMinutes(workingDay.closeTime)

  const serviceRows = await db.select({ id: services.id, durationMinutes: services.durationMinutes }).from(services).where(and(inArray(services.id, serviceIds), eq(services.isActive, true)))
  if (serviceRows.length === 0) return []
  const durationMinutes = Math.max(...serviceRows.map(s => s.durationMinutes))

  const bookingsByRoom = await db.select({ serviceId: bookings.serviceId, startTime: bookings.startTime, endTime: bookings.endTime }).from(bookings).where(and(inArray(bookings.serviceId, serviceIds), eq(bookings.date, jsDate), ne(bookings.status, BookingStatus.CANCELLED), eq(bookings.gender, gender)))

  const roomRanges = new Map<string, { start: number; end: number }[]>()
  for (const id of serviceIds) roomRanges.set(id, [])
  for (const b of bookingsByRoom) {
    roomRanges.get(b.serviceId)!.push({
      start: timeToMinutes(b.startTime),
      end: timeToMinutes(b.endTime),
    })
  }

  const blockedRanges = await getBlockedRanges(jsDate)

  const [{ totalRooms }] = await db.select({ totalRooms: db.$count(services, and(eq(services.isActive, true), isNotNull(services.tier))) }).from(services)

  const allBookings = await db.select({ startTime: bookings.startTime, endTime: bookings.endTime }).from(bookings).where(and(eq(bookings.date, jsDate), ne(bookings.status, BookingStatus.CANCELLED), eq(bookings.gender, gender)))
  const allRanges = allBookings.map(b => ({
    start: timeToMinutes(b.startTime),
    end: timeToMinutes(b.endTime),
  }))

  const slots: SlotDTO[] = []
  let cursor = open
  while (cursor + durationMinutes <= close) {
    const slotEnd = cursor + durationMinutes
    const slotStartStr = minutesToTime(cursor)

    const isAdminBlocked = blockedRanges.some(r => cursor < r.end && slotEnd > r.start)
    if (isAdminBlocked) {
      slots.push({ startTime: slotStartStr, endTime: minutesToTime(slotEnd), taken: true, availableCount: 0 })
      cursor += 30
      continue
    }

    const hasConflict = serviceIds.some(id =>
      roomRanges.get(id)!.some(r => r.start < slotEnd && r.end > cursor)
    )

    const booked = allRanges.filter(r => r.start < slotEnd && r.end > cursor).length
    const availableCount = Math.max(0, totalRooms - booked)

    slots.push({
      startTime: slotStartStr,
      endTime: minutesToTime(slotEnd),
      taken: hasConflict,
      availableCount,
    })
    cursor += 30
  }
  return slots
}
