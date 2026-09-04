import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'bun:test'
import { processSmsJob, type SmsJobData } from '@/lib/queue'

const jobData: SmsJobData = {
  reminderId: 'missing-reminder',
  phone: '09123456789',
  template: 'reminder24h',
  params: { name: 'Test', service: 'Massage', time: '10:00' },
}

describe('production SMS worker boundary', () => {
  test('does not send SMS when the reminder claim updates no rows', async () => {
    const updates: string[] = []
    let sent = false

    await expect(
      processSmsJob(jobData, {
        updateReminder: async status => {
          updates.push(status)
          return false
        },
        sendSms: async () => {
          sent = true
        },
      }),
    ).rejects.toThrow('SMS reminder was not found')

    expect(sent).toBe(false)
    expect(updates).toEqual(['SENDING'])
  })

  test('sends SMS and marks the claimed reminder sent', async () => {
    const updates: Array<{ status: string; sentAt?: Date }> = []

    await processSmsJob(jobData, {
      updateReminder: async (status, sentAt) => {
        updates.push({ status, sentAt })
        return true
      },
      sendSms: async () => {},
    })

    expect(updates.map(update => update.status)).toEqual(['SENDING', 'SENT'])
    expect(updates[1]?.sentAt).toBeInstanceOf(Date)
  })

  test('does not start BullMQ from Next instrumentation', () => {
    const source = readFileSync('src/instrumentation.ts', 'utf8')
    expect(source).not.toContain('startSmsWorker()')
  })

  test('standalone worker owns startup and shutdown', () => {
    const source = readFileSync('src/workers/sms.worker.ts', 'utf8')
    expect(source).toContain("import { startSmsWorker } from '@/lib/queue'")
    expect(source).toContain('startSmsWorker()')
    expect(source).toContain("process.on('SIGTERM'")
    expect(source).toContain("process.on('SIGINT'")
  })
})
