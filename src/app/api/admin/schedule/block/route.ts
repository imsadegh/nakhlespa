// Auth enforced by src/proxy.ts for /api/admin/* routes
import { NextRequest, NextResponse } from 'next/server'
import { blockedSlots } from '@/db/schema'
import { db } from '@/lib/db'

function parseBlockDate(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-')) return null
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const { date, endDate = null, allDay = false, reason, gender = null } = body ?? {}
  const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/
  if (
    typeof allDay !== 'boolean' ||
    (gender !== null && gender !== 'FEMALE' && gender !== 'MALE') ||
    (reason != null && typeof reason !== 'string')
  ) {
    return NextResponse.json({ error: 'Invalid blocked time range' }, { status: 400 })
  }
  const blockDate = parseBlockDate(date)
  const blockEndDate = parseBlockDate(endDate)
  if (!blockDate || (endDate !== null && (!blockEndDate || blockEndDate < blockDate))) {
    return NextResponse.json({ error: 'Invalid block date range' }, { status: 400 })
  }
  const startTime = allDay ? '00:00' : body?.startTime
  const endTime = allDay ? '24:00' : body?.endTime
  if (!allDay && (
    typeof startTime !== 'string' || !timePattern.test(startTime) ||
    typeof endTime !== 'string' || !timePattern.test(endTime) || startTime >= endTime
  )) return NextResponse.json({ error: 'Invalid blocked time range' }, { status: 400 })

  try {
    const [block] = await db.insert(blockedSlots).values({
      date: blockDate, endDate: blockEndDate, startTime, endTime, reason, gender,
    }).returning()
    return NextResponse.json(block)
  } catch (err) {
    console.error('Block create error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
