import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'bun:test'

const baselineMigration = existsSync('drizzle')
  ? readdirSync('drizzle', { withFileTypes: true })
      .find(entry => entry.isFile() && entry.name.endsWith('_baseline.sql'))
      ?.name
  : undefined

const customizationMigration = '0001_charming_wallow.sql'

const removeSqlCommentsAndWhitespace = (sql: string) =>
  sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--[^\r\n]*/g, '')
    .replace(/\s+/g, '')
    .trim()

describe('Drizzle migration baseline', () => {
  test('bootstraps the existing application schema idempotently', () => {
    expect(baselineMigration).toBeDefined()

    const sql = readFileSync(join('drizzle', baselineMigration!), 'utf8')
    const executableSql = removeSqlCommentsAndWhitespace(sql)

    expect(executableSql).toContain('CREATETYPE"public"."Gender"')
    expect(executableSql).toContain('CREATETABLEIFNOTEXISTS"bookings"')
    expect(executableSql).toContain('CREATETABLEIFNOTEXISTS"working_hours"')
    expect(executableSql).toContain('CREATEINDEXIFNOTEXISTS"bookings_date_idx"')
    expect(executableSql).not.toContain('"customization"jsonb')
  })

  test('points Drizzle Kit at the existing schema and migration directory', () => {
    const config = readFileSync('drizzle.config.ts', 'utf8')

    expect(config).toContain("schema: './src/db/schema.ts'")
    expect(config).toContain("out: './drizzle'")
  })

  test('provides the Task 2 package scripts', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))

    expect(packageJson.scripts).toMatchObject({
      'db:generate': 'drizzle-kit generate',
      'db:migrate': 'drizzle-kit migrate',
      'db:seed': 'bun src/db/seed.ts',
    })
  })

  test('adds nullable JSONB customization persistence to public.bookings', () => {
    expect(existsSync(join('drizzle', customizationMigration))).toBe(true)

    const sql = readFileSync(join('drizzle', customizationMigration!), 'utf8')
    const executableSql = removeSqlCommentsAndWhitespace(sql)
    expect(executableSql).toBe('ALTERTABLE"bookings"ADDCOLUMN"customization"jsonb;')

    const customizationSnapshot = '0001_snapshot.json'
    expect(existsSync(join('drizzle/meta', customizationSnapshot))).toBe(true)

    const snapshot = JSON.parse(readFileSync(join('drizzle/meta', customizationSnapshot), 'utf8')) as {
      tables: Record<string, { columns: Record<string, { type: string; notNull: boolean }> }>
    }
    expect(snapshot.tables['public.bookings'].columns.customization).toMatchObject({
      name: 'customization',
      type: 'jsonb',
      primaryKey: false,
      notNull: false,
    })
  })
})

describe('Task 3 auth and seed migration', () => {
  const legacyOrm = ['@', 'prisma'].join('')
  const legacyClient = ['Prisma', 'Client'].join('')
  const legacyAdapter = ['prisma', 'Adapter'].join('')
  test('initializes the shared node-postgres client with the complete schema', () => {
    const db = readFileSync('src/lib/db.ts', 'utf8')

    expect(db).toContain("import * as schema from '../db/schema'")
    expect(db).toContain('drizzle(pool, { schema })')
  })

  test('restores the original seed booking token values and upsert target', () => {
    const seed = readFileSync('src/db/seed.ts', 'utf8')

    expect(seed).toContain('const token = `seed-token-${booking.customerPhone}`')
    expect(seed).toContain('target: bookings.token')
    expect(seed).not.toContain("createHash('sha1')")
  })

  test('removes the obsolete Prisma seed configuration', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))

    expect(packageJson.prisma).toBeUndefined()
  })

  test('configures Better Auth with the shared Drizzle PostgreSQL adapter', () => {
    const auth = readFileSync('src/lib/auth.ts', 'utf8')

    expect(auth).toContain("from 'better-auth/adapters/drizzle'")
    expect(auth).toContain("from '@/lib/db'")
    expect(auth).toContain("drizzleAdapter(db, { provider: 'pg' })")
    expect(auth).not.toContain(legacyOrm)
    expect(auth).not.toContain(legacyAdapter)
    expect(auth).not.toContain(legacyClient)
    expect(auth).not.toContain('prisma.')
  })

  test('moves the complete seed entrypoint to Drizzle', () => {
    const seed = readFileSync('src/db/seed.ts', 'utf8')

    expect(existsSync('src/db/seed.ts')).toBe(true)
    expect(existsSync('prisma/seed.ts')).toBe(false)
    expect(seed).toContain('db.transaction')
    expect(seed).toContain('onConflictDoUpdate')
    expect(seed).toContain('auth.api.signUpEmail')
    expect(seed).not.toContain(legacyOrm)
    expect(seed).not.toContain(legacyAdapter)
    expect(seed).not.toContain(legacyClient)
    expect(seed).not.toContain('prisma.')
  })
})

describe('legacy PostgreSQL text fidelity', () => {
  type DrizzleSnapshot = {
    prevId: string
    tables: Record<string, {
      columns: Record<string, { type: string; default?: boolean | string }>
      indexes: Record<string, unknown>
      foreignKeys: Record<string, { onDelete?: string; onUpdate?: string }>
    }>
    enums: Record<string, { values: string[] }>
  }

  const snapshot = JSON.parse(readFileSync('drizzle/meta/0000_snapshot.json', 'utf8')) as DrizzleSnapshot

  const expectedTextColumns = {
    services: ['id', 'nameFa', 'descriptionFa', 'color', 'symbol'],
    addons: ['id', 'nameFa'],
    working_hours: ['id', 'openTime', 'closeTime'],
    blocked_slots: ['id', 'startTime', 'endTime', 'reason'],
    bookings: [
      'id', 'token', 'serviceId', 'customerName', 'customerPhone', 'customerNotes',
      'startTime', 'endTime', 'zarinpalAuthority', 'zarinpalRefId', 'groupToken', 'discountCodeId',
    ],
    booking_addons: ['id', 'bookingId', 'addonId'],
    sms_reminders: ['id', 'bookingId'],
    user: ['id', 'name', 'email', 'image'],
    session: ['id', 'token', 'ipAddress', 'userAgent', 'userId'],
    account: ['id', 'accountId', 'providerId', 'userId', 'accessToken', 'refreshToken', 'idToken', 'scope', 'password'],
    verification: ['id', 'identifier', 'value'],
    customer_sessions: ['id', 'phone', 'sessionToken'],
    discount_codes: ['id', 'code'],
  } as const

  test('keeps every Prisma TEXT column text-compatible in the Drizzle schema', () => {
    const schema = readFileSync('src/db/schema.ts', 'utf8')
    const schemaTextColumns = {
      services: ['id', 'nameFa', 'descriptionFa', 'color', 'symbol'],
      addons: ['id', 'nameFa'],
      workingHours: ['id', 'openTime', 'closeTime'],
      blockedSlots: ['id', 'startTime', 'endTime', 'reason'],
      bookings: [
        'id', 'token', 'serviceId', 'customerName', 'customerPhone', 'customerNotes',
        'startTime', 'endTime', 'zarinpalAuthority', 'zarinpalRefId', 'groupToken', 'discountCodeId',
      ],
      bookingAddons: ['id', 'bookingId', 'addonId'],
      smsReminders: ['id', 'bookingId'],
      user: ['id', 'name', 'email', 'image'],
      session: ['id', 'token', 'ipAddress', 'userAgent', 'userId'],
      account: ['id', 'accountId', 'providerId', 'userId', 'accessToken', 'refreshToken', 'idToken', 'scope', 'password'],
      verification: ['id', 'identifier', 'value'],
      customerSessions: ['id', 'phone', 'sessionToken'],
      discountCodes: ['id', 'code'],
    } as const

    for (const [table, columns] of Object.entries(schemaTextColumns)) {
      const tableBlock = schema.match(new RegExp(`export const ${table} = pgTable[\\s\\S]*?(?=\\nexport const |\\nexport type |$)`))?.[0]
      expect(tableBlock, `${table} declaration`).toBeDefined()
      for (const column of columns) {
        expect(tableBlock, `${table}.${column}`).toMatch(new RegExp(`\\b${column}: text\\(['"]${column}['"]`))
      }
    }
  })

  test('records every legacy TEXT column as text in the baseline snapshot', () => {
    for (const [table, columns] of Object.entries(expectedTextColumns)) {
      const tableSnapshot = snapshot.tables[`public.${table}`]
      expect(tableSnapshot, `${table} snapshot`).toBeDefined()
      for (const column of columns) {
        expect(tableSnapshot.columns[column]?.type, `${table}.${column}`).toBe('text')
      }
    }
  })

  test('preserves timestamp precision, defaults, enums, indexes, and foreign-key actions', () => {
    const tables = snapshot.tables
    for (const table of Object.values(tables)) {
      for (const column of Object.values(table.columns)) {
        if (column.type.startsWith('timestamp')) expect(column.type).toBe('timestamp (3)')
      }
    }

    expect(tables['public.services'].columns.createdAt.default).toBe('now()')
    expect(tables['public.services'].columns.isActive.default).toBe(true)
    expect(tables['public.bookings'].columns.status.default).toBe("'PENDING_PAYMENT'")
    expect(tables['public.customer_sessions'].columns.createdAt.default).toBe('now()')
    expect(tables['public.bookings'].indexes).toHaveProperty('bookings_date_idx')
    expect(tables['public.bookings'].indexes).toHaveProperty('bookings_groupToken_idx')
    expect(tables['public.sms_reminders'].indexes).toHaveProperty('sms_reminders_status_sendAt_idx')
    expect(tables['public.bookings'].foreignKeys.bookings_serviceId_services_id_fk).toMatchObject({
      onDelete: 'restrict',
      onUpdate: 'cascade',
    })
    expect(tables['public.bookings'].foreignKeys.bookings_discountCodeId_discount_codes_id_fk).toMatchObject({
      onDelete: 'set null',
      onUpdate: 'cascade',
    })
    expect(snapshot.enums['public.Gender'].values).toEqual(['FEMALE', 'MALE'])
    expect(snapshot.enums['public.BookingStatus'].values).toEqual([
      'PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'CANCELLED',
    ])
    expect(snapshot.enums['public.SmsReminderStatus'].values).toEqual(['PENDING', 'SENDING', 'SENT', 'FAILED'])
    expect(snapshot.enums['public.DiscountType'].values).toEqual(['PERCENT', 'FIXED'])
  })

  test('keeps the existing baseline migration intact for follow-up migrations', () => {
    expect(readdirSync('drizzle').filter(name => name.endsWith('.sql'))).toContain('0000_baseline.sql')
    expect(snapshot.prevId).toBe('00000000-0000-0000-0000-000000000000')
    expect(snapshot.tables).toBeDefined()
    expect(snapshot.enums).toBeDefined()
  })
})

describe('Task 4 booking workflow migration', () => {
  const legacyOrm = ['@', 'prisma'].join('')
  const task4Files = [
    'src/lib/queue.ts',
    'src/lib/slots.ts',
    'src/lib/discounts.ts',
    'src/app/api/bookings/create/route.ts',
    'src/app/api/bookings/verify/route.ts',
    'src/app/api/slots/route.ts',
    'src/app/api/services/route.ts',
    'src/app/api/working-hours/route.ts',
    'src/app/api/discounts/validate/route.ts',
    'src/app/api/discounts/loyalty/route.ts',
  ]
  const directDatabaseFiles = task4Files.filter(file => !file.includes('/discounts/'))

  test('uses the shared Drizzle database in every converted workflow', () => {
    for (const file of task4Files) {
      const source = readFileSync(file, 'utf8')
      expect(source).not.toContain(legacyOrm)
      expect(source).not.toContain('prisma.')
    }
    for (const file of directDatabaseFiles) expect(readFileSync(file, 'utf8')).toContain("from '@/lib/db'")
  })
})

describe('Task 5 admin, customer, and public migration', () => {
  const legacyOrm = ['@', 'prisma'].join('')
  const task5Files = [
    'src/types/index.ts',
    'src/components/customer/BookingHistoryList.tsx',
    'src/components/admin/BookingActions.tsx',
    'src/app/admin/(panel)/discounts/page.tsx',
    'src/app/admin/(panel)/bookings/[id]/page.tsx',
    'src/app/admin/(panel)/bookings/columns.tsx',
    'src/app/my/bookings/page.tsx',
    'src/app/my/bookings/[token]/page.tsx',
    'src/app/book/page.tsx',
    'src/app/api/admin/discounts/route.ts',
    'src/app/api/admin/discounts/[id]/route.ts',
    'src/app/api/admin/bookings/route.ts',
    'src/app/api/admin/bookings/[id]/route.ts',
    'src/app/api/admin/schedule/route.ts',
    'src/app/api/admin/schedule/block/route.ts',
    'src/app/api/admin/schedule/block/[id]/route.ts',
    'src/app/api/admin/schedule/hours/route.ts',
  ]

  test('removes Prisma imports from every Task 5 file', () => {
    for (const file of task5Files) {
      const source = readFileSync(file, 'utf8')
      expect(source).not.toContain(legacyOrm)
      expect(source).not.toContain('prisma.')
    }
  })

  test('uses shared Drizzle enum values for UI-facing status and gender types', () => {
    expect(readFileSync('src/types/index.ts', 'utf8')).toContain("from '@/db/schema'")
    for (const file of [
      'src/components/customer/BookingHistoryList.tsx',
      'src/components/admin/BookingActions.tsx',
      'src/app/admin/(panel)/bookings/[id]/page.tsx',
      'src/app/admin/(panel)/bookings/columns.tsx',
      'src/app/my/bookings/page.tsx',
      'src/app/my/bookings/[token]/page.tsx',
      'src/app/api/admin/bookings/route.ts',
      'src/app/api/admin/bookings/[id]/route.ts',
    ]) {
      expect(readFileSync(file, 'utf8')).toContain("from '@/db/schema'")
    }
  })

  test('uses the shared Drizzle database in every converted page and admin route', () => {
    for (const file of task5Files.filter(file => !file.includes('types/index') && !file.includes('/components/') && !file.endsWith('bookings/columns.tsx'))) {
      expect(readFileSync(file, 'utf8')).toContain("from '@/lib/db'")
    }
  })

  test('keeps admin schedule blocks newest first while preserving working-hours ordering', () => {
    const source = readFileSync('src/app/api/admin/schedule/route.ts', 'utf8')

    expect(source).toContain("import { asc, desc } from 'drizzle-orm'")
    expect(source).toContain('asc(workingHours.gender), asc(workingHours.dayOfWeek)')
    expect(source).toContain('desc(blockedSlots.date)')
  })

  test('routes zero-row block deletes through the existing error response path', () => {
    const source = readFileSync('src/app/api/admin/schedule/block/[id]/route.ts', 'utf8')

    expect(source).toContain('const result = await db.delete(blockedSlots).where(eq(blockedSlots.id, id))')
    expect(source).toContain('if (result.rowCount === 0) throw new Error')
    expect(source).toContain("return NextResponse.json({ error: 'Internal error' }, { status: 500 })")
  })
})
