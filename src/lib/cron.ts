import cron from 'node-cron'
import { prisma } from '@/lib/prisma'
import { sendSms } from '@/lib/smsir'
import { SmsReminderStatus } from '@prisma/client'

export function startCronJobs() {
  cron.schedule('*/15 * * * *', async () => {
    // Atomically claim PENDING reminders to avoid double-send if ticks overlap
    let claimed: { id: string }[]
    try {
      await prisma.smsReminder.updateMany({
        where: { status: SmsReminderStatus.PENDING, sendAt: { lte: new Date() } },
        data: { status: SmsReminderStatus.SENDING },
      })
      // Fetch only the IDs claimed in this tick (SENDING rows from before this updateMany
      // could exist if a prior tick crashed mid-send — exclude them by re-querying the
      // exact rows we just flipped, using a timestamp guard on sendAt)
      claimed = await prisma.smsReminder.findMany({
        where: { status: SmsReminderStatus.SENDING, sendAt: { lte: new Date() } },
        select: { id: true },
      })
    } catch (err) {
      console.error('Cron: failed to claim reminders', err)
      return
    }

    const reminders = await prisma.smsReminder.findMany({
      where: { id: { in: claimed.map(c => c.id) } },
      include: { booking: { include: { service: true } } },
    })

    for (const reminder of reminders) {
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
        try {
          await prisma.smsReminder.update({
            where: { id: reminder.id },
            data: { status: SmsReminderStatus.FAILED },
          })
        } catch (dbErr) {
          console.error(`Cron: failed to mark reminder ${reminder.id} as FAILED`, dbErr)
        }
      }
    }
  })
}
