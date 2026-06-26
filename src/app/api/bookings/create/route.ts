import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { zarinpalRequest } from '@/lib/zarinpal'
import { BookingStatus } from '@prisma/client'
import { randomUUID } from 'crypto'
import type { BookingCreateInput, Gender } from '@/types'

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export async function POST(req: NextRequest) {
  let body: { bookings: BookingCreateInput[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { bookings } = body
  if (!Array.isArray(bookings) || bookings.length === 0) {
    return NextResponse.json({ error: 'bookings must be a non-empty array' }, { status: 400 })
  }

  for (const b of bookings) {
    if (!b.serviceId || !b.customerName || !b.customerPhone || !b.date || !b.startTime) {
      return NextResponse.json({ error: 'Missing required fields in one or more bookings' }, { status: 400 })
    }
    if (b.gender !== 'FEMALE' && b.gender !== 'MALE') {
      return NextResponse.json({ error: 'gender must be FEMALE or MALE' }, { status: 400 })
    }
    if (b.addonIds !== undefined && !Array.isArray(b.addonIds)) {
      return NextResponse.json({ error: 'addonIds must be an array' }, { status: 400 })
    }
  }

  // All bookings in a group must share the same gender
  const genders = [...new Set(bookings.map(b => b.gender))]
  if (genders.length !== 1) {
    return NextResponse.json({ error: 'All bookings in a group must have the same gender' }, { status: 400 })
  }
  const gender = genders[0] as Gender

  const serviceIds = [...new Set(bookings.map(b => b.serviceId))]
  const services = await prisma.service.findMany({ where: { id: { in: serviceIds }, isActive: true } })
  if (services.length !== serviceIds.length) {
    return NextResponse.json({ error: 'One or more services not found or inactive' }, { status: 404 })
  }
  const serviceMap = new Map(services.map(s => [s.id, s]))

  const allAddonIds = [...new Set(bookings.flatMap(b => b.addonIds ?? []))]
  const fetchedAddons = allAddonIds.length > 0
    ? await prisma.addon.findMany({ where: { id: { in: allAddonIds }, isActive: true }, select: { id: true, price: true, requiresTier: true } })
    : []
  if (fetchedAddons.length !== allAddonIds.length) {
    return NextResponse.json({ error: 'One or more add-ons are invalid' }, { status: 400 })
  }
  const addonMap = new Map(fetchedAddons.map(a => [a.id, a]))

  for (const b of bookings) {
    const svc = serviceMap.get(b.serviceId)!
    const addonIds = [...new Set(b.addonIds ?? [])]
    if (svc.tier === null && addonIds.some(id => addonMap.get(id)?.requiresTier)) {
      return NextResponse.json({ error: 'A tier-restricted add-on was selected for a non-tier service' }, { status: 400 })
    }
  }

  // Prevent booking the same room twice in one group
  const bookedServiceIds = bookings.map(b => b.serviceId)
  if (new Set(bookedServiceIds).size !== bookedServiceIds.length) {
    return NextResponse.json({ error: 'Each room can only be booked once per group' }, { status: 400 })
  }

  // Server-side gender window enforcement
  const [year, month, day] = bookings[0].date.split('-').map(Number)
  const jsDate = new Date(Date.UTC(year, month - 1, day))
  const jsDayMap: Record<number, number> = { 6: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 }
  const dayOfWeek = jsDayMap[jsDate.getUTCDay()]
  const workingDay = await prisma.workingHours.findFirst({ where: { dayOfWeek, gender, isOpen: true } })
  if (!workingDay) {
    return NextResponse.json({ error: 'No working hours configured for this gender and day' }, { status: 400 })
  }
  const openMin = timeToMinutes(workingDay.openTime)
  const closeMin = timeToMinutes(workingDay.closeTime)
  const startMin = timeToMinutes(bookings[0].startTime)
  if (startMin < openMin || startMin >= closeMin) {
    return NextResponse.json({ error: 'Selected time is outside the allowed session window for this gender' }, { status: 400 })
  }

  const groupToken = randomUUID()
  const bookingDate = jsDate

  const bookingData = bookings.map(b => {
    const svc = serviceMap.get(b.serviceId)!
    const addonIds = [...new Set(b.addonIds ?? [])]
    const selectedAddons = addonIds.map(id => addonMap.get(id)!)
    const addonsPricePaid = selectedAddons.reduce((s, a) => s + a.price, 0)
    const endTime = addMinutesToTime(b.startTime, svc.durationMinutes)
    return { b, svc, selectedAddons, addonsPricePaid, endTime }
  })

  const { getAvailableSlots } = await import('@/lib/slots')
  const slotsForDate = await getAvailableSlots(
    bookings[0].date,
    Math.max(...bookingData.map(({ svc }) => svc.durationMinutes)),
    bookings.length,
    gender,
  )
  const requestedSlot = slotsForDate.find(s => s.startTime === bookings[0].startTime)
  if (!requestedSlot || requestedSlot.taken) {
    return NextResponse.json({ error: 'Requested time slot is no longer available' }, { status: 409 })
  }

  const totalPrice = bookingData.reduce((s, { svc, addonsPricePaid }) => s + svc.price + addonsPricePaid, 0)
  const payerPhone = bookings[0].customerPhone
  const firstServiceName = serviceMap.get(bookings[0].serviceId)!.nameFa
  const paymentDescription = bookings.length === 1
    ? `رزرو ${firstServiceName} — نخلسپا`
    : `رزرو گروهی ${bookings.length} غرفه — نخلسپا`

  const createdBookings = await prisma.$transaction(
    bookingData.map(({ b, selectedAddons, addonsPricePaid, endTime }) =>
      prisma.booking.create({
        data: {
          serviceId: b.serviceId,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerNotes: b.customerNotes,
          date: bookingDate,
          startTime: b.startTime,
          endTime,
          gender,
          status: BookingStatus.PENDING_PAYMENT,
          addonsPricePaid,
          groupToken,
          addons: {
            create: selectedAddons.map(a => ({ addonId: a.id, pricePaid: a.price })),
          },
        },
      })
    )
  )

  const payerBooking = createdBookings[0]

  try {
    const { authority, paymentUrl } = await zarinpalRequest(totalPrice, paymentDescription, payerPhone)
    await prisma.booking.update({ where: { id: payerBooking.id }, data: { zarinpalAuthority: authority } })
    return NextResponse.json({ paymentUrl })
  } catch (err) {
    console.error('Zarinpal request failed, rolling back bookings', err)
    try {
      await prisma.booking.deleteMany({ where: { groupToken } })
    } catch (deleteErr) {
      console.error('CRITICAL: failed to delete orphaned bookings for groupToken', groupToken, deleteErr)
    }
    return NextResponse.json({ error: 'Payment gateway error' }, { status: 502 })
  }
}
