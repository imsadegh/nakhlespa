import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const services = await prisma.service.findMany({ where: { isActive: true } })
    return NextResponse.json(services)
  } catch (err) {
    console.error('Services fetch error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
