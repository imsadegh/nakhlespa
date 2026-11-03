import { readFileSync } from 'node:fs'
import { expect, test } from 'bun:test'
import { getTableColumns } from 'drizzle-orm'
import { bookings } from '../src/db/schema'

test('booking payment fields use Zibal column names', () => {
  const columns = getTableColumns(bookings)
  expect(Object.keys(columns)).toContain('zibalTrackId')
  expect(Object.keys(columns)).toContain('zibalRefId')
  expect(Object.values(columns).map(column => column.name)).not.toContain('zarinpalAuthority')
  expect(Object.values(columns).map(column => column.name)).not.toContain('zarinpalRefId')
})

test('payment migration renames columns without dropping historical values', () => {
  const journal = JSON.parse(readFileSync('drizzle/meta/_journal.json', 'utf8'))
  const migration = journal.entries.find((entry: { tag: string }) => entry.tag === '0006_zibal-payment-columns')
  expect(migration).toBeDefined()
  const sql = readFileSync(`drizzle/${migration.tag}.sql`, 'utf8')
  expect(sql).toContain('RENAME COLUMN "zarinpalAuthority" TO "zibalTrackId"')
  expect(sql).toContain('RENAME COLUMN "zarinpalRefId" TO "zibalRefId"')
  expect(sql).not.toMatch(/\b(DROP|DELETE|TRUNCATE)\b/i)
})
