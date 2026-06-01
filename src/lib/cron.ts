import cron from 'node-cron'
import { prisma } from '@/lib/prisma'
import { sendSms } from '@/lib/smsir'
import { SmsReminderStatus } from '@prisma/client'

export function startCronJobs() {
  cron.schedule('*/15 * * * *', async () => {
    let due
    try {
      due = await prisma.smsReminder.findMany({
        where: { status: SmsReminderStatus.PENDING, sendAt: { lte: new Date() } },
        include: { booking: { include: { service: true } } },
      })
    } catch (err) {
      console.error('Cron: failed to fetch reminders', err)
      return
    }

    for (const reminder of due) {
      try {
        const { booking } = reminder
        await sendSms(
          booking.customerPhone,
          `${booking.customerName} عزیز، یادآوری: نوبت ${booking.service.nameFa} شما فردا ساعت ${booking.startTime} است — نخلسپا`
        )
        await prisma.smsReminder.update({
          where: { id: reminder.id },
          data: { status: SmsReminderStatus.SENT, sentAt: new Date() },
        })
      } catch (err) {
        console.error(`Cron: failed to send reminder ${reminder.id}`, err)
        await prisma.smsReminder.update({
          where: { id: reminder.id },
          data: { status: SmsReminderStatus.FAILED },
        })
      }
    }
  })
}
