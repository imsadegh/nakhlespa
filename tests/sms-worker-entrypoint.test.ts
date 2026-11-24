import { readFileSync } from 'node:fs'
import { afterEach, expect, mock, test } from 'bun:test'
import { BookingStatus, SmsReminderStatus } from '@/db/schema'
import { processSmsJob } from '@/lib/queue'

const writes: Record<string, unknown>[] = []
let claimSucceeds = true
type Dependencies = NonNullable<Parameters<typeof processSmsJob>[1]>
const database = {
  update: () => ({ set: (values: Record<string, unknown>) => {
    writes.push(values)
    return { where: () => ({ returning: async () => claimSucceeds ? [{ id: 'sms' }] : [] }) }
  } }),
} as unknown as Dependencies['database']
const sendConfirm = mock(async () => 'provider-456')
const sendReminder = mock(async () => 'provider-123')
const dependencies = { database, sendConfirm, sendReminder }

const due = {
  sms: { id: 'sms', template: 'reminder2h', attempts: 0, status: SmsReminderStatus.PENDING, nextAttemptAt: new Date(0) },
  booking: { status: BookingStatus.PAID, date: new Date('2090-01-01'), startTime: '10:00' },
  serviceName: 'Massage',
} as Parameters<typeof processSmsJob>[0]

afterEach(() => {
  writes.length = 0
  claimSucceeds = true
  sendConfirm.mockClear()
  sendReminder.mockClear()
})

test('skips a reminder after its Tehran appointment', async () => {
  await processSmsJob({ ...due, booking: { ...due.booking, date: new Date('2020-01-01') } }, dependencies)
  expect(sendReminder).not.toHaveBeenCalled()
  expect(writes[1]).toEqual({ status: SmsReminderStatus.SKIPPED, nextAttemptAt: null })
})

test('does not send when another worker has claimed the same message', async () => {
  claimSucceeds = false
  await processSmsJob(due, dependencies)
  expect(sendReminder).not.toHaveBeenCalled()
  expect(writes).toHaveLength(1)
})

test('retries a failed confirmation and saves its provider message ID on success', async () => {
  const confirmation = { ...due, sms: { ...due.sms, template: 'confirm' as const } }
  sendConfirm.mockRejectedValueOnce(new Error('provider unavailable'))
  await processSmsJob(confirmation, dependencies)
  expect(writes[1]).toMatchObject({ status: SmsReminderStatus.PENDING, nextAttemptAt: expect.any(Date) })
  await processSmsJob({ ...confirmation, sms: { ...confirmation.sms, attempts: 1 } }, dependencies)
  expect(writes[3]).toMatchObject({
    status: SmsReminderStatus.SENT, providerMessageId: 'provider-456', sentAt: expect.any(Date),
  })
})

test('standalone worker owns startup and shutdown', () => {
  const instrumentation = readFileSync('src/instrumentation.ts', 'utf8')
  const source = readFileSync('src/workers/sms.worker.ts', 'utf8')
  expect(instrumentation).not.toContain('startSmsWorker()')
  expect(source).toContain('startSmsWorker()')
  expect(source).toContain("process.on('SIGTERM'")
  expect(source).toContain("process.on('SIGINT'")
})
