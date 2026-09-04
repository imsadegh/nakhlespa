import { blockedSlots, workingHours } from '@/db/schema'
import { db } from '@/lib/db'
import { asc, desc } from 'drizzle-orm'
import { ScheduleManager } from '@/components/admin/ScheduleManager'

export const dynamic = 'force-dynamic'

export default async function SchedulePage() {
  const [hours, blocks] = await Promise.all([
    db.select().from(workingHours).orderBy(asc(workingHours.gender), asc(workingHours.dayOfWeek)),
    db.select().from(blockedSlots).orderBy(desc(blockedSlots.date)),
  ])
  return <ScheduleManager hours={hours} blocks={blocks} />
}
