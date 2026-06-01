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
  if (!serviceId || !customerName || !customerPhone || !date || !startTime) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const service = await prisma.service.findUnique({ where: { id: serviceId } })
  if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 })

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
    },
  })

  try {
    const { authority, paymentUrl } = await zarinpalRequest(
      service.price,
      `رزرو ${service.nameFa} — نخلسپا`,
      customerPhone
    )
    await prisma.booking.update({ where: { id: booking.id }, data: { zarinpalAuthority: authority } })
    return NextResponse.json({ paymentUrl })
  } catch (err) {
    await prisma.booking.delete({ where: { id: booking.id } })
    console.error('Zarinpal request failed, booking rolled back', err)
    return NextResponse.json({ error: 'Payment gateway error' }, { status: 502 })
  }
}
