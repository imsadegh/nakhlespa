import { eq } from 'drizzle-orm'
import { bookings, smsReminders } from '@/db/schema'
import { db } from '@/lib/db'
import { getSmsDeliveryReport } from '@/lib/smsir'

const bookingCode = process.argv[2]
if (!bookingCode) {
  console.error('Usage: bun run src/workers/sms-report.ts <booking-code>')
  process.exit(1)
}

try {
  const messages = await db.select({
    template: smsReminders.template,
    scheduledAt: smsReminders.sendAt,
    submittedAt: smsReminders.sentAt,
    status: smsReminders.status,
    attempts: smsReminders.attempts,
    messageId: smsReminders.providerMessageId,
  }).from(smsReminders)
    .innerJoin(bookings, eq(smsReminders.bookingId, bookings.id))
    .where(eq(bookings.bookingCode, bookingCode))
    .orderBy(smsReminders.sendAt)

  for (const message of messages) {
    if (!message.messageId) {
      console.log(message)
      continue
    }
    try {
      const delivery = await getSmsDeliveryReport(message.messageId)
      console.log({ ...message, delivery })
    } catch {
      console.log({ ...message, delivery: 'SMS.ir report unavailable' })
      process.exitCode = 1
    }
  }
  if (!messages.length) console.log('No SMS records for this booking code.')
} catch {
  console.error('Could not read SMS records from the database.')
  process.exitCode = 1
} finally {
  await db.$client.end()
}
