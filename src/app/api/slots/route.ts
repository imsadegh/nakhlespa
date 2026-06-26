import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAvailableSlots, getSlotsForRooms } from '@/lib/slots'
import type { Gender } from '@/types'

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  const serviceId = req.nextUrl.searchParams.get('serviceId')
  const serviceIdsParam = req.nextUrl.searchParams.get('serviceIds')
  const countParam = req.nextUrl.searchParams.get('count')
  const genderParam = req.nextUrl.searchParams.get('gender')

  if (!date || !serviceId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  if (genderParam !== 'FEMALE' && genderParam !== 'MALE') {
    return NextResponse.json({ error: 'gender must be FEMALE or MALE' }, { status: 400 })
  }
  const gender = genderParam as Gender

  try {
    if (serviceIdsParam) {
      const serviceIds = serviceIdsParam.split(',').filter(Boolean)
      const slots = await getSlotsForRooms(date, serviceIds, gender)
      return NextResponse.json(slots)
    }

    const count = countParam ? Math.max(1, parseInt(countParam, 10)) : 1
    const service = await prisma.service.findUnique({ where: { id: serviceId } })
    if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    const slots = await getAvailableSlots(date, service.durationMinutes, count, gender)
    return NextResponse.json(slots)
  } catch (err) {
    console.error('Slots fetch error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
