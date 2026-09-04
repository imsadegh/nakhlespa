import { Queue, Worker, type Job } from 'bullmq'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { smsReminders, SmsReminderStatus, type SmsReminderStatusValue } from '@/db/schema'
import { sendReminderSms } from '@/lib/smsir'

const connectionOpts = { url: process.env.REDIS_URL!, maxRetriesPerRequest: null as null }

export const smsQueue = new Queue('sms-reminders', { connection: connectionOpts })

export interface SmsJobData {
  reminderId: string
  phone: string
  template: 'reminder24h' | 'reminder2h'
  params: { name: string; service: string; time: string }
}

type UpdateReminder = (status: SmsReminderStatusValue, sentAt?: Date) => Promise<boolean>

interface SmsJobDependencies {
  updateReminder?: UpdateReminder
  sendSms?: typeof sendReminderSms
}

async function updateReminderStatus(reminderId: string, status: SmsReminderStatusValue, sentAt?: Date) {
  const updated = await db
    .update(smsReminders)
    .set(sentAt ? { status, sentAt } : { status })
    .where(eq(smsReminders.id, reminderId))
    .returning({ id: smsReminders.id })

  return updated.length > 0
}

export async function processSmsJob(data: SmsJobData, dependencies: SmsJobDependencies = {}) {
  const updateReminder = dependencies.updateReminder ?? ((status, sentAt) => updateReminderStatus(data.reminderId, status, sentAt))
  const sendSms = dependencies.sendSms ?? sendReminderSms

  const claimed = await updateReminder(SmsReminderStatus.SENDING)
  if (!claimed) throw new Error('SMS reminder was not found')

  try {
    await sendSms(data.phone, data.template, data.params)

    const markedSent = await updateReminder(SmsReminderStatus.SENT, new Date())
    if (!markedSent) throw new Error('SMS reminder was not found')
  } catch (err) {
    await updateReminder(SmsReminderStatus.FAILED)
    throw err
  }
}

export function startSmsWorker() {
  const worker = new Worker<SmsJobData>(
    'sms-reminders',
    async (job: Job<SmsJobData>) => {
      await processSmsJob(job.data)
    },
    { connection: connectionOpts }
  )

  worker.on('failed', (job: Job<SmsJobData> | undefined, err: Error) => {
    console.error(`SMS job ${job?.id} failed:`, err)
  })

  return worker
}
