import { NextResponse } from 'next/server'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { workingHours } from '@/db/schema'

export const dynamic = 'force-dynamic'

export async function GET() {
  const hours = await db.select({ dayOfWeek: workingHours.dayOfWeek, gender: workingHours.gender, isOpen: workingHours.isOpen, openTime: workingHours.openTime, closeTime: workingHours.closeTime })
    .from(workingHours).orderBy(asc(workingHours.gender), asc(workingHours.dayOfWeek))
  return NextResponse.json(hours)
}
