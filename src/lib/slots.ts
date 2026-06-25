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

export async function getAvailableSlots(
  date: string,
  durationMinutes: number,
  count = 1,
): Promise<SlotDTO[]> {
  const [year, month, day] = date.split('-').map(Number)
  const jsDate = new Date(Date.UTC(year, month - 1, day))
  // Iranian week: Saturday=0 ... Friday=6. JS getUTCDay: Sunday=0 ... Saturday=6
  const jsDayMap: Record<number, number> = { 6: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 }
  const dayOfWeek = jsDayMap[jsDate.getUTCDay()]

  const workingDay = await prisma.workingHours.findFirst({ where: { dayOfWeek, isOpen: true } })
  if (!workingDay) return []

  const open = timeToMinutes(workingDay.openTime)
  const close = timeToMinutes(workingDay.closeTime)

  // Total number of independent rooms (tier services only — each has its own masseuse)
  const totalRooms = await prisma.service.count({ where: { isActive: true, tier: { not: null } } })

  // All non-cancelled bookings on this date, grouped by startTime
  const existingBookings = await prisma.booking.findMany({
    where: { date: jsDate, status: { not: BookingStatus.CANCELLED } },
    select: { startTime: true, endTime: true },
  })

  // Count bookings per startTime slot
  const bookingsPerSlot = new Map<string, number>()
  for (const b of existingBookings) {
    bookingsPerSlot.set(b.startTime, (bookingsPerSlot.get(b.startTime) ?? 0) + 1)
  }

  const blocked = await prisma.blockedSlot.findMany({
    where: { date: jsDate },
    select: { startTime: true, endTime: true },
  })

  const blockedRanges = blocked.map(b => ({
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

    const booked = bookingsPerSlot.get(slotStartStr) ?? 0
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
