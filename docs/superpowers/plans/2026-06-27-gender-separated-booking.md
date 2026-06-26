# Gender-Separated Booking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add gender-based session separation to the spa booking system — female customers book morning slots (08:00–14:30), male customers book afternoon/evening slots (15:00–22:00), enforced server-side with gender stored on every booking and visible in the admin dashboard.

**Architecture:** A new `Gender` enum (`FEMALE | MALE`) is added to the Prisma schema. `WorkingHours` gains a `gender` column and its unique constraint changes from `[dayOfWeek]` to `[dayOfWeek, gender]` (14 rows total). `Booking` gains a `gender` column. The booking wizard gets a new Step 0 gender-selection screen inserted before Step 1. All slot APIs receive a `gender` param and filter to the correct time window. The admin bookings table and detail dialog display gender badges. The schedule manager splits into two tabs.

**Tech Stack:** Next.js 16 App Router, Prisma v7 with `@prisma/adapter-pg`, React, Tailwind v4, TypeScript, BullMQ/Redis, Better Auth.

## Global Constraints

- All UI text must be Persian (Farsi) — use `font-vazir`, never `font-mono` on Persian content
- Always use CSS vars (`var(--text-primary)`, `var(--text-muted)`, `var(--text-faint)`, `var(--border-base)`, `var(--bg-surface)`, `var(--glass-bg)`) — never hardcode colors like `text-[#F3EFE8]`
- Prisma `datasource` block has **no `url` field** — `PrismaClient` must receive `{ adapter }` everywhere
- Migrations use `bunx prisma migrate dev --name <name>` (reads `.env`, not `.env.local`)
- Seed uses `bun prisma/seed.ts`
- Path alias `@/` maps to `src/`
- `WorkingHours` unique constraint MUST be `[dayOfWeek, gender]` after migration — not `[dayOfWeek]`
- Gender female label: `خانم` | Male label: `آقا`
- Female badge style: `bg-pink-400/10 text-pink-400` | Male badge style: `bg-blue-400/10 text-blue-400`

---

## File Map

| File | Action | What changes |
|------|--------|--------------|
| `prisma/schema.prisma` | Modify | Add `Gender` enum; add `gender` to `WorkingHours` + `Booking`; change unique constraint |
| `prisma/seed.ts` | Modify | Upsert 14 working-hours rows (7 days × 2 genders); backfill booking gender |
| `src/types/index.ts` | Modify | Add `gender` to `WizardState`, `BookingCreateInput`, `BookingRow` |
| `src/lib/slots.ts` | Modify | Add `gender` param to both functions; query `WorkingHours` by `{ dayOfWeek, gender }` |
| `src/app/api/slots/route.ts` | Modify | Read `gender` from query params; pass to slot functions; require it |
| `src/app/api/working-hours/route.ts` | Modify | Return `gender` field so Step 0 can show representative hours |
| `src/app/api/bookings/create/route.ts` | Modify | Accept `gender` on each booking; validate startTime vs gender window; persist `gender` |
| `src/components/booking/StepGender.tsx` | Create | New Step 0 — two gender-selection cards showing session hours |
| `src/components/booking/BookingWizard.tsx` | Modify | Add step 0; total steps = 5; pass `gender` through all steps |
| `src/components/booking/StepProgress.tsx` | Modify | Update total from 4 to 5 |
| `src/components/booking/Step2DateTime.tsx` | Modify | Pass `gender` param to slots fetch; pass `gender` param to working-hours fetch |
| `src/components/booking/Step4Review.tsx` | Modify | Show gender badge in review summary; include `gender` in POST body |
| `src/app/api/admin/bookings/route.ts` | Modify | Include `gender` in returned booking rows |
| `src/app/admin/(panel)/bookings/columns.tsx` | Modify | Add gender badge to customer name cell; add `gender` to `BookingRow` type |
| `src/app/admin/(panel)/bookings/BookingDetailDialog.tsx` | Modify | Add gender field to detail fields list |
| `src/app/api/admin/schedule/hours/route.ts` | Modify | Accept `gender` on each row; upsert by `{ dayOfWeek, gender }` |
| `src/app/api/admin/schedule/route.ts` | Modify | Return `gender` field on each hour row |
| `src/app/admin/(panel)/schedule/page.tsx` | Modify | Pass hours with gender to `ScheduleManager` |
| `src/components/admin/ScheduleManager.tsx` | Modify | Split hours table into two tabs (خانم / آقا) |

---

## Task 1: Schema Migration — Add Gender Enum and Columns

**Files:**
- Modify: `prisma/schema.prisma`
- Run: migration

**Interfaces:**
- Produces: `Gender` enum (`FEMALE | MALE`); `WorkingHours.gender: Gender`; `Booking.gender: Gender`; unique constraint `[dayOfWeek, gender]` on `WorkingHours`

- [ ] **Step 1: Update `prisma/schema.prisma`**

Replace the entire file content — add the `Gender` enum, update `WorkingHours`, update `Booking`:

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

enum Gender {
  FEMALE
  MALE
}

model Service {
  id              String    @id @default(uuid())
  nameFa          String
  descriptionFa   String?
  durationMinutes Int
  price           Int
  color           String?
  symbol          String?
  tier            Int?
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  bookings        Booking[]

  @@unique([nameFa])
  @@map("services")
}

model Addon {
  id           String         @id @default(uuid())
  nameFa       String
  price        Int
  isActive     Boolean        @default(true)
  requiresTier Boolean        @default(false)
  createdAt    DateTime       @default(now())
  bookingAddons BookingAddon[]

  @@unique([nameFa])
  @@map("addons")
}

model BookingAddon {
  id        String  @id @default(uuid())
  booking   Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  bookingId String
  addon     Addon   @relation(fields: [addonId], references: [id])
  addonId   String
  pricePaid Int

  @@index([bookingId])
  @@index([addonId])
  @@map("booking_addons")
}

model WorkingHours {
  id          String   @id @default(uuid())
  dayOfWeek   Int
  gender      Gender
  openTime    String
  closeTime   String
  isOpen      Boolean  @default(true)
  createdAt   DateTime @default(now())

  @@unique([dayOfWeek, gender])
  @@map("working_hours")
}

model BlockedSlot {
  id        String   @id @default(uuid())
  date      DateTime @db.Date
  startTime String
  endTime   String
  reason    String?
  createdAt DateTime @default(now())

  @@map("blocked_slots")
}

model Booking {
  id                 String        @id @default(uuid())
  token              String        @unique @default(uuid())
  service            Service       @relation(fields: [serviceId], references: [id])
  serviceId          String
  customerName       String
  customerPhone      String
  customerNotes      String?
  date               DateTime      @db.Date
  startTime          String
  endTime            String
  gender             Gender
  status             BookingStatus @default(PENDING_PAYMENT)
  zarinpalAuthority  String?
  zarinpalRefId      String?
  addonsPricePaid    Int           @default(0)
  groupToken         String?
  createdAt          DateTime      @default(now())
  addons             BookingAddon[]
  smsReminders       SmsReminder[]

  @@index([date])
  @@index([status])
  @@index([serviceId])
  @@index([groupToken])
  @@map("bookings")
}

enum BookingStatus {
  PENDING_PAYMENT
  PAID
  CONFIRMED
  CANCELLED
}

model SmsReminder {
  id        String            @id @default(uuid())
  booking   Booking           @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  bookingId String
  sendAt    DateTime
  status    SmsReminderStatus @default(PENDING)
  sentAt    DateTime?
  createdAt DateTime          @default(now())

  @@index([status, sendAt])
  @@map("sms_reminders")
}

enum SmsReminderStatus {
  PENDING
  SENDING
  SENT
  FAILED
}

model User {
  id            String    @id
  name          String
  email         String    @unique
  emailVerified Boolean
  image         String?
  createdAt     DateTime
  updatedAt     DateTime
  sessions      Session[]
  accounts      Account[]

  @@map("user")
}

model Session {
  id        String   @id
  expiresAt DateTime
  token     String   @unique
  createdAt DateTime
  updatedAt DateTime
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("session")
}

model Account {
  id                    String    @id
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime
  updatedAt             DateTime

  @@map("account")
}

model Verification {
  id         String    @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime?
  updatedAt  DateTime?

  @@map("verification")
}
```

- [ ] **Step 2: Run migration**

```bash
bunx prisma migrate dev --name add-gender-to-working-hours-and-bookings
```

Expected: migration created and applied, Prisma client regenerated. If the DB has existing `working_hours` rows without gender, Prisma will ask for a default — the migration SQL will need a default value. If prompted, provide `'MALE'` as the default for existing rows, then remove the default after backfill.

- [ ] **Step 3: Verify schema applied**

```bash
bunx prisma studio
```

Open in browser — confirm `WorkingHours` table has `gender` column and `Booking` table has `gender` column.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add Gender enum and gender columns to WorkingHours and Booking"
```

---

## Task 2: Seed — 14 WorkingHours Rows and Booking Backfill

**Files:**
- Modify: `prisma/seed.ts`

**Interfaces:**
- Consumes: `Gender` enum from `@prisma/client`
- Produces: 14 `WorkingHours` rows (`FEMALE`: 08:00–14:30, `MALE`: 15:00–22:00 for all 7 days); existing `Booking` rows backfilled to `MALE`

- [ ] **Step 1: Update `prisma/seed.ts` working-hours section**

Find the existing working hours loop (lines seeding `WorkingHours`) and replace it with:

```typescript
// Gender-separated working hours
// FEMALE: morning session 08:00–14:30 all days
// MALE:   afternoon/evening session 15:00–22:00 all days
const genderHours = [
  { gender: 'FEMALE' as const, openTime: '08:00', closeTime: '14:30' },
  { gender: 'MALE'   as const, openTime: '15:00', closeTime: '22:00' },
]

for (const { gender, openTime, closeTime } of genderHours) {
  for (let i = 0; i < 7; i++) {
    await prisma.workingHours.upsert({
      where: { dayOfWeek_gender: { dayOfWeek: i, gender } },
      update: { openTime, closeTime, isOpen: true },
      create: { dayOfWeek: i, gender, openTime, closeTime, isOpen: true },
    })
  }
}
```

Also add a backfill for existing bookings without gender (after the working hours block):

```typescript
// Backfill existing bookings — default MALE
await prisma.booking.updateMany({
  where: { gender: undefined as never },
  data: { gender: 'MALE' },
})
```

Note: `gender: undefined as never` is a workaround since after migration all existing rows have the default. You may simply skip this if the migration already set a column default. In that case, remove the backfill block.

- [ ] **Step 2: Run seed**

```bash
bun prisma/seed.ts
```

Expected: output shows services upserted, 14 working-hours rows upserted, no errors.

- [ ] **Step 3: Verify in Prisma Studio**

```bash
bunx prisma studio
```

Confirm `working_hours` table has 14 rows — 7 with `gender=FEMALE`, 7 with `gender=MALE`.

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: seed gender-separated working hours (14 rows)"
```

---

## Task 3: Types — Add Gender to WizardState and BookingCreateInput

**Files:**
- Modify: `src/types/index.ts`

**Interfaces:**
- Produces: `WizardState.gender?: 'FEMALE' | 'MALE'`; `BookingCreateInput.gender: 'FEMALE' | 'MALE'`; `BookingRow.gender: 'FEMALE' | 'MALE'` (used by admin table in Task 8)

- [ ] **Step 1: Update `src/types/index.ts`**

```typescript
import { BookingStatus } from '@prisma/client'

export type Gender = 'FEMALE' | 'MALE'

export type ServiceDTO = {
  id: string
  nameFa: string
  descriptionFa: string | null
  durationMinutes: number
  price: number
  color: string | null
  symbol: string | null
  tier: number | null
}

export type AddonDTO = {
  id: string
  nameFa: string
  price: number
  requiresTier: boolean
}

export type SlotDTO = {
  startTime: string      // "HH:mm"
  endTime: string        // "HH:mm"
  taken: boolean
  availableCount: number
}

// One person in a group booking
export type Person = {
  serviceId: string
  addonIds: string[]
  customerName: string
  customerPhone: string
  customerNotes: string
}

// Wizard UI state
export type WizardState = {
  gender?: Gender         // set in Step 0, applies to whole group
  persons: Person[]
  date?: string           // "YYYY-MM-DD"
  startTime?: string      // "HH:mm"
  endTime?: string        // "HH:mm"
}

export type MultiBookingCreateInput = {
  bookings: {
    serviceId: string
    customerName: string
    customerPhone: string
    customerNotes?: string
    date: string
    startTime: string
    addonIds?: string[]
    gender: Gender
  }[]
}

export type BookingCreateInput = {
  serviceId: string
  customerName: string
  customerPhone: string
  customerNotes?: string
  date: string            // "YYYY-MM-DD"
  startTime: string       // "HH:mm"
  addonIds?: string[]
  gender: Gender
}

export type BookingSummary = {
  id: string
  token: string
  customerName: string
  customerPhone: string
  date: string
  startTime: string
  endTime: string
  status: BookingStatus
  service: ServiceDTO
  createdAt: string
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add Gender type and gender fields to WizardState and BookingCreateInput"
```

---

## Task 4: Slots Library — Add Gender Param

**Files:**
- Modify: `src/lib/slots.ts`

**Interfaces:**
- Consumes: `Gender` from `@/types`
- Produces:
  - `getAvailableSlots(date: string, durationMinutes: number, count: number, gender: 'FEMALE' | 'MALE'): Promise<SlotDTO[]>`
  - `getSlotsForRooms(date: string, serviceIds: string[], gender: 'FEMALE' | 'MALE'): Promise<SlotDTO[]>`

- [ ] **Step 1: Update `src/lib/slots.ts`**

Replace the entire file:

```typescript
import { BookingStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import type { SlotDTO } from '@/types'

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) throw new Error(`Invalid time format: "${t}"`)
  return h * 60 + m
}

function minutesToTime(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

function parseDateUTC(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

async function getWorkingDay(jsDate: Date, gender: 'FEMALE' | 'MALE') {
  const jsDayMap: Record<number, number> = { 6: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 }
  const dayOfWeek = jsDayMap[jsDate.getUTCDay()]
  return prisma.workingHours.findFirst({ where: { dayOfWeek, gender, isOpen: true } })
}

async function getBlockedRanges(jsDate: Date) {
  const blocked = await prisma.blockedSlot.findMany({
    where: { date: jsDate },
    select: { startTime: true, endTime: true },
  })
  return blocked.map(b => ({ start: timeToMinutes(b.startTime), end: timeToMinutes(b.endTime) }))
}

export async function getAvailableSlots(
  date: string,
  durationMinutes: number,
  count = 1,
  gender: 'FEMALE' | 'MALE',
): Promise<SlotDTO[]> {
  const jsDate = parseDateUTC(date)
  const workingDay = await getWorkingDay(jsDate, gender)
  if (!workingDay) return []

  const open = timeToMinutes(workingDay.openTime)
  const close = timeToMinutes(workingDay.closeTime)

  const totalRooms = await prisma.service.count({ where: { isActive: true, tier: { not: null } } })

  const existingBookings = await prisma.booking.findMany({
    where: { date: jsDate, status: { not: BookingStatus.CANCELLED }, gender },
    select: { startTime: true, endTime: true },
  })

  const existingBookingRanges = existingBookings.map(b => ({
    start: timeToMinutes(b.startTime),
    end: timeToMinutes(b.endTime),
  }))

  const bookingsForSlot = (slotStart: number, slotEnd: number): number =>
    existingBookingRanges.filter(r => r.start < slotEnd && r.end > slotStart).length

  const blockedRanges = await getBlockedRanges(jsDate)

  const slots: SlotDTO[] = []
  let cursor = open
  while (cursor + durationMinutes <= close) {
    const slotEnd = cursor + durationMinutes
    const slotStartStr = minutesToTime(cursor)

    const isAdminBlocked = blockedRanges.some(r => cursor < r.end && slotEnd > r.start)
    if (isAdminBlocked) {
      slots.push({ startTime: slotStartStr, endTime: minutesToTime(slotEnd), taken: true, availableCount: 0 })
      cursor += 30
      continue
    }

    const booked = bookingsForSlot(cursor, slotEnd)
    const availableCount = Math.max(0, totalRooms - booked)
    slots.push({
      startTime: slotStartStr,
      endTime: minutesToTime(slotEnd),
      taken: availableCount < count,
      availableCount,
    })
    cursor += 30
  }
  return slots
}

export async function getSlotsForRooms(
  date: string,
  serviceIds: string[],
  gender: 'FEMALE' | 'MALE',
): Promise<SlotDTO[]> {
  if (serviceIds.length === 0) return []

  const jsDate = parseDateUTC(date)
  const workingDay = await getWorkingDay(jsDate, gender)
  if (!workingDay) return []

  const open = timeToMinutes(workingDay.openTime)
  const close = timeToMinutes(workingDay.closeTime)

  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds }, isActive: true },
    select: { id: true, durationMinutes: true },
  })
  if (services.length === 0) return []
  const durationMinutes = Math.max(...services.map(s => s.durationMinutes))

  const bookingsByRoom = await prisma.booking.findMany({
    where: {
      serviceId: { in: serviceIds },
      date: jsDate,
      status: { not: BookingStatus.CANCELLED },
    },
    select: { serviceId: true, startTime: true, endTime: true },
  })

  const roomRanges = new Map<string, { start: number; end: number }[]>()
  for (const id of serviceIds) roomRanges.set(id, [])
  for (const b of bookingsByRoom) {
    roomRanges.get(b.serviceId)!.push({
      start: timeToMinutes(b.startTime),
      end: timeToMinutes(b.endTime),
    })
  }

  const blockedRanges = await getBlockedRanges(jsDate)

  const totalRooms = await prisma.service.count({ where: { isActive: true, tier: { not: null } } })

  const allBookings = await prisma.booking.findMany({
    where: { date: jsDate, status: { not: BookingStatus.CANCELLED }, gender },
    select: { startTime: true, endTime: true },
  })
  const allRanges = allBookings.map(b => ({
    start: timeToMinutes(b.startTime),
    end: timeToMinutes(b.endTime),
  }))

  const slots: SlotDTO[] = []
  let cursor = open
  while (cursor + durationMinutes <= close) {
    const slotEnd = cursor + durationMinutes
    const slotStartStr = minutesToTime(cursor)

    const isAdminBlocked = blockedRanges.some(r => cursor < r.end && slotEnd > r.start)
    if (isAdminBlocked) {
      slots.push({ startTime: slotStartStr, endTime: minutesToTime(slotEnd), taken: true, availableCount: 0 })
      cursor += 30
      continue
    }

    const hasConflict = serviceIds.some(id =>
      roomRanges.get(id)!.some(r => r.start < slotEnd && r.end > cursor)
    )

    const booked = allRanges.filter(r => r.start < slotEnd && r.end > cursor).length
    const availableCount = Math.max(0, totalRooms - booked)

    slots.push({
      startTime: slotStartStr,
      endTime: minutesToTime(slotEnd),
      taken: hasConflict,
      availableCount,
    })
    cursor += 30
  }
  return slots
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/slots.ts
git commit -m "feat: add gender param to slot generation functions"
```

---

## Task 5: API Routes — Slots, Working Hours, and Bookings Create

**Files:**
- Modify: `src/app/api/slots/route.ts`
- Modify: `src/app/api/working-hours/route.ts`
- Modify: `src/app/api/bookings/create/route.ts`

**Interfaces:**
- Consumes: `getAvailableSlots` and `getSlotsForRooms` with `gender` param (Task 4); `Gender` type (Task 3)
- Produces:
  - `GET /api/slots?date=&serviceId=&gender=FEMALE|MALE[&serviceIds=&count=]` — returns `SlotDTO[]`
  - `GET /api/working-hours` — returns `{ dayOfWeek, gender, isOpen }[]`
  - `POST /api/bookings/create` — validates `gender` on each booking entry; rejects if startTime outside gender window

- [ ] **Step 1: Update `src/app/api/slots/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAvailableSlots, getSlotsForRooms } from '@/lib/slots'
import type { Gender } from '@/types'

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  const serviceId = req.nextUrl.searchParams.get('serviceId')
  const serviceIdsParam = req.nextUrl.searchParams.get('serviceIds')
  const countParam = req.nextUrl.searchParams.get('count')
  const genderParam = req.nextUrl.searchParams.get('gender')

  if (!date || !serviceId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  if (genderParam !== 'FEMALE' && genderParam !== 'MALE') {
    return NextResponse.json({ error: 'gender must be FEMALE or MALE' }, { status: 400 })
  }
  const gender = genderParam as Gender

  try {
    if (serviceIdsParam) {
      const serviceIds = serviceIdsParam.split(',').filter(Boolean)
      const slots = await getSlotsForRooms(date, serviceIds, gender)
      return NextResponse.json(slots)
    }

    const count = countParam ? Math.max(1, parseInt(countParam, 10)) : 1
    const service = await prisma.service.findUnique({ where: { id: serviceId } })
    if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    const slots = await getAvailableSlots(date, service.durationMinutes, count, gender)
    return NextResponse.json(slots)
  } catch (err) {
    console.error('Slots fetch error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Update `src/app/api/working-hours/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const hours = await prisma.workingHours.findMany({
    select: { dayOfWeek: true, gender: true, isOpen: true, openTime: true, closeTime: true },
    orderBy: [{ gender: 'asc' }, { dayOfWeek: 'asc' }],
  })
  return NextResponse.json(hours)
}
```

- [ ] **Step 3: Update `src/app/api/bookings/create/route.ts`**

Add `gender` validation and persistence. Replace the file:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { zarinpalRequest } from '@/lib/zarinpal'
import { BookingStatus } from '@prisma/client'
import { randomUUID } from 'crypto'
import type { BookingCreateInput, Gender } from '@/types'

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export async function POST(req: NextRequest) {
  let body: { bookings: BookingCreateInput[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { bookings } = body
  if (!Array.isArray(bookings) || bookings.length === 0) {
    return NextResponse.json({ error: 'bookings must be a non-empty array' }, { status: 400 })
  }

  for (const b of bookings) {
    if (!b.serviceId || !b.customerName || !b.customerPhone || !b.date || !b.startTime) {
      return NextResponse.json({ error: 'Missing required fields in one or more bookings' }, { status: 400 })
    }
    if (b.gender !== 'FEMALE' && b.gender !== 'MALE') {
      return NextResponse.json({ error: 'gender must be FEMALE or MALE' }, { status: 400 })
    }
    if (b.addonIds !== undefined && !Array.isArray(b.addonIds)) {
      return NextResponse.json({ error: 'addonIds must be an array' }, { status: 400 })
    }
  }

  // All bookings in a group must share the same gender
  const genders = [...new Set(bookings.map(b => b.gender))]
  if (genders.length !== 1) {
    return NextResponse.json({ error: 'All bookings in a group must have the same gender' }, { status: 400 })
  }
  const gender = genders[0] as Gender

  const serviceIds = [...new Set(bookings.map(b => b.serviceId))]
  const services = await prisma.service.findMany({ where: { id: { in: serviceIds }, isActive: true } })
  if (services.length !== serviceIds.length) {
    return NextResponse.json({ error: 'One or more services not found or inactive' }, { status: 404 })
  }
  const serviceMap = new Map(services.map(s => [s.id, s]))

  const allAddonIds = [...new Set(bookings.flatMap(b => b.addonIds ?? []))]
  const fetchedAddons = allAddonIds.length > 0
    ? await prisma.addon.findMany({ where: { id: { in: allAddonIds }, isActive: true }, select: { id: true, price: true, requiresTier: true } })
    : []
  if (fetchedAddons.length !== allAddonIds.length) {
    return NextResponse.json({ error: 'One or more add-ons are invalid' }, { status: 400 })
  }
  const addonMap = new Map(fetchedAddons.map(a => [a.id, a]))

  for (const b of bookings) {
    const svc = serviceMap.get(b.serviceId)!
    const addonIds = [...new Set(b.addonIds ?? [])]
    if (svc.tier === null && addonIds.some(id => addonMap.get(id)?.requiresTier)) {
      return NextResponse.json({ error: 'A tier-restricted add-on was selected for a non-tier service' }, { status: 400 })
    }
  }

  const bookedServiceIds = bookings.map(b => b.serviceId)
  if (new Set(bookedServiceIds).size !== bookedServiceIds.length) {
    return NextResponse.json({ error: 'Each room can only be booked once per group' }, { status: 400 })
  }

  // Server-side gender window enforcement
  const [year, month, day] = bookings[0].date.split('-').map(Number)
  const jsDate = new Date(Date.UTC(year, month - 1, day))
  const jsDayMap: Record<number, number> = { 6: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 }
  const dayOfWeek = jsDayMap[jsDate.getUTCDay()]
  const workingDay = await prisma.workingHours.findFirst({ where: { dayOfWeek, gender, isOpen: true } })
  if (!workingDay) {
    return NextResponse.json({ error: 'No working hours configured for this gender and day' }, { status: 400 })
  }
  const openMin = timeToMinutes(workingDay.openTime)
  const closeMin = timeToMinutes(workingDay.closeTime)
  const startMin = timeToMinutes(bookings[0].startTime)
  if (startMin < openMin || startMin >= closeMin) {
    return NextResponse.json({ error: 'Selected time is outside the allowed session window for this gender' }, { status: 400 })
  }

  const groupToken = randomUUID()
  const bookingDate = jsDate

  const bookingData = bookings.map(b => {
    const svc = serviceMap.get(b.serviceId)!
    const addonIds = [...new Set(b.addonIds ?? [])]
    const selectedAddons = addonIds.map(id => addonMap.get(id)!)
    const addonsPricePaid = selectedAddons.reduce((s, a) => s + a.price, 0)
    const endTime = addMinutesToTime(b.startTime, svc.durationMinutes)
    return { b, svc, selectedAddons, addonsPricePaid, endTime }
  })

  const { getAvailableSlots } = await import('@/lib/slots')
  const slotsForDate = await getAvailableSlots(
    bookings[0].date,
    Math.max(...bookingData.map(({ svc }) => svc.durationMinutes)),
    bookings.length,
    gender,
  )
  const requestedSlot = slotsForDate.find(s => s.startTime === bookings[0].startTime)
  if (!requestedSlot || requestedSlot.taken) {
    return NextResponse.json({ error: 'Requested time slot is no longer available' }, { status: 409 })
  }

  const totalPrice = bookingData.reduce((s, { svc, addonsPricePaid }) => s + svc.price + addonsPricePaid, 0)
  const payerPhone = bookings[0].customerPhone
  const firstServiceName = serviceMap.get(bookings[0].serviceId)!.nameFa
  const paymentDescription = bookings.length === 1
    ? `رزرو ${firstServiceName} — نخلسپا`
    : `رزرو گروهی ${bookings.length} غرفه — نخلسپا`

  const createdBookings = await prisma.$transaction(
    bookingData.map(({ b, selectedAddons, addonsPricePaid, endTime }) =>
      prisma.booking.create({
        data: {
          serviceId: b.serviceId,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          customerNotes: b.customerNotes,
          date: bookingDate,
          startTime: b.startTime,
          endTime,
          gender,
          status: BookingStatus.PENDING_PAYMENT,
          addonsPricePaid,
          groupToken,
          addons: {
            create: selectedAddons.map(a => ({ addonId: a.id, pricePaid: a.price })),
          },
        },
      })
    )
  )

  const payerBooking = createdBookings[0]

  try {
    const { authority, paymentUrl } = await zarinpalRequest(totalPrice, paymentDescription, payerPhone)
    await prisma.booking.update({ where: { id: payerBooking.id }, data: { zarinpalAuthority: authority } })
    return NextResponse.json({ paymentUrl })
  } catch (err) {
    console.error('Zarinpal request failed, rolling back bookings', err)
    try {
      await prisma.booking.deleteMany({ where: { groupToken } })
    } catch (deleteErr) {
      console.error('CRITICAL: failed to delete orphaned bookings for groupToken', groupToken, deleteErr)
    }
    return NextResponse.json({ error: 'Payment gateway error' }, { status: 502 })
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/slots/route.ts src/app/api/working-hours/route.ts src/app/api/bookings/create/route.ts
git commit -m "feat: add gender param to slots API, working-hours API, and booking create validation"
```

---

## Task 6: Booking Wizard — Step 0 Gender Selection

**Files:**
- Create: `src/components/booking/StepGender.tsx`
- Modify: `src/components/booking/BookingWizard.tsx`
- Modify: `src/components/booking/StepProgress.tsx`

**Interfaces:**
- Consumes: `WizardState.gender` (Task 3); `GET /api/working-hours` returning `{ dayOfWeek, gender, isOpen, openTime, closeTime }[]`
- Produces: `StepGender` component that sets `state.gender` and calls `goNext`

- [ ] **Step 1: Create `src/components/booking/StepGender.tsx`**

```typescript
'use client'
import { useEffect, useState } from 'react'
import { GoldButton } from '@/components/ui/GoldButton'
import type { WizardState, Gender } from '@/types'

type Props = { state: WizardState; update: (p: Partial<WizardState>) => void; goNext: () => void }

type GenderWindows = { FEMALE: string; MALE: string }

function toFaTime(t: string) {
  return t.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

export function StepGender({ state, update, goNext }: Props) {
  const [windows, setWindows] = useState<GenderWindows | null>(null)

  useEffect(() => {
    fetch('/api/working-hours')
      .then(r => r.json())
      .then((data: { gender: Gender; openTime: string; closeTime: string; isOpen: boolean }[]) => {
        // Pick the earliest openTime and latest closeTime per gender across all days
        const female = data.filter(h => h.gender === 'FEMALE' && h.isOpen)
        const male = data.filter(h => h.gender === 'MALE' && h.isOpen)
        const earliest = (rows: typeof female) => rows.map(h => h.openTime).sort()[0] ?? '—'
        const latest = (rows: typeof female) => rows.map(h => h.closeTime).sort().reverse()[0] ?? '—'
        setWindows({
          FEMALE: `${toFaTime(earliest(female))} — ${toFaTime(latest(female))}`,
          MALE: `${toFaTime(earliest(male))} — ${toFaTime(latest(male))}`,
        })
      })
      .catch(() => setWindows({ FEMALE: '۰۸:۰۰ — ۱۴:۳۰', MALE: '۱۵:۰۰ — ۲۲:۰۰' }))
  }, [])

  function select(gender: Gender) {
    update({ gender })
    goNext()
  }

  const cards: { gender: Gender; label: string; icon: string }[] = [
    { gender: 'FEMALE', label: 'خانم', icon: '♀' },
    { gender: 'MALE',   label: 'آقا',  icon: '♂' },
  ]

  return (
    <div>
      <h2 className="text-base font-light mb-0.5" style={{ color: 'var(--text-primary)' }}>انتخاب جلسه</h2>
      <p className="text-xs mb-5 font-light" style={{ color: 'var(--text-muted)' }}>
        لطفاً نوع جلسه را انتخاب کنید
      </p>

      <div className="flex flex-col gap-3">
        {cards.map(({ gender, label, icon }) => {
          const window = windows?.[gender]
          const selected = state.gender === gender
          return (
            <button
              key={gender}
              type="button"
              onClick={() => select(gender)}
              className="rounded-2xl border p-5 text-right transition-all duration-200 flex items-center gap-4"
              style={selected ? {
                background: 'rgba(198,165,91,0.12)',
                borderColor: 'rgba(198,165,91,0.6)',
                boxShadow: '0 0 0 1px rgba(198,165,91,0.3)',
              } : {
                background: 'var(--bg-surface)',
                borderColor: 'var(--border-base)',
              }}
            >
              <span className="text-3xl" style={{ color: gender === 'FEMALE' ? '#f9a8d4' : '#93c5fd' }}>
                {icon}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
                {window ? (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    ساعت {window}
                  </p>
                ) : (
                  <p className="text-xs" style={{ color: 'var(--text-faint)' }}>در حال بارگذاری...</p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update `src/components/booking/StepProgress.tsx`**

Find the component and update total default from `4` to `5` if it uses a hardcoded total, or ensure the caller passes `total={5}`. The `StepProgress` component receives `total` as a prop — in `BookingWizard` we will pass `total={5}`. No change needed here if the prop is already dynamic. Verify by reading the file and confirm `total` is a prop (not hardcoded). If it is hardcoded to `4`, change it to `5`.

- [ ] **Step 3: Update `src/components/booking/BookingWizard.tsx`**

```typescript
'use client'
import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { StepProgress } from './StepProgress'
import { StepGender } from './StepGender'
import { Step1Service } from './Step1Service'
import { Step2DateTime } from './Step2DateTime'
import { Step3Details } from './Step3Details'
import { Step4Review } from './Step4Review'
import type { ServiceDTO, AddonDTO, WizardState } from '@/types'

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

function emptyPerson() {
  return { serviceId: '', addonIds: [], customerName: '', customerPhone: '', customerNotes: '' }
}

export function BookingWizard({ services }: { services: ServiceDTO[] }) {
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState(1)
  const [state, setState] = useState<WizardState>({ persons: [emptyPerson()] })
  const [addons, setAddons] = useState<AddonDTO[]>([])

  useEffect(() => {
    fetch('/api/addons').then(r => r.json()).then(setAddons).catch(() => {})
  }, [])

  function goNext() { setDir(1); setStep(s => s + 1) }
  function goBack() { setDir(-1); setStep(s => s - 1) }
  const update = useCallback((patch: Partial<WizardState>) => setState(s => ({ ...s, ...patch })), [])

  const stepProps = { state, update, goNext, goBack, services, addons }

  return (
    <div className="px-4 sm:px-5 pt-4 pb-5">
      <StepProgress current={step} total={5} />
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={step}
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          {step === 0 && <StepGender {...stepProps} />}
          {step === 1 && <Step1Service {...stepProps} />}
          {step === 2 && <Step2DateTime {...stepProps} />}
          {step === 3 && <Step3Details {...stepProps} />}
          {step === 4 && <Step4Review {...stepProps} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/booking/StepGender.tsx src/components/booking/BookingWizard.tsx src/components/booking/StepProgress.tsx
git commit -m "feat: add Step 0 gender selection to booking wizard"
```

---

## Task 7: Wizard Steps — Pass Gender to Slots and Review

**Files:**
- Modify: `src/components/booking/Step2DateTime.tsx`
- Modify: `src/components/booking/Step4Review.tsx`

**Interfaces:**
- Consumes: `WizardState.gender` (Task 3); `/api/slots?gender=` (Task 5); `/api/working-hours` returning gender field (Task 5)
- Produces: Step2 passes `gender` param to slots and working-hours fetches; Step4 shows gender badge and includes `gender` in POST body

- [ ] **Step 1: Update `src/components/booking/Step2DateTime.tsx`**

Find the two `fetch` calls in the existing component and update them to include `gender`:

In the `useEffect` that fetches `/api/working-hours`, update the filter to use gender-specific closed days. Replace the entire `useEffect` for working-hours:

```typescript
useEffect(() => {
  if (!state.gender) return
  fetch('/api/working-hours')
    .then(r => r.json())
    .then((data: { dayOfWeek: number; gender: string; isOpen: boolean }[]) => {
      const genderData = data.filter(h => h.gender === state.gender)
      setClosedDays(new Set(genderData.filter(h => !h.isOpen).map(h => h.dayOfWeek)))
    })
    .catch(() => setClosedDays(new Set()))
}, [state.gender])
```

In the `useEffect` that fetches `/api/slots`, add `&gender=${state.gender}` to both URL branches:

```typescript
useEffect(() => {
  if (!state.date || !firstServiceId || !state.gender) return
  setSlots([]); update({ startTime: undefined, endTime: undefined })
  setLoading(true)
  const url = allRoomsChosen
    ? `/api/slots?date=${state.date}&serviceId=${firstServiceId}&serviceIds=${serviceIdsKey}&gender=${state.gender}`
    : `/api/slots?date=${state.date}&serviceId=${firstServiceId}&count=${personCount}&gender=${state.gender}`
  fetch(url)
    .then(r => r.json())
    .then((data: SlotDTO[]) => setSlots(data))
    .finally(() => setLoading(false))
}, [state.date, firstServiceId, allRoomsChosen, serviceIdsKey, personCount, state.gender, update])
```

- [ ] **Step 2: Update `src/components/booking/Step4Review.tsx`**

Add gender badge to the date/time summary card. Find the `GlassCard` for date/time summary and add a gender row:

```typescript
// Inside the date/time GlassCard, after the ساعت row:
<div className="flex justify-between text-xs">
  <span style={{ color: 'var(--text-muted)' }}>جلسه</span>
  <span className={`text-[10px] px-2 py-0.5 rounded-full ${state.gender === 'FEMALE' ? 'bg-pink-400/10 text-pink-400' : 'bg-blue-400/10 text-blue-400'}`}>
    {state.gender === 'FEMALE' ? 'خانم' : 'آقا'}
  </span>
</div>
```

In `handlePay`, include `gender` on each booking entry:

```typescript
const bookings = state.persons.map(person => ({
  serviceId: person.serviceId,
  customerName: person.customerName,
  customerPhone: person.customerPhone,
  customerNotes: person.customerNotes || undefined,
  date: state.date!,
  startTime: state.startTime!,
  addonIds: person.addonIds,
  gender: state.gender!,
}))
```

- [ ] **Step 3: Commit**

```bash
git add src/components/booking/Step2DateTime.tsx src/components/booking/Step4Review.tsx
git commit -m "feat: pass gender to slot fetching and include gender in booking submission"
```

---

## Task 8: Admin — Bookings Table and Detail Dialog

**Files:**
- Modify: `src/app/admin/(panel)/bookings/columns.tsx`
- Modify: `src/app/admin/(panel)/bookings/BookingDetailDialog.tsx`
- Modify: `src/app/api/admin/bookings/route.ts`

**Interfaces:**
- Consumes: `Gender` type (Task 3); `Booking.gender` from DB (Task 1)
- Produces: `BookingRow.gender: 'FEMALE' | 'MALE'`; gender badge in customer cell; gender field in detail dialog

- [ ] **Step 1: Update `src/app/api/admin/bookings/route.ts`**

Add `gender` to the select/include so it's returned in booking rows:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BookingStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  const statusParam = req.nextUrl.searchParams.get('status')
  const validStatuses = Object.values(BookingStatus)
  if (statusParam && !validStatuses.includes(statusParam as BookingStatus)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  const bookings = await prisma.booking.findMany({
    where: statusParam ? { status: statusParam as BookingStatus } : undefined,
    include: { service: true, addons: { include: { addon: true } } },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(bookings)
}
```

- [ ] **Step 2: Update `src/app/admin/(panel)/bookings/columns.tsx`**

Add `gender: 'FEMALE' | 'MALE'` to `BookingRow` type, and add a gender badge inside the customer name cell:

```typescript
export type BookingRow = {
  id: string
  date: string
  startTime: string
  endTime: string
  customerName: string
  customerPhone: string
  serviceNameFa: string
  servicePrice: number
  addonsPricePaid: number
  addons: BookingAddonRow[]
  status: BookingStatus
  notes: string | null
  refId: string | null
  gender: 'FEMALE' | 'MALE'
}
```

In the `customerName` column cell, add the badge:

```typescript
{
  accessorKey: "customerName",
  header: () => <span style={{ color: "var(--text-muted)" }}>مشتری</span>,
  cell: ({ row }) => (
    <div>
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
          {row.getValue("customerName")}
        </span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
          row.original.gender === 'FEMALE'
            ? 'bg-pink-400/10 text-pink-400'
            : 'bg-blue-400/10 text-blue-400'
        }`}>
          {row.original.gender === 'FEMALE' ? 'خانم' : 'آقا'}
        </span>
      </div>
      <div className="text-[11px]" style={{ color: "var(--text-faint)" }}>
        {row.original.customerPhone}
      </div>
    </div>
  ),
},
```

Also ensure the `BookingRow` is populated with `gender` in the page that fetches and maps bookings. Check `src/app/admin/(panel)/bookings/page.tsx` — it maps the API response to `BookingRow`. Add `gender: b.gender` to that mapping.

- [ ] **Step 3: Update `src/app/admin/(panel)/bookings/BookingDetailDialog.tsx`**

Add gender to the `fields` array in the dialog:

```typescript
// Find the fields array and add gender after the customer name field:
const genderLabel = booking.gender === 'FEMALE' ? 'خانم' : 'آقا'

const fields: [string, string][] = [
  ["نام", booking.customerName],
  ["جنسیت", genderLabel],   // NEW
  ["موبایل", booking.customerPhone],
  ["خدمت", booking.serviceNameFa],
  ["تاریخ", booking.date],
  ["ساعت", `${booking.startTime} — ${booking.endTime}`],
  ["توضیحات", booking.notes ?? "—"],
  ["کد پیگیری", booking.refId ?? "—"],
]
```

Also render the جنسیت field with a colored badge instead of plain text. Replace the generic `fields.map` render loop — add a special case for جنسیت:

```typescript
{fields.map(([label, value]) => (
  <div key={label} className="flex justify-between items-start gap-4">
    <span className="text-xs flex-shrink-0" style={{ color: "var(--text-faint)" }}>{label}</span>
    {label === 'جنسیت' ? (
      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
        booking.gender === 'FEMALE' ? 'bg-pink-400/10 text-pink-400' : 'bg-blue-400/10 text-blue-400'
      }`}>
        {value}
      </span>
    ) : (
      <span className="text-xs text-end" style={{ color: "var(--text-primary)" }}>{value}</span>
    )}
  </div>
))}
```

- [ ] **Step 4: Check `src/app/admin/(panel)/bookings/page.tsx`**

Read the file and find where bookings are mapped to `BookingRow`. Add `gender: b.gender` to the mapping object. (The exact lines depend on current file state — map the field wherever other booking fields like `customerName`, `status` are mapped.)

- [ ] **Step 5: Commit**

```bash
git add "src/app/admin/(panel)/bookings/columns.tsx" "src/app/admin/(panel)/bookings/BookingDetailDialog.tsx" "src/app/api/admin/bookings/route.ts" "src/app/admin/(panel)/bookings/page.tsx"
git commit -m "feat: show gender badge in admin bookings table and detail dialog"
```

---

## Task 9: Admin — Schedule Manager Gender Tabs

**Files:**
- Modify: `src/app/api/admin/schedule/hours/route.ts`
- Modify: `src/app/api/admin/schedule/route.ts`
- Modify: `src/app/admin/(panel)/schedule/page.tsx`
- Modify: `src/components/admin/ScheduleManager.tsx`

**Interfaces:**
- Consumes: `WorkingHours` with `gender` field (Task 1); `PUT /api/admin/schedule/hours` updated to accept `gender`
- Produces: Two-tab schedule UI (خانم / آقا); each tab shows 7 rows; save upserts by `{ dayOfWeek, gender }`

- [ ] **Step 1: Update `src/app/api/admin/schedule/hours/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest) {
  try {
    const hours: { id: string; dayOfWeek: number; gender: 'FEMALE' | 'MALE'; isOpen: boolean; openTime: string; closeTime: string }[] = await req.json()
    await Promise.all(
      hours.map(h => prisma.workingHours.update({
        where: { id: h.id },
        data: { isOpen: h.isOpen, openTime: h.openTime, closeTime: h.closeTime }
      }))
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Working hours update error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Update `src/app/api/admin/schedule/route.ts`**

The `GET` already returns `hours` from `prisma.workingHours.findMany`. Since `gender` is now a column, it will be included automatically. Update the `orderBy` to sort by gender then dayOfWeek:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [hours, blocks] = await Promise.all([
      prisma.workingHours.findMany({ orderBy: [{ gender: 'asc' }, { dayOfWeek: 'asc' }] }),
      prisma.blockedSlot.findMany({ orderBy: { date: 'asc' } }),
    ])
    return NextResponse.json({ hours, blocks })
  } catch (err) {
    console.error('Schedule fetch error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Update `src/app/admin/(panel)/schedule/page.tsx`**

```typescript
import { prisma } from '@/lib/prisma'
import { ScheduleManager } from '@/components/admin/ScheduleManager'

export default async function SchedulePage() {
  const [hours, blocks] = await Promise.all([
    prisma.workingHours.findMany({ orderBy: [{ gender: 'asc' }, { dayOfWeek: 'asc' }] }),
    prisma.blockedSlot.findMany({ orderBy: { date: 'desc' } }),
  ])
  return <ScheduleManager hours={hours} blocks={blocks} />
}
```

- [ ] **Step 4: Update `src/components/admin/ScheduleManager.tsx`**

Update the `Hour` type to include `gender`, add a `activeGenderTab` state, and split the hours table into two tabs:

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import { DatePicker } from '@/components/ui/DatePicker'
import { TimePicker } from '@/components/ui/TimePicker'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const DAY_NAMES = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']

type Hour = { id: string; dayOfWeek: number; gender: 'FEMALE' | 'MALE'; openTime: string; closeTime: string; isOpen: boolean }
type Block = { id: string; date: Date; startTime: string; endTime: string; reason: string | null }

function toFaDate(date: Date) {
  return new Date(date.toISOString().split('T')[0] + 'T12:00:00').toLocaleDateString('fa-IR')
}

function toFaTime(t: string) {
  return t.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

export function ScheduleManager({ hours, blocks }: { hours: Hour[]; blocks: Block[] }) {
  const [localHours, setLocalHours] = useState(hours)
  const [newBlock, setNewBlock] = useState({ date: '', startTime: '', endTime: '', reason: '' })
  const [activeTab, setActiveTab] = useState<'FEMALE' | 'MALE'>('FEMALE')
  const router = useRouter()

  const tabHours = localHours.filter(h => h.gender === activeTab)

  function updateHour(id: string, patch: Partial<Hour>) {
    setLocalHours(prev => prev.map(h => h.id === id ? { ...h, ...patch } : h))
  }

  async function saveHours() {
    const res = await fetch('/api/admin/schedule/hours', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(localHours),
    })
    if (res.ok) toast.success('ساعت کاری ذخیره شد')
    else toast.error('خطا در ذخیره‌سازی')
    router.refresh()
  }

  async function addBlock() {
    if (!newBlock.date || !newBlock.startTime || !newBlock.endTime) {
      toast.error('تاریخ و ساعت را تکمیل کنید')
      return
    }
    const res = await fetch('/api/admin/schedule/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBlock),
    })
    if (res.ok) {
      toast.success('بازه مسدود شد')
      setNewBlock({ date: '', startTime: '', endTime: '', reason: '' })
    } else {
      toast.error('خطا در افزودن بلاک')
    }
    router.refresh()
  }

  async function removeBlock(id: string) {
    const res = await fetch(`/api/admin/schedule/block/${id}`, { method: 'DELETE' })
    if (res.ok) toast.success('بلاک حذف شد')
    else toast.error('خطا در حذف')
    router.refresh()
  }

  const tabs: { value: 'FEMALE' | 'MALE'; label: string }[] = [
    { value: 'FEMALE', label: 'خانم' },
    { value: 'MALE',   label: 'آقا'  },
  ]

  return (
    <div>
      <h1 className="text-xl font-light mb-6" style={{ color: 'var(--text-primary)' }}>زمان‌بندی</h1>

      <h2 className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>ساعت کاری</h2>

      {/* Gender tabs */}
      <div className="flex gap-2 mb-3">
        {tabs.map(tab => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
            style={activeTab === tab.value ? {
              background: tab.value === 'FEMALE' ? 'rgba(244,114,182,0.15)' : 'rgba(147,197,253,0.15)',
              color: tab.value === 'FEMALE' ? '#f472b6' : '#93c5fd',
              border: `1px solid ${tab.value === 'FEMALE' ? 'rgba(244,114,182,0.4)' : 'rgba(147,197,253,0.4)'}`,
            } : {
              background: 'var(--glass-bg)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-base)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <GlassCard className="mb-4 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b" style={{ borderColor: 'var(--border-base)' }}>
              <TableHead className="text-xs font-medium py-2 px-3" style={{ color: 'var(--text-faint)' }}>روز</TableHead>
              <TableHead className="text-xs font-medium py-2 px-3" style={{ color: 'var(--text-faint)' }}>از</TableHead>
              <TableHead className="text-xs font-medium py-2 px-3" style={{ color: 'var(--text-faint)' }}>تا</TableHead>
              <TableHead className="text-xs font-medium py-2 px-3 text-left" style={{ color: 'var(--text-faint)' }}>وضعیت</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tabHours.map(h => (
              <TableRow key={h.id} className="border-b last:border-0" style={{ borderColor: 'var(--border-base)' }}>
                <TableCell className="py-1.5 px-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {DAY_NAMES[h.dayOfWeek]}
                </TableCell>
                <TableCell className="py-1.5 px-3">
                  <TimePicker value={h.openTime} onChange={v => updateHour(h.id, { openTime: v })} className="min-w-[90px]" />
                </TableCell>
                <TableCell className="py-1.5 px-3">
                  <TimePicker value={h.closeTime} onChange={v => updateHour(h.id, { closeTime: v })} className="min-w-[90px]" />
                </TableCell>
                <TableCell className="py-1.5 px-3 text-left">
                  <button type="button"
                    onClick={() => updateHour(h.id, { isOpen: !h.isOpen })}
                    className="inline-flex items-center justify-center text-xs px-3 py-1 rounded-full font-medium transition-all duration-150 min-w-[52px] border"
                    style={h.isOpen ? {
                      background: 'rgba(31,94,70,0.20)',
                      borderColor: 'rgba(74,180,120,0.35)',
                      color: 'var(--color-green-soft)',
                    } : {
                      background: 'var(--glass-bg)',
                      borderColor: 'var(--border-base)',
                      color: 'var(--text-muted)',
                    }}>
                    {h.isOpen ? 'باز' : 'بسته'}
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </GlassCard>
      <GoldButton onClick={saveHours} className="w-full mb-6">ذخیره ساعت‌ها</GoldButton>

      <h2 className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>مسدود کردن زمان</h2>
      <GlassCard className="p-4 mb-4 flex flex-col gap-3">
        <DatePicker value={newBlock.date} onChange={v => setNewBlock(b => ({ ...b, date: v }))} />
        <div className="flex gap-2">
          <TimePicker value={newBlock.startTime} onChange={v => setNewBlock(b => ({ ...b, startTime: v }))} placeholder="از ساعت" className="flex-1" />
          <TimePicker value={newBlock.endTime} onChange={v => setNewBlock(b => ({ ...b, endTime: v }))} placeholder="تا ساعت" className="flex-1" />
        </div>
        <input
          value={newBlock.reason}
          onChange={e => setNewBlock(b => ({ ...b, reason: e.target.value }))}
          placeholder="دلیل (اختیاری)"
          className="flex w-full rounded-xl px-3 py-2 text-xs transition-all duration-150 cursor-text outline-none"
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--border-base)',
            color: newBlock.reason ? 'var(--text-primary)' : undefined,
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(198,165,91,0.6)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-base)' }}
        />
        <GoldButton onClick={addBlock} className="w-full">افزودن بلاک</GoldButton>
      </GlassCard>

      <div className="flex flex-col gap-2">
        {blocks.map(b => (
          <GlassCard key={b.id} className="flex items-center gap-3 p-3">
            <div className="flex-1">
              <div className="text-xs" style={{ color: 'var(--text-primary)' }}>
                {toFaDate(b.date)} {toFaTime(b.startTime)}–{toFaTime(b.endTime)}
              </div>
              {b.reason && <div className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{b.reason}</div>}
            </div>
            <button type="button" onClick={() => removeBlock(b.id)} className="text-red-400 text-xs hover:text-red-300 transition-colors">
              حذف
            </button>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/schedule/hours/route.ts src/app/api/admin/schedule/route.ts "src/app/admin/(panel)/schedule/page.tsx" src/components/admin/ScheduleManager.tsx
git commit -m "feat: split schedule manager into gender tabs (خانم/آقا)"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] `Gender` enum added to schema — Task 1
- [x] `WorkingHours.gender` + `@@unique([dayOfWeek, gender])` — Task 1
- [x] `Booking.gender` — Task 1
- [x] Seed 14 rows — Task 2
- [x] Step 0 gender selection — Task 6
- [x] Slots API filters by gender — Tasks 4, 5
- [x] Server-side startTime validation against gender window — Task 5
- [x] `gender` persisted on booking — Task 5
- [x] Step 2 closed days filtered by gender — Task 7
- [x] Step 4 review shows gender badge + sends gender — Task 7
- [x] Admin bookings table gender badge on customer cell — Task 8
- [x] Admin booking detail dialog gender field — Task 8
- [x] Schedule manager two-tab UI — Task 9
- [x] Working hours API returns gender — Task 5 (Step 2)
- [x] Step 0 fetches representative hours from DB — Task 6 (StepGender)

**Type consistency:**
- `getAvailableSlots(date, durationMinutes, count, gender)` — defined Task 4, called Task 5 ✓
- `getSlotsForRooms(date, serviceIds, gender)` — defined Task 4, called Task 5 ✓
- `WizardState.gender?: Gender` — defined Task 3, set Task 6, read Tasks 7 ✓
- `BookingCreateInput.gender: Gender` — defined Task 3, sent Task 7, validated Task 5 ✓
- `BookingRow.gender` — defined Task 3 (via admin columns note), populated Task 8 ✓
- `Hour.gender` in ScheduleManager — defined Task 9, consistent with DB field ✓
