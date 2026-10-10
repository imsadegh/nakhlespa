import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { services } from '@/db/schema'
import { getAvailableSlots, getSlotsForServices } from '@/lib/slots'
import type { Gender } from '@/types'

type SlotBookingPlan = { serviceId: string; addonIds: string[] }

function isSlotBookingPlan(plan: unknown): plan is SlotBookingPlan {
  if (!plan || typeof plan !== 'object') return false
  const candidate = plan as Record<string, unknown>
  return typeof candidate.serviceId === 'string' && Array.isArray(candidate.addonIds) && candidate.addonIds.every(id => typeof id === 'string')
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  const serviceId = req.nextUrl.searchParams.get('serviceId')
  const serviceIdsParam = req.nextUrl.searchParams.get('serviceIds')
  const bookingPlansParam = req.nextUrl.searchParams.get('bookingPlans')
  const countParam = req.nextUrl.searchParams.get('count')
  const genderParam = req.nextUrl.searchParams.get('gender')

  if (!date || !serviceId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  if (genderParam !== 'FEMALE' && genderParam !== 'MALE') {
    return NextResponse.json({ error: 'gender must be FEMALE or MALE' }, { status: 400 })
  }
  const gender = genderParam as Gender

  try {
    if (bookingPlansParam) {
      let bookingPlans: unknown
      try {
        bookingPlans = JSON.parse(bookingPlansParam)
      } catch {
        return NextResponse.json({ error: 'Invalid bookingPlans' }, { status: 400 })
      }
      if (!Array.isArray(bookingPlans) || bookingPlans.length === 0 || !bookingPlans.every(isSlotBookingPlan)) {
        return NextResponse.json({ error: 'Invalid bookingPlans' }, { status: 400 })
      }
      const slots = await getSlotsForServices(date, bookingPlans, gender)
      return NextResponse.json(slots)
    }

    if (serviceIdsParam) {
      const bookingPlans = serviceIdsParam.split(',').filter(Boolean).map(serviceId => ({ serviceId, addonIds: [] }))
      const slots = await getSlotsForServices(date, bookingPlans, gender)
      return NextResponse.json(slots)
    }

    const count = countParam ? Math.max(1, parseInt(countParam, 10)) : 1
    const [service] = await db.select().from(services).where(eq(services.id, serviceId)).limit(1)
    if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    const slots = await getAvailableSlots(date, service.durationMinutes, count, gender)
    return NextResponse.json(slots)
  } catch (err) {
    console.error('Slots fetch error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
