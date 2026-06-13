import { BookingStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) throw new Error(`Invalid time format: "${t}"`)
  return h * 60 + m
}

function minutesToTime(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

export async function getAvailableSlots(date: string, durationMinutes: number): Promise<{ startTime: string; endTime: string }[]> {
  const [year, month, day] = date.split('-').map(Number)
  const jsDate = new Date(Date.UTC(year, month - 1, day))
  // Iranian week: Saturday=0 ... Friday=6. JS getUTCDay: Sunday=0 ... Saturday=6
  const jsDayMap: Record<number, number> = { 6: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 }
  const dayOfWeek = jsDayMap[jsDate.getUTCDay()]

  const workingDay = await prisma.workingHours.findFirst({ where: { dayOfWeek, isOpen: true } })
  if (!workingDay) return []

  const open = timeToMinutes(workingDay.openTime)
  const close = timeToMinutes(workingDay.closeTime)

  const existingBookings = await prisma.booking.findMany({
    where: { date: jsDate, status: { not: BookingStatus.CANCELLED } },
    select: { startTime: true, endTime: true },
  })

  const blocked = await prisma.blockedSlot.findMany({
    where: { date: jsDate },
    select: { startTime: true, endTime: true },
  })

  const busyRanges = [...existingBookings, ...blocked].map(b => ({
    start: timeToMinutes(b.startTime),
    end: timeToMinutes(b.endTime),
  }))

  const slots: { startTime: string; endTime: string; taken: boolean }[] = []
  let cursor = open
  while (cursor + durationMinutes <= close) {
    const slotEnd = cursor + durationMinutes
    const conflict = busyRanges.some(r => cursor < r.end && slotEnd > r.start)
    slots.push({ startTime: minutesToTime(cursor), endTime: minutesToTime(slotEnd), taken: conflict })
    cursor += 30
  }
  return slots
}
