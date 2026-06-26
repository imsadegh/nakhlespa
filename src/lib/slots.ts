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

async function getWorkingDay(jsDate: Date, gender: 'FEMALE' | 'MALE') {
  const jsDayMap: Record<number, number> = { 6: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 }
  const dayOfWeek = jsDayMap[jsDate.getUTCDay()]
  return prisma.workingHours.findFirst({ where: { dayOfWeek, gender, isOpen: true } })
}

async function getBlockedRanges(jsDate: Date) {
  const blocked = await prisma.blockedSlot.findMany({
    where: { date: jsDate },
    select: { startTime: true, endTime: true },
  })
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

  const totalRooms = await prisma.service.count({ where: { isActive: true, tier: { not: null } } })

  const existingBookings = await prisma.booking.findMany({
    where: { date: jsDate, status: { not: BookingStatus.CANCELLED }, gender },
    select: { startTime: true, endTime: true },
  })

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

  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds }, isActive: true },
    select: { id: true, durationMinutes: true },
  })
  if (services.length === 0) return []
  const durationMinutes = Math.max(...services.map(s => s.durationMinutes))

  const bookingsByRoom = await prisma.booking.findMany({
    where: {
      serviceId: { in: serviceIds },
      date: jsDate,
      status: { not: BookingStatus.CANCELLED },
    },
    select: { serviceId: true, startTime: true, endTime: true },
  })

  const roomRanges = new Map<string, { start: number; end: number }[]>()
  for (const id of serviceIds) roomRanges.set(id, [])
  for (const b of bookingsByRoom) {
    roomRanges.get(b.serviceId)!.push({
      start: timeToMinutes(b.startTime),
      end: timeToMinutes(b.endTime),
    })
  }

  const blockedRanges = await getBlockedRanges(jsDate)

  const totalRooms = await prisma.service.count({ where: { isActive: true, tier: { not: null } } })

  const allBookings = await prisma.booking.findMany({
    where: { date: jsDate, status: { not: BookingStatus.CANCELLED }, gender },
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
