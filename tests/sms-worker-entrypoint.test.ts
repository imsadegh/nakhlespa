import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'bun:test'

describe('production SMS worker boundary', () => {
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
