import { BookingStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

export async function getAvailableSlots(date: string, durationMinutes: number): Promise<{ startTime: string; endTime: string }[]> {
  const jsDate = new Date(date)
  // Iranian week: Saturday=0 ... Friday=6. JS getDay: Sunday=0 ... Saturday=6
  const jsDayMap: Record<number, number> = { 6: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 }
  const dayOfWeek = jsDayMap[jsDate.getDay()]

  const workingDay = await prisma.workingHours.findFirst({ where: { dayOfWeek, isOpen: true } })
  if (!workingDay) return []

  const open = timeToMinutes(workingDay.openTime)
  const close = timeToMinutes(workingDay.closeTime)

  const existingBookings = await prisma.booking.findMany({
    where: { date: new Date(date), status: { not: BookingStatus.CANCELLED } },
    select: { startTime: true, endTime: true },
  })

  const blocked = await prisma.blockedSlot.findMany({
    where: { date: new Date(date) },
    select: { startTime: true, endTime: true },
  })

  const busyRanges = [...existingBookings, ...blocked].map(b => ({
    start: timeToMinutes(b.startTime),
    end: timeToMinutes(b.endTime),
  }))

  const slots: { startTime: string; endTime: string }[] = []
  let cursor = open
  while (cursor + durationMinutes <= close) {
    const slotEnd = cursor + durationMinutes
    const conflict = busyRanges.some(r => cursor < r.end && slotEnd > r.start)
    if (!conflict) slots.push({ startTime: minutesToTime(cursor), endTime: minutesToTime(slotEnd) })
    cursor += 30
  }
  return slots
}
