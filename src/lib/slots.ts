import { BookingStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
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

async function getWorkingDay(jsDate: Date) {
  const jsDayMap: Record<number, number> = { 6: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 }
  const dayOfWeek = jsDayMap[jsDate.getUTCDay()]
  return prisma.workingHours.findFirst({ where: { dayOfWeek, isOpen: true } })
}

async function getBlockedRanges(jsDate: Date) {
  const blocked = await prisma.blockedSlot.findMany({
    where: { date: jsDate },
    select: { startTime: true, endTime: true },
  })
  return blocked.map(b => ({ start: timeToMinutes(b.startTime), end: timeToMinutes(b.endTime) }))
}

// Generic slot availability: counts total overlapping bookings vs totalRooms.
// Used when specific rooms haven't been chosen yet (Step 1 not complete).
export async function getAvailableSlots(
  date: string,
  durationMinutes: number,
  count = 1,
): Promise<SlotDTO[]> {
  const jsDate = parseDateUTC(date)
  const workingDay = await getWorkingDay(jsDate)
  if (!workingDay) return []

  const open = timeToMinutes(workingDay.openTime)
  const close = timeToMinutes(workingDay.closeTime)

  // Total number of independent rooms (tier services only — each has its own masseuse)
  const totalRooms = await prisma.service.count({ where: { isActive: true, tier: { not: null } } })

  const existingBookings = await prisma.booking.findMany({
    where: { date: jsDate, status: { not: BookingStatus.CANCELLED } },
    select: { startTime: true, endTime: true },
  })

  const existingBookingRanges = existingBookings.map(b => ({
    start: timeToMinutes(b.startTime),
    end: timeToMinutes(b.endTime),
  }))

  // Count bookings overlapping [slotStart, slotEnd) — booking overlaps if start < slotEnd && end > slotStart
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

// Per-room slot availability: a slot is taken if ANY of the requested specific rooms
// already has a booking at that time. Used when the customer has already chosen their rooms.
export async function getSlotsForRooms(
  date: string,
  serviceIds: string[],
): Promise<SlotDTO[]> {
  if (serviceIds.length === 0) return []

  const jsDate = parseDateUTC(date)
  const workingDay = await getWorkingDay(jsDate)
  if (!workingDay) return []

  const open = timeToMinutes(workingDay.openTime)
  const close = timeToMinutes(workingDay.closeTime)

  // Fetch the longest duration among selected services to drive the slot window
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds }, isActive: true },
    select: { id: true, durationMinutes: true },
  })
  if (services.length === 0) return []
  const durationMinutes = Math.max(...services.map(s => s.durationMinutes))

  // For each selected room, get its existing bookings on this date
  const bookingsByRoom = await prisma.booking.findMany({
    where: {
      serviceId: { in: serviceIds },
      date: jsDate,
      status: { not: BookingStatus.CANCELLED },
    },
    select: { serviceId: true, startTime: true, endTime: true },
  })

  // Map serviceId → list of time ranges already booked
  const roomRanges = new Map<string, { start: number; end: number }[]>()
  for (const id of serviceIds) roomRanges.set(id, [])
  for (const b of bookingsByRoom) {
    roomRanges.get(b.serviceId)!.push({
      start: timeToMinutes(b.startTime),
      end: timeToMinutes(b.endTime),
    })
  }

  const blockedRanges = await getBlockedRanges(jsDate)

  // Total rooms for availableCount display (informational only in this mode)
  const totalRooms = await prisma.service.count({ where: { isActive: true, tier: { not: null } } })

  // All bookings on date for the availableCount badge
  const allBookings = await prisma.booking.findMany({
    where: { date: jsDate, status: { not: BookingStatus.CANCELLED } },
    select: { startTime: true, endTime: true },
  })
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

    // A slot is taken if ANY chosen room has a conflicting booking
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
