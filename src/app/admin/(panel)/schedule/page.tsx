import { prisma } from '@/lib/prisma'
import { ScheduleManager } from '@/components/admin/ScheduleManager'

export default async function SchedulePage() {
  const [hours, blocks] = await Promise.all([
    prisma.workingHours.findMany({ orderBy: { dayOfWeek: 'asc' } }),
    prisma.blockedSlot.findMany({ orderBy: { date: 'desc' } }),
  ])
  return <ScheduleManager hours={hours} blocks={blocks} />
}
