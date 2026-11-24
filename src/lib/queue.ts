import { setTimeout as sleep } from 'node:timers/promises'
import { and, asc, eq, inArray, lte } from 'drizzle-orm'
import { db } from '@/lib/db'
import { bookings, BookingStatus, services, smsReminders, SmsReminderStatus } from '@/db/schema'
import { sendConfirmSms, sendReminderSms } from '@/lib/smsir'
import { getAppointmentTime } from '@/lib/slot-time'

const POLL_MS = 5_000
const CLAIM_MS = 120_000
const RETRY_MS = [30_000, 120_000, 300_000]

async function findDueMessage(now: Date) {
  const [message] = await db.select({
    sms: smsReminders,
    booking: bookings,
    serviceName: services.nameFa,
  }).from(smsReminders)
    .innerJoin(bookings, eq(smsReminders.bookingId, bookings.id))
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(and(
      inArray(smsReminders.status, [SmsReminderStatus.PENDING, SmsReminderStatus.SENDING]),
      lte(smsReminders.nextAttemptAt, now),
    ))
    .orderBy(asc(smsReminders.nextAttemptAt), asc(smsReminders.id))
    .limit(1)
  return message
}

type DueMessage = NonNullable<Awaited<ReturnType<typeof findDueMessage>>>

export function shouldSkipBookingSms(
  booking: Pick<DueMessage['booking'], 'status' | 'date' | 'startTime'>,
  now: Date,
): boolean {
  return (booking.status !== BookingStatus.PAID && booking.status !== BookingStatus.CONFIRMED)
    || now.getTime() >= getAppointmentTime(booking.date, booking.startTime)
}

export async function processSmsJob(
  { sms, booking, serviceName }: DueMessage,
  { database = db, sendConfirm = sendConfirmSms, sendReminder = sendReminderSms }: {
    database?: Pick<typeof db, 'update'>
    sendConfirm?: typeof sendConfirmSms
    sendReminder?: typeof sendReminderSms
  } = {},
) {
  if (!sms.template || !sms.nextAttemptAt) return

  const now = new Date()
  const attempts = sms.attempts + 1
  const [claimed] = await database.update(smsReminders).set({
    status: SmsReminderStatus.SENDING,
    attempts,
    nextAttemptAt: new Date(now.getTime() + CLAIM_MS),
  }).where(and(
    eq(smsReminders.id, sms.id),
    eq(smsReminders.status, sms.status),
    eq(smsReminders.attempts, sms.attempts),
    eq(smsReminders.nextAttemptAt, sms.nextAttemptAt),
  )).returning({ id: smsReminders.id })
  if (!claimed) return

  const claim = and(eq(smsReminders.id, sms.id), eq(smsReminders.attempts, attempts))
  if (shouldSkipBookingSms(booking, new Date())) {
    await database.update(smsReminders).set({
      status: SmsReminderStatus.SKIPPED, nextAttemptAt: null,
    }).where(claim)
    return
  }
  if (attempts > RETRY_MS.length + 1) {
    await database.update(smsReminders).set({
      status: SmsReminderStatus.FAILED, nextAttemptAt: null,
    }).where(claim)
    return
  }

  const params = { name: booking.customerName, service: serviceName, time: booking.startTime }
  let providerMessageId: string | null
  try {
    providerMessageId = sms.template === 'confirm'
      ? await sendConfirm(booking.customerPhone, {
        ...params, bookingCode: booking.bookingCode,
        date: booking.date.toLocaleDateString('fa-IR', { timeZone: 'UTC' }),
      })
      : await sendReminder(booking.customerPhone, sms.template, params)
  } catch (error) {
    const delay = RETRY_MS[attempts - 1]
    await database.update(smsReminders).set({
      status: delay === undefined ? SmsReminderStatus.FAILED : SmsReminderStatus.PENDING,
      nextAttemptAt: delay === undefined ? null : new Date(Date.now() + delay),
    }).where(claim)
    console.error(`Booking SMS ${sms.id} attempt ${attempts} failed`, error)
    return
  }

  await database.update(smsReminders).set({
    status: SmsReminderStatus.SENT,
    sentAt: new Date(),
    nextAttemptAt: null,
    providerMessageId,
  }).where(claim)
}

export function startSmsWorker() {
  let closing = false
  const run = async () => {
    console.log('Booking SMS worker started')
    while (!closing) {
      try {
        const message = await findDueMessage(new Date())
        if (message && !closing) {
          await processSmsJob(message)
          continue
        }
      } catch (error) {
        console.error('Booking SMS worker error', error)
      }
      if (!closing) await sleep(POLL_MS)
    }
  }

  const running = run()
  return {
    async close() {
      closing = true
      await running
    },
  }
}
