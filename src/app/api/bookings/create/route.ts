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
  const body: BookingCreateInput = await req.json()
  const service = await prisma.service.findUnique({ where: { id: body.serviceId } })
  if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 })

  const [year, month, day] = body.date.split('-').map(Number)
  const bookingDate = new Date(Date.UTC(year, month - 1, day))
  const endTime = addMinutesToTime(body.startTime, service.durationMinutes)

  const booking = await prisma.booking.create({
    data: {
      serviceId: body.serviceId,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerNotes: body.customerNotes,
      date: bookingDate,
      startTime: body.startTime,
      endTime,
      status: BookingStatus.PENDING_PAYMENT,
    },
  })

  const { authority, paymentUrl } = await zarinpalRequest(
    service.price,
    `رزرو ${service.nameFa} — نخلسپا`,
    body.customerPhone
  )

  await prisma.booking.update({ where: { id: booking.id }, data: { zarinpalAuthority: authority } })

  return NextResponse.json({ paymentUrl })
}
