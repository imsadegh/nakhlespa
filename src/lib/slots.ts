import { and, eq, gte, inArray, lte, ne, or } from 'drizzle-orm'
import { db } from '@/lib/db'
import { BookingStatus, addons, blockedSlots, bookings, services, workingHours } from '@/db/schema'
import type { Gender, SlotDTO } from '@/types'
import { isSlotPast } from '@/lib/slot-time'
import { getCustomizationTier, PAUSED_BATH_ADDON } from '@/lib/spa-packages'
import { getAvailablePlaces, getReservedMinutes, MAX_SIMULTANEOUS_BOOKINGS } from '@/lib/booking-timing'

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function minutesToTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

export async function getSlotsForServices(
  date: string,
  bookingPlans: { serviceId: string; addonIds: string[] }[],
  gender: Gender,
  reader: Pick<typeof db, 'select'> = db,
): Promise<SlotDTO[]> {
  if (bookingPlans.length === 0 || bookingPlans.length > MAX_SIMULTANEOUS_BOOKINGS || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return []

  const jsDate = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(jsDate.getTime()) || jsDate.toISOString().slice(0, 10) !== date) return []
  const dayOfWeek = (jsDate.getUTCDay() + 1) % 7
  const [workingDay] = await reader.select().from(workingHours).where(and(eq(workingHours.dayOfWeek, dayOfWeek), eq(workingHours.gender, gender), eq(workingHours.isOpen, true))).limit(1)
  if (!workingDay) return []

  const serviceIds = [...new Set(bookingPlans.map(plan => plan.serviceId))]
  const serviceRows = await reader.select().from(services).where(and(inArray(services.id, serviceIds), eq(services.isActive, true)))
  if (serviceRows.length !== serviceIds.length) return []
  const serviceMap = new Map(serviceRows.map(service => [service.id, service]))
  const addonIds = [...new Set(bookingPlans.flatMap(plan => plan.addonIds))]
  const addonRows = addonIds.length
    ? await reader.select({ id: addons.id, durationMinutes: addons.durationMinutes }).from(addons).where(and(inArray(addons.id, addonIds), eq(addons.isActive, true), ne(addons.nameFa, PAUSED_BATH_ADDON)))
    : []
  if (addonRows.length !== addonIds.length) return []
  const addonDurationMap = new Map(addonRows.map(addon => [addon.id, addon.durationMinutes]))
  const plans = bookingPlans.map(plan => {
    const service = serviceMap.get(plan.serviceId)!
    const addonMinutes = [...new Set(plan.addonIds)].reduce((sum, id) => sum + addonDurationMap.get(id)!, 0)
    return { service, duration: getReservedMinutes(service.durationMinutes + addonMinutes) }
  }).sort((a, b) => b.duration - a.duration)

  const existing = await reader.select({
    serviceId: bookings.serviceId, startTime: bookings.startTime, endTime: bookings.endTime,
    nameFa: services.nameFa, tier: services.tier,
  }).from(bookings).innerJoin(services, eq(bookings.serviceId, services.id))
    .where(and(eq(bookings.date, jsDate), ne(bookings.status, BookingStatus.CANCELLED)))
  const ranges = existing.map(booking => ({
    serviceId: booking.serviceId,
    start: timeToMinutes(booking.startTime),
    end: timeToMinutes(booking.endTime),
    vip: getCustomizationTier(booking.nameFa, booking.tier) === 3,
  }))
  const blocked = await reader.select().from(blockedSlots).where(or(
    eq(blockedSlots.date, jsDate),
    and(lte(blockedSlots.date, jsDate), gte(blockedSlots.endDate, jsDate)),
  ))
  const blockedRanges = blocked
    .filter(range => range.gender === null || range.gender === gender)
    .map(range => ({ start: timeToMinutes(range.startTime), end: timeToMinutes(range.endTime) }))
  const longest = plans[0].duration
  const close = timeToMinutes(workingDay.closeTime)
  const slots: SlotDTO[] = []

  for (let start = timeToMinutes(workingDay.openTime); start + longest <= close; start += 30) {
    const startTime = minutesToTime(start)
    const endTime = minutesToTime(start + longest)
    const expired = isSlotPast(date, startTime)
    if (expired || blockedRanges.some(range => start < range.end && start + longest > range.start)) {
      slots.push({ startTime, endTime, taken: true, availableCount: 0, expired })
      continue
    }

    let taken = false
    const groupRanges = [...ranges]
    let availableCount = plans.length
    for (const { service, duration } of plans) {
      const vip = getCustomizationTier(service.nameFa, service.tier) === 3
      const end = start + duration
      const remaining = getAvailablePlaces(MAX_SIMULTANEOUS_BOOKINGS, groupRanges, start, end)
      const vipTaken = vip && groupRanges.some(range => range.vip && range.start < end && range.end > start)
      if (plans.length === 1) availableCount = vip ? Math.min(1, remaining) : remaining
      const roomTaken = service.tier !== null && groupRanges.some(range => range.serviceId === service.id && range.start < end && range.end > start)
      if (remaining < 1 || vipTaken || roomTaken) {
        taken = true
        break
      }
      groupRanges.push({ serviceId: service.id, start, end, vip })
    }
    slots.push({ startTime, endTime, taken, availableCount: taken ? 0 : availableCount })
  }
  return slots
}
