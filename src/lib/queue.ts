import { Queue, Worker, type Job } from 'bullmq'
import { prisma } from '@/lib/prisma'
import { sendReminderSms } from '@/lib/smsir'
import { SmsReminderStatus } from '@prisma/client'

const connectionOpts = { url: process.env.REDIS_URL!, maxRetriesPerRequest: null as null }

export const smsQueue = new Queue('sms-reminders', { connection: connectionOpts })

export interface SmsJobData {
  reminderId: string
  phone: string
  template: 'reminder24h' | 'reminder2h'
  params: { name: string; service: string; time: string }
}

export function startSmsWorker() {
  const worker = new Worker<SmsJobData>(
    'sms-reminders',
    async (job: Job<SmsJobData>) => {
      const { reminderId, phone, template, params } = job.data

      await prisma.smsReminder.update({
        where: { id: reminderId },
        data: { status: SmsReminderStatus.SENDING },
      })

      try {
        await sendReminderSms(phone, template, params)
        await prisma.smsReminder.update({
          where: { id: reminderId },
          data: { status: SmsReminderStatus.SENT, sentAt: new Date() },
        })
      } catch (err) {
        await prisma.smsReminder.update({
          where: { id: reminderId },
          data: { status: SmsReminderStatus.FAILED },
        })
        throw err
      }
    },
    { connection: connectionOpts }
  )

  worker.on('failed', (job: Job<SmsJobData> | undefined, err: Error) => {
    console.error(`SMS job ${job?.id} failed:`, err)
  })

  return worker
}
