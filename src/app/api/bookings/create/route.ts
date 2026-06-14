import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { zarinpalRequest } from '@/lib/zarinpal'
import { BookingStatus } from '@prisma/client'
import type { BookingCreateInput } from '@/types'

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export async function POST(req: NextRequest) {
  let body: BookingCreateInput
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { serviceId, customerName, customerPhone, date, startTime } = body
  const rawAddonIds: unknown = body.addonIds
  if (!serviceId || !customerName || !customerPhone || !date || !startTime) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (rawAddonIds !== undefined && !Array.isArray(rawAddonIds)) {
    return NextResponse.json({ error: 'addonIds must be an array' }, { status: 400 })
  }
  const addonIds = [...new Set((rawAddonIds as string[] | undefined) ?? [])]

  const service = await prisma.service.findUnique({ where: { id: serviceId } })
  if (!service || !service.isActive) return NextResponse.json({ error: 'Service not found' }, { status: 404 })

  // Validate and fetch add-ons
  let selectedAddons: { id: string; price: number; requiresTier: boolean }[] = []
  if (addonIds.length > 0) {
    selectedAddons = await prisma.addon.findMany({
      where: { id: { in: addonIds }, isActive: true },
      select: { id: true, price: true, requiresTier: true },
    })
    if (selectedAddons.length !== addonIds.length) {
      return NextResponse.json({ error: 'One or more add-ons are invalid' }, { status: 400 })
    }
    // Enforce tier restriction: حمام طهورا only for tier services; non-tier add-ons are available to all services
    if (service.tier === null && selectedAddons.some(a => a.requiresTier)) {
      return NextResponse.json({ error: 'This add-on is not available for the selected service' }, { status: 400 })
    }
  }

  const addonsPricePaid = selectedAddons.reduce((sum, a) => sum + a.price, 0)
  const totalPrice = service.price + addonsPricePaid

  const [year, month, day] = date.split('-').map(Number)
  const bookingDate = new Date(Date.UTC(year, month - 1, day))
  const endTime = addMinutesToTime(startTime, service.durationMinutes)

  const booking = await prisma.booking.create({
    data: {
      serviceId,
      customerName,
      customerPhone,
      customerNotes: body.customerNotes,
      date: bookingDate,
      startTime,
      endTime,
      status: BookingStatus.PENDING_PAYMENT,
      addonsPricePaid,
      addons: {
        create: selectedAddons.map(a => ({ addonId: a.id, pricePaid: a.price })),
      },
    },
  })

  try {
    const { authority, paymentUrl } = await zarinpalRequest(
      totalPrice,
      `رزرو ${service.nameFa} — نخلسپا`,
      customerPhone
    )
    await prisma.booking.update({ where: { id: booking.id }, data: { zarinpalAuthority: authority } })
    return NextResponse.json({ paymentUrl })
  } catch (err) {
    console.error('Zarinpal request failed, rolling back booking', err)
    try {
      await prisma.booking.delete({ where: { id: booking.id } })
    } catch (deleteErr) {
      console.error('CRITICAL: failed to delete orphaned booking', booking.id, deleteErr)
    }
    return NextResponse.json({ error: 'Payment gateway error' }, { status: 502 })
  }
}
