# Multi-Room Simultaneous Booking — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow multiple rooms to be booked simultaneously (each has its own masseuse), and let a single customer reserve multiple rooms for a group in one payment.

**Architecture:** Add `groupToken` to the `Booking` schema to link group bookings. Refactor slot logic to count bookings per time slot rather than blocking all rooms. Upgrade the 4-step wizard: Step 1 becomes per-person, Step 2 shows per-slot room counts, Step 3 collects per-person details, Step 4 submits all bookings in one batch. The create API accepts an array of bookings, creates them in a transaction, and issues one Zarinpal payment for the total.

**Tech Stack:** Next.js 16 App Router, Prisma v7 + `@prisma/adapter-pg`, Better Auth, BullMQ, Tailwind v4, Framer Motion, TypeScript

## Global Constraints

- All Prisma queries must pass `{ adapter }` — `PrismaClient` is always constructed with `new PrismaPg(process.env.DATABASE_URL!)` adapter. Never use bare `new PrismaClient()`.
- `datasource` block in `schema.prisma` has **no `url` field** (Prisma v7 breaking change).
- All text visible to users must use `font-vazir` (Vazirmatn). No `font-mono` on Persian content.
- All colors must use CSS vars (`var(--text-primary)`, `var(--text-muted)`, `var(--text-faint)`, `var(--bg-base)`, `var(--bg-surface)`, `var(--border-base)`). Never hardcode colors except the gold accent `#C6A55B` and its dark pair `#0F3D2E` which are already established project-wide.
- Migrations: `bunx prisma migrate dev --name <name>` (reads `.env`, not `.env.local`).
- No lint or test runner is configured — manual verification only.
- `@/` maps to `src/`.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `prisma/schema.prisma` | Modify | Add `groupToken String?` + index to `Booking` |
| `prisma/migrations/…` | Create (auto) | Migration for `groupToken` |
| `src/types/index.ts` | Modify | Add `Person`, `MultiBookingCreateInput`, update `SlotDTO`, update `WizardState` |
| `src/lib/slots.ts` | Modify | Per-slot room count logic, `count` param, return `availableCount` |
| `src/app/api/slots/route.ts` | Modify | Pass `count` query param to `getAvailableSlots` |
| `src/app/api/bookings/create/route.ts` | Modify | Accept `{ bookings: BookingCreateInput[] }`, transaction, groupToken, single Zarinpal call |
| `src/app/api/bookings/verify/route.ts` | Modify | Update all bookings in group by `groupToken`, SMS only to payer |
| `src/components/booking/BookingWizard.tsx` | Modify | State shape → `persons[]`, pass `count` to Step2 |
| `src/components/booking/Step1Service.tsx` | Modify | Per-person cards, add/remove person, per-person service + addon selection |
| `src/components/booking/Step2DateTime.tsx` | Modify | Pass `count` to slots API, show `availableCount` badge on pills |
| `src/components/booking/Step3Details.tsx` | Modify | Per-person form cards; payer (phone required) vs friend (phone optional) |
| `src/components/booking/Step4Review.tsx` | Modify | List per-person rooms + addons, grand total, submit `{ bookings: […] }` |
| `src/app/booking/confirm/[token]/page.tsx` | Modify | Fetch group by `groupToken`, render multi-person summary |

---

## Task 1: Schema — Add `groupToken` to Booking

**Files:**
- Modify: `prisma/schema.prisma`
- Run migration (auto-creates file in `prisma/migrations/`)

**Interfaces:**
- Produces: `Booking.groupToken: String?` — used by Tasks 5, 6, 7

- [ ] **Step 1: Add field to schema**

In `prisma/schema.prisma`, inside `model Booking { … }`, add after `addonsPricePaid`:

```prisma
  groupToken         String?
```

And add the index after the existing `@@index([serviceId])`:

```prisma
  @@index([groupToken])
```

The Booking model block should now look like:

```prisma
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
```

- [ ] **Step 2: Run migration**

```bash
bunx prisma migrate dev --name add-group-token
```

Expected output: `✔ Your database is now in sync with your schema.`

- [ ] **Step 3: Verify Prisma client regenerated**

```bash
bunx prisma generate
```

Expected: `✔ Generated Prisma Client`

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add groupToken to Booking for multi-room group linking"
```

---

## Task 2: Types — Update shared type definitions

**Files:**
- Modify: `src/types/index.ts`

**Interfaces:**
- Consumes: nothing yet
- Produces:
  - `SlotDTO` gains `availableCount: number`
  - `Person` type (per-person booking data)
  - `MultiBookingCreateInput` — what the create API now receives
  - `WizardState` type (used across all wizard steps)

- [ ] **Step 1: Replace `src/types/index.ts` content**

```typescript
import { BookingStatus } from '@prisma/client'

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
  availableCount: number // how many rooms are free at this slot
}

// One person in a group booking
export type Person = {
  serviceId: string
  addonIds: string[]
  customerName: string
  customerPhone: string   // required for person[0] (payer), optional (can be '') for others
  customerNotes: string
}

// Wizard UI state
export type WizardState = {
  persons: Person[]
  date?: string           // "YYYY-MM-DD"
  startTime?: string      // "HH:mm"
  endTime?: string        // "HH:mm"
}

// What Step4 POSTs to /api/bookings/create
export type MultiBookingCreateInput = {
  bookings: {
    serviceId: string
    customerName: string
    customerPhone: string
    customerNotes?: string
    date: string
    startTime: string
    addonIds?: string[]
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
git commit -m "feat: add Person, MultiBookingCreateInput, SlotDTO.availableCount types"
```

---

## Task 3: Slot Logic — Per-room availability count

**Files:**
- Modify: `src/lib/slots.ts`
- Modify: `src/app/api/slots/route.ts`

**Interfaces:**
- Consumes: `SlotDTO` from Task 2
- Produces:
  - `getAvailableSlots(date: string, durationMinutes: number, count?: number): Promise<SlotDTO[]>`
  - Each slot now has `availableCount` (rooms free) and `taken` is true when `availableCount < count`

- [ ] **Step 1: Rewrite `src/lib/slots.ts`**

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

export async function getAvailableSlots(
  date: string,
  durationMinutes: number,
  count = 1,
): Promise<SlotDTO[]> {
  const [year, month, day] = date.split('-').map(Number)
  const jsDate = new Date(Date.UTC(year, month - 1, day))
  // Iranian week: Saturday=0 ... Friday=6. JS getUTCDay: Sunday=0 ... Saturday=6
  const jsDayMap: Record<number, number> = { 6: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 }
  const dayOfWeek = jsDayMap[jsDate.getUTCDay()]

  const workingDay = await prisma.workingHours.findFirst({ where: { dayOfWeek, isOpen: true } })
  if (!workingDay) return []

  const open = timeToMinutes(workingDay.openTime)
  const close = timeToMinutes(workingDay.closeTime)

  // Total number of independent rooms (tier services only — each has its own masseuse)
  const totalRooms = await prisma.service.count({ where: { isActive: true, tier: { not: null } } })

  // All non-cancelled bookings on this date, grouped by startTime
  const existingBookings = await prisma.booking.findMany({
    where: { date: jsDate, status: { not: BookingStatus.CANCELLED } },
    select: { startTime: true, endTime: true },
  })

  // Count bookings per startTime slot
  const bookingsPerSlot = new Map<string, number>()
  for (const b of existingBookings) {
    bookingsPerSlot.set(b.startTime, (bookingsPerSlot.get(b.startTime) ?? 0) + 1)
  }

  const blocked = await prisma.blockedSlot.findMany({
    where: { date: jsDate },
    select: { startTime: true, endTime: true },
  })

  const blockedRanges = blocked.map(b => ({
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

    const booked = bookingsPerSlot.get(slotStartStr) ?? 0
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
```

- [ ] **Step 2: Update `src/app/api/slots/route.ts` to pass `count`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAvailableSlots } from '@/lib/slots'

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  const serviceId = req.nextUrl.searchParams.get('serviceId')
  const countParam = req.nextUrl.searchParams.get('count')
  if (!date || !serviceId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const count = countParam ? Math.max(1, parseInt(countParam, 10)) : 1

  try {
    const service = await prisma.service.findUnique({ where: { id: serviceId } })
    if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    const slots = await getAvailableSlots(date, service.durationMinutes, count)
    return NextResponse.json(slots)
  } catch (err) {
    console.error('Slots fetch error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Manual verification**

Start dev server (`bun run dev`), open browser DevTools, and call:

```
GET /api/slots?date=<tomorrow-YYYY-MM-DD>&serviceId=<any-tier-service-id>&count=1
```

Expected: array of slots each with `{ startTime, endTime, taken, availableCount }`.
With no existing bookings, every slot should have `availableCount` equal to your total active tier services count (4).

- [ ] **Step 4: Commit**

```bash
git add src/lib/slots.ts src/app/api/slots/route.ts
git commit -m "feat: per-room slot availability — count bookings per time slot, return availableCount"
```

---

## Task 4: Wizard State + Step 2 (Date/Time) UI

**Files:**
- Modify: `src/components/booking/BookingWizard.tsx`
- Modify: `src/components/booking/Step2DateTime.tsx`

**Interfaces:**
- Consumes: `WizardState`, `SlotDTO` from Task 2; slots API now returns `availableCount`
- Produces: `WizardState` with `persons[]` shape used by Steps 1, 3, 4

- [ ] **Step 1: Rewrite `src/components/booking/BookingWizard.tsx`**

```typescript
'use client'
import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { StepProgress } from './StepProgress'
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
  const [step, setStep] = useState(1)
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
      <StepProgress current={step} total={4} />
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

- [ ] **Step 2: Rewrite `src/components/booking/Step2DateTime.tsx`**

```typescript
'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GoldButton } from '@/components/ui/GoldButton'
import { GhostButton } from '@/components/ui/GhostButton'
import type { WizardState, SlotDTO } from '@/types'

type Props = { state: WizardState; update: (p: Partial<WizardState>) => void; goNext: () => void; goBack: () => void }

function toFaTime(t: string) {
  return t.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

function toFaNum(n: number) {
  return String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

function getDates(count = 14) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i + 1)
    return d.toISOString().split('T')[0]
  })
}

const JS_TO_IR: Record<number, number> = { 6: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 }

function iranianDayOfWeek(dateStr: string): number {
  const [y, mo, d] = dateStr.split('-').map(Number)
  return JS_TO_IR[new Date(Date.UTC(y, mo - 1, d)).getUTCDay()]
}

export function Step2DateTime({ state, update, goNext, goBack }: Props) {
  const [slots, setSlots] = useState<SlotDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [closedDays, setClosedDays] = useState<Set<number> | null>(null)
  const dates = getDates()

  // Use first person's serviceId for duration lookup; count = total persons
  const firstServiceId = state.persons[0]?.serviceId
  const personCount = state.persons.length

  useEffect(() => {
    fetch('/api/working-hours')
      .then(r => r.json())
      .then((data: { dayOfWeek: number; isOpen: boolean }[]) => {
        setClosedDays(new Set(data.filter(h => !h.isOpen).map(h => h.dayOfWeek)))
      })
      .catch(() => setClosedDays(new Set()))
  }, [])

  useEffect(() => {
    if (!state.date || !firstServiceId) return
    setSlots([]); update({ startTime: undefined, endTime: undefined })
    setLoading(true)
    fetch(`/api/slots?date=${state.date}&serviceId=${firstServiceId}&count=${personCount}`)
      .then(r => r.json())
      .then((data: SlotDTO[]) => setSlots(data))
      .finally(() => setLoading(false))
  }, [state.date, firstServiceId, personCount, update])

  return (
    <div>
      <h2 className="text-base font-light mb-0.5" style={{ color: 'var(--text-primary)' }}>انتخاب تاریخ</h2>
      <p className="text-xs mb-3 font-light" style={{ color: 'var(--text-muted)' }}>تاریخ مورد نظر را انتخاب کنید</p>

      <div className="relative mb-3">
        <div className="pointer-events-none absolute right-0 top-0 bottom-3 w-8 z-10"
          style={{ background: 'linear-gradient(to left, var(--bg-base), transparent)' }} />
        <div className="pointer-events-none absolute left-0 top-0 bottom-3 w-8 z-10"
          style={{ background: 'linear-gradient(to right, var(--bg-base), transparent)' }} />
        <div className="flex gap-2 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
          {dates.map(d => {
            const [y, mo, day] = d.split('-').map(Number)
            const label = new Date(y, mo - 1, day).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })
            const selected = state.date === d
            const closed = closedDays !== null && closedDays.has(iranianDayOfWeek(d))
            if (closed) {
              return (
                <div key={d} title="این روز تعطیل است"
                  className="relative flex-shrink-0 px-4 py-2.5 rounded-xl text-xs select-none cursor-not-allowed overflow-hidden"
                  style={{ color: 'var(--text-faint)', background: 'var(--bg-surface)', border: '1px solid var(--border-base)', opacity: 0.5 }}>
                  <span className="line-through">{label}</span>
                  <span className="pointer-events-none absolute inset-0 rounded-xl"
                    style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(255,255,255,0.06) 4px, rgba(255,255,255,0.06) 5px)' }} />
                </div>
              )
            }
            return (
              <button key={d} type="button" onClick={() => update({ date: d })}
                className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs transition-all ${selected ? 'bg-[#C6A55B] text-[#0F3D2E] font-bold shadow-[0_4px_16px_rgba(198,165,91,0.4)]' : ''}`}
                style={selected ? {} : { color: 'var(--text-muted)', background: 'var(--bg-surface)', border: '1px solid var(--border-base)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)' }}>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {state.date && (
        <>
          <p className="text-[10px] tracking-widest mb-3" style={{ color: 'var(--text-faint)' }}>— ساعت‌های موجود</p>
          {loading ? (
            <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>در حال بارگذاری...</p>
          ) : slots.length === 0 ? (
            <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>ظرفیتی برای این روز موجود نیست</p>
          ) : slots.every(s => s.taken) ? (
            <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>تمام ساعت‌های این روز رزرو شده‌اند</p>
          ) : (
            <motion.div className="flex flex-wrap gap-2 mb-4"
              variants={{ show: { transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="show">
              {slots.map(slot => {
                const selected = state.startTime === slot.startTime
                if (slot.taken) {
                  return (
                    <motion.div key={slot.startTime} title="این ساعت رزرو شده است"
                      variants={{ hidden: { opacity: 0, scale: 0.85 }, show: { opacity: 1, scale: 1 } }}
                      className="relative px-4 py-2 rounded-xl text-xs select-none cursor-not-allowed overflow-hidden"
                      style={{ color: 'var(--text-faint)', background: 'var(--bg-surface)', border: '1px solid var(--border-base)', opacity: 0.5 }}>
                      <span className="line-through">{toFaTime(slot.startTime)}</span>
                      <span className="pointer-events-none absolute inset-0 rounded-xl"
                        style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(255,255,255,0.06) 4px, rgba(255,255,255,0.06) 5px)' }} />
                    </motion.div>
                  )
                }
                return (
                  <motion.button key={slot.startTime} type="button"
                    variants={{ hidden: { opacity: 0, scale: 0.85 }, show: { opacity: 1, scale: 1 } }}
                    onClick={() => update({ startTime: slot.startTime, endTime: slot.endTime })}
                    className={`flex flex-col items-center px-4 py-2 rounded-xl text-xs transition-all ${selected ? 'bg-[#C6A55B] text-[#0F3D2E] font-bold shadow-[0_4px_16px_rgba(198,165,91,0.35)]' : ''}`}
                    style={selected ? {} : { color: 'var(--text-muted)', background: 'var(--bg-surface)', border: '1px solid var(--border-base)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)' }}>
                    <span>{toFaTime(slot.startTime)}</span>
                    <span className={`text-[9px] mt-0.5 ${slot.availableCount === 1 ? 'text-amber-400' : selected ? 'text-[#0F3D2E]/70' : ''}`}
                      style={slot.availableCount > 1 && !selected ? { color: 'var(--text-faint)' } : {}}>
                      {toFaNum(slot.availableCount)} غرفه خالی
                    </span>
                  </motion.button>
                )
              })}
            </motion.div>
          )}
        </>
      )}

      <div className="flex gap-3 mt-2">
        <GhostButton onClick={goBack} className="flex-1">→ برگشت</GhostButton>
        <GoldButton onClick={goNext} className="flex-1" disabled={!state.startTime}>ادامه ←</GoldButton>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Manual verification**

Run `bun run dev`. Open the booking dialog, select a service, go to Step 2. Verify:
- Each available time slot shows "X غرفه خالی" badge
- Slots with 1 room left show the badge in amber
- Taken slots remain struck-through

- [ ] **Step 4: Commit**

```bash
git add src/components/booking/BookingWizard.tsx src/components/booking/Step2DateTime.tsx
git commit -m "feat: wizard uses persons[] state; Step2 shows per-slot room availability count"
```

---

## Task 5: Step 1 — Per-Person Service Selector

**Files:**
- Modify: `src/components/booking/Step1Service.tsx`

**Interfaces:**
- Consumes: `WizardState.persons[]`, `Person` from Task 2; `ServiceDTO`, `AddonDTO`
- Produces: updated `state.persons[]` with `serviceId` and `addonIds` per person

- [ ] **Step 1: Rewrite `src/components/booking/Step1Service.tsx`**

```typescript
'use client'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import { TierIcon } from '@/components/ui/TierIcon'
import type { ServiceDTO, AddonDTO, WizardState, Person } from '@/types'

type Props = {
  state: WizardState
  update: (p: Partial<WizardState>) => void
  goNext: () => void
  services: ServiceDTO[]
  addons: AddonDTO[]
}

const TIER_COLORS: Record<string, string> = {
  red: '#E05C5C',
  yellow: '#D4A929',
  purple: '#9B59B6',
  blue: '#4A90D9',
}

function emptyPerson(): Person {
  return { serviceId: '', addonIds: [], customerName: '', customerPhone: '', customerNotes: '' }
}

function updatePerson(persons: Person[], index: number, patch: Partial<Person>): Person[] {
  return persons.map((p, i) => i === index ? { ...p, ...patch } : p)
}

export function Step1Service({ state, update, goNext, services, addons }: Props) {
  const persons = state.persons
  const tierServices = services.filter(s => s.tier !== null).sort((a, b) => (a.tier ?? 0) - (b.tier ?? 0))
  const otherServices = services.filter(s => s.tier === null)

  const totalPrice = persons.reduce((sum, person) => {
    const svc = services.find(s => s.id === person.serviceId)
    const addonSum = person.addonIds.reduce((a, id) => a + (addons.find(ad => ad.id === id)?.price ?? 0), 0)
    return sum + (svc?.price ?? 0) + addonSum
  }, 0)

  const allPersonsHaveService = persons.every(p => p.serviceId !== '')

  function setPerson(index: number, patch: Partial<Person>) {
    update({ persons: updatePerson(persons, index, patch) })
  }

  function addPerson() {
    update({ persons: [...persons, emptyPerson()] })
  }

  function removePerson(index: number) {
    update({ persons: persons.filter((_, i) => i !== index) })
  }

  function selectService(index: number, svc: ServiceDTO) {
    const person = persons[index]
    const cleanedAddonIds = svc.tier === null
      ? person.addonIds.filter(id => !addons.find(a => a.id === id)?.requiresTier)
      : person.addonIds
    setPerson(index, { serviceId: svc.id, addonIds: cleanedAddonIds })
  }

  function toggleAddon(index: number, addonId: string) {
    const person = persons[index]
    const next = person.addonIds.includes(addonId)
      ? person.addonIds.filter(x => x !== addonId)
      : [...person.addonIds, addonId]
    setPerson(index, { addonIds: next })
  }

  return (
    <div>
      <h2 className="text-base font-light mb-0.5" style={{ color: 'var(--text-primary)' }}>انتخاب غرفه</h2>
      <p className="text-xs mb-3 font-light" style={{ color: 'var(--text-muted)' }}>برای هر نفر یک غرفه انتخاب کنید</p>

      <div className="flex flex-col gap-4">
        {persons.map((person, personIndex) => {
          const selectedService = services.find(s => s.id === person.serviceId)
          const availableAddons = addons.filter(a => !a.requiresTier || (selectedService?.tier ?? null) !== null)

          return (
            <div key={personIndex} className="rounded-2xl border p-3" style={{ borderColor: 'var(--border-base)', background: 'var(--bg-surface)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  نفر {String(personIndex + 1).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])}
                  {personIndex === 0 && <span className="mr-1 text-[10px]" style={{ color: 'var(--text-faint)' }}>(پرداخت‌کننده)</span>}
                </span>
                {persons.length > 1 && (
                  <button type="button" onClick={() => removePerson(personIndex)}
                    className="text-[11px] px-2 py-0.5 rounded-lg transition-colors"
                    style={{ color: 'var(--text-faint)', border: '1px solid var(--border-base)' }}>
                    حذف
                  </button>
                )}
              </div>

              {/* Tier service grid */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                {tierServices.map((svc, i) => {
                  const selected = person.serviceId === svc.id
                  const tierColor = svc.color ? TIER_COLORS[svc.color] ?? '#C6A55B' : '#C6A55B'
                  return (
                    <motion.div key={svc.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <button type="button" className="w-full text-right h-full" onClick={() => selectService(personIndex, svc)}>
                        <GlassCard gold={selected}
                          className={`flex flex-col items-center gap-1.5 p-2.5 cursor-pointer transition-all h-full ${selected ? 'shadow-[0_0_0_2px_#C6A55B,0_8px_32px_rgba(198,165,91,0.3)]' : ''}`}>
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[rgba(198,165,91,0.08)] border border-[rgba(198,165,91,0.2)]">
                            <TierIcon symbol={svc.symbol} color={svc.color} size={18} />
                          </div>
                          <div className="text-center">
                            <h3 className="text-[11px] font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                              {svc.descriptionFa}
                              {svc.tier === 3 && <span className="mr-1 text-[9px] font-medium" style={{ color: tierColor }}>VIP</span>}
                            </h3>
                            <p className="text-[10px] text-[#C6A55B] font-semibold">{svc.price.toLocaleString('fa-IR')} ت</p>
                          </div>
                        </GlassCard>
                      </button>
                    </motion.div>
                  )
                })}
              </div>

              {/* Non-tier services */}
              <div className="flex flex-col gap-1.5 mb-2">
                {otherServices.map(svc => {
                  const selected = person.serviceId === svc.id
                  return (
                    <button key={svc.id} type="button" className="w-full text-right" onClick={() => selectService(personIndex, svc)}>
                      <GlassCard gold={selected}
                        className={`flex items-center gap-2 p-2.5 cursor-pointer transition-all ${selected ? 'shadow-[0_0_0_2px_#C6A55B,0_8px_32px_rgba(198,165,91,0.3)]' : ''}`}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-[rgba(198,165,91,0.08)] border border-[rgba(198,165,91,0.2)]">
                          <TierIcon symbol={svc.symbol} color={svc.color} size={16} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{svc.nameFa}</h3>
                          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{svc.descriptionFa} — {svc.durationMinutes} دقیقه</p>
                        </div>
                        <span className="text-xs text-[#C6A55B] font-semibold">{svc.price.toLocaleString('fa-IR')} ت</span>
                      </GlassCard>
                    </button>
                  )
                })}
              </div>

              {/* Add-ons for this person */}
              {selectedService && availableAddons.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>افزودنی‌ها</p>
                  <div className="flex flex-col gap-1.5">
                    {availableAddons.map(addon => {
                      const checked = person.addonIds.includes(addon.id)
                      return (
                        <button key={addon.id} type="button" aria-pressed={checked} className="w-full text-right"
                          onClick={() => toggleAddon(personIndex, addon.id)}>
                          <GlassCard className={`flex items-center gap-2 p-2 cursor-pointer transition-all ${checked ? 'shadow-[0_0_0_1.5px_#C6A55B]' : ''}`}>
                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${checked ? 'bg-[#C6A55B] border-[#C6A55B]' : 'border-[rgba(198,165,91,0.4)]'}`}>
                              {checked && <span aria-hidden="true" className="text-black text-[9px] font-bold">✓</span>}
                            </div>
                            <span className="flex-1 text-xs" style={{ color: 'var(--text-primary)' }}>{addon.nameFa}</span>
                            <span className="text-xs text-[#C6A55B]">+{addon.price.toLocaleString('fa-IR')} ت</span>
                          </GlassCard>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add person button — only show when all current persons have a service selected */}
      {allPersonsHaveService && (
        <button type="button" onClick={addPerson}
          className="w-full mt-3 py-2.5 rounded-xl text-xs transition-all"
          style={{ color: '#C6A55B', border: '1px dashed rgba(198,165,91,0.5)', background: 'rgba(198,165,91,0.04)' }}>
          + افزودن نفر دیگر
        </button>
      )}

      {totalPrice > 0 && (
        <div className="flex justify-between text-xs mt-3 mb-3 px-1">
          <span style={{ color: 'var(--text-muted)' }}>جمع کل</span>
          <span className="font-semibold text-[#C6A55B]">{totalPrice.toLocaleString('fa-IR')} تومان</span>
        </div>
      )}

      <GoldButton className="w-full" onClick={goNext} disabled={!allPersonsHaveService}>ادامه ←</GoldButton>
    </div>
  )
}
```

- [ ] **Step 2: Manual verification**

Open booking dialog. Verify:
- Step 1 shows "نفر ۱ (پرداخت‌کننده)" with room/addon grid
- After selecting a service, "+ افزودن نفر دیگر" button appears
- Clicking it adds "نفر ۲" card
- Clicking "حذف" on نفر ۲ removes it
- Total price sums both persons

- [ ] **Step 3: Commit**

```bash
git add src/components/booking/Step1Service.tsx
git commit -m "feat: Step1 — per-person service selector with add/remove person"
```

---

## Task 6: Step 3 (Details) + Step 4 (Review + Submit)

**Files:**
- Modify: `src/components/booking/Step3Details.tsx`
- Modify: `src/components/booking/Step4Review.tsx`

**Interfaces:**
- Consumes: `WizardState.persons[]`, `MultiBookingCreateInput` from Task 2
- Produces: filled `persons[].customerName/Phone/Notes`; Step 4 POSTs `{ bookings: […] }` to `/api/bookings/create`

- [ ] **Step 1: Rewrite `src/components/booking/Step3Details.tsx`**

```typescript
'use client'
import { GoldButton } from '@/components/ui/GoldButton'
import { GhostButton } from '@/components/ui/GhostButton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { WizardState, Person } from '@/types'

type Props = { state: WizardState; update: (p: Partial<WizardState>) => void; goNext: () => void; goBack: () => void }

function toEnDigits(s: string) {
  return s
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
}

function isValidIranPhone(phone: string) {
  return /^09[0-9]{9}$/.test(phone)
}

function toFaOrdinal(n: number) {
  return String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

export function Step3Details({ state, update, goNext, goBack }: Props) {
  const persons = state.persons

  function setPerson(index: number, patch: Partial<Person>) {
    update({ persons: persons.map((p, i) => i === index ? { ...p, ...patch } : p) })
  }

  function handlePhoneChange(index: number, raw: string) {
    const normalized = toEnDigits(raw).replace(/[^0-9]/g, '')
    setPerson(index, { customerPhone: normalized })
  }

  const canProceed = persons.every((p, i) => {
    const nameOk = p.customerName.trim() !== ''
    const phoneOk = i === 0 ? isValidIranPhone(p.customerPhone) : (p.customerPhone === '' || isValidIranPhone(p.customerPhone))
    return nameOk && phoneOk
  })

  return (
    <div>
      <h2 className="text-base font-light mb-0.5" style={{ color: 'var(--text-primary)' }}>اطلاعات افراد</h2>
      <p className="text-xs mb-3 font-light" style={{ color: 'var(--text-muted)' }}>اطلاعات هر نفر را وارد کنید</p>

      <div className="flex flex-col gap-4">
        {persons.map((person, i) => {
          const phone = person.customerPhone
          const phoneTouched = phone.length > 0
          const phoneValid = isValidIranPhone(phone)
          const isPayer = i === 0

          return (
            <div key={i} className="rounded-2xl border p-3" style={{ borderColor: 'var(--border-base)', background: 'var(--bg-surface)' }}>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                نفر {toFaOrdinal(i + 1)}
                {isPayer && <span className="mr-1 text-[10px]" style={{ color: 'var(--text-faint)' }}>(پرداخت‌کننده — پیامک تأیید ارسال می‌شود)</span>}
              </p>
              <div className="flex flex-col gap-2">
                <Input
                  placeholder="نام و نام خانوادگی *"
                  value={person.customerName}
                  onChange={e => setPerson(i, { customerName: e.target.value })}
                />
                <div>
                  <Input
                    placeholder={isPayer ? 'شماره موبایل * (مثال: 09123456789)' : 'شماره موبایل (اختیاری)'}
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={e => handlePhoneChange(i, e.target.value)}
                    className={phoneTouched && !phoneValid ? 'border-destructive focus-visible:ring-destructive/30' : ''}
                  />
                  {phoneTouched && !phoneValid && (
                    <p className="text-[11px] mt-1 pr-1" style={{ color: 'var(--color-destructive, #f87171)' }}>
                      شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود
                    </p>
                  )}
                </div>
                <Textarea
                  placeholder="توضیحات (اختیاری)"
                  value={person.customerNotes}
                  onChange={e => setPerson(i, { customerNotes: e.target.value })}
                  className="h-14"
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-3 mt-4">
        <GhostButton onClick={goBack} className="flex-1">→ برگشت</GhostButton>
        <GoldButton onClick={goNext} className="flex-1" disabled={!canProceed}>ادامه ←</GoldButton>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Rewrite `src/components/booking/Step4Review.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import { GhostButton } from '@/components/ui/GhostButton'
import type { WizardState, ServiceDTO, AddonDTO } from '@/types'

type Props = { state: WizardState; goBack: () => void; services: ServiceDTO[]; addons: AddonDTO[] }

function toFaTime(t: string) {
  return t.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

export function Step4Review({ state, goBack, services, addons }: Props) {
  const [loading, setLoading] = useState(false)

  const grandTotal = state.persons.reduce((sum, person) => {
    const svc = services.find(s => s.id === person.serviceId)
    const addonSum = person.addonIds.reduce((a, id) => a + (addons.find(ad => ad.id === id)?.price ?? 0), 0)
    return sum + (svc?.price ?? 0) + addonSum
  }, 0)

  async function handlePay() {
    if (loading || !state.date || !state.startTime) return
    setLoading(true)
    try {
      const bookings = state.persons.map(person => ({
        serviceId: person.serviceId,
        customerName: person.customerName,
        customerPhone: person.customerPhone,
        customerNotes: person.customerNotes || undefined,
        date: state.date!,
        startTime: state.startTime!,
        addonIds: person.addonIds,
      }))
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookings }),
      })
      if (!res.ok) throw new Error('Booking failed')
      const { paymentUrl } = await res.json()
      window.location.href = paymentUrl
    } catch {
      setLoading(false)
      alert('خطا در ایجاد رزرو. لطفاً دوباره تلاش کنید.')
    }
  }

  return (
    <div>
      <h2 className="text-base font-light mb-0.5" style={{ color: 'var(--text-primary)' }}>مرور و پرداخت</h2>
      <p className="text-xs mb-3 font-light" style={{ color: 'var(--text-muted)' }}>اطلاعات رزرو را بررسی کنید</p>

      {/* Date/time summary */}
      <GlassCard className="p-3 mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span style={{ color: 'var(--text-muted)' }}>تاریخ</span>
          <span style={{ color: 'var(--text-primary)' }}>
            {state.date ? new Date(state.date).toLocaleDateString('fa-IR') : '—'}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span style={{ color: 'var(--text-muted)' }}>ساعت</span>
          <span style={{ color: 'var(--text-primary)' }}>
            {state.startTime ? toFaTime(state.startTime) : '—'}
          </span>
        </div>
      </GlassCard>

      {/* Per-person breakdown */}
      <div className="flex flex-col gap-2 mb-3">
        {state.persons.map((person, i) => {
          const svc = services.find(s => s.id === person.serviceId)
          const selectedAddons = addons.filter(a => person.addonIds.includes(a.id))
          const personTotal = (svc?.price ?? 0) + selectedAddons.reduce((s, a) => s + a.price, 0)
          return (
            <GlassCard key={i} className="p-3 space-y-1.5">
              <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--text-faint)' }}>
                نفر {String(i + 1).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])}
              </p>
              {([
                ['نام', person.customerName || '—'],
                ['غرفه', svc?.nameFa ?? '—'],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ color: 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}
              {selectedAddons.map(a => (
                <div key={a.id} className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>{a.nameFa}</span>
                  <span style={{ color: 'var(--text-primary)' }}>+{a.price.toLocaleString('fa-IR')} ت</span>
                </div>
              ))}
              <div className="flex justify-between text-xs font-semibold border-t border-[rgba(198,165,91,0.15)] pt-1.5">
                <span style={{ color: 'var(--text-muted)' }}>جمع</span>
                <span className="text-[#C6A55B]">{personTotal.toLocaleString('fa-IR')} ت</span>
              </div>
            </GlassCard>
          )
        })}
      </div>

      {/* Grand total */}
      <div className="flex justify-between text-sm font-semibold px-1 mb-4">
        <span style={{ color: 'var(--text-primary)' }}>جمع کل</span>
        <span className="text-[#C6A55B]">{grandTotal.toLocaleString('fa-IR')} تومان</span>
      </div>

      <div className="flex gap-3">
        <GhostButton onClick={goBack} className="flex-1">→ برگشت</GhostButton>
        <GoldButton onClick={handlePay} className="flex-1" disabled={loading}>
          {loading ? 'در حال انتقال...' : '← پرداخت با زرین‌پال'}
        </GoldButton>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Manual verification**

Navigate to Step 3 with 2 persons. Verify:
- Card for each person with correct label
- Person 1 phone is required; person 2 phone is optional
- Step 4 shows per-person breakdown with individual totals and grand total

- [ ] **Step 4: Commit**

```bash
git add src/components/booking/Step3Details.tsx src/components/booking/Step4Review.tsx
git commit -m "feat: Step3 per-person details; Step4 per-person review with grand total"
```

---

## Task 7: Backend — Create API (multi-booking, groupToken, one payment)

**Files:**
- Modify: `src/app/api/bookings/create/route.ts`

**Interfaces:**
- Consumes: `{ bookings: BookingCreateInput[] }` POST body
- Produces: `{ paymentUrl: string }` — same as before; groupToken stored on all bookings

- [ ] **Step 1: Rewrite `src/app/api/bookings/create/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { zarinpalRequest } from '@/lib/zarinpal'
import { BookingStatus } from '@prisma/client'
import { randomUUID } from 'crypto'
import type { BookingCreateInput } from '@/types'

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
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

  // Validate each booking entry
  for (const b of bookings) {
    if (!b.serviceId || !b.customerName || !b.customerPhone || !b.date || !b.startTime) {
      return NextResponse.json({ error: 'Missing required fields in one or more bookings' }, { status: 400 })
    }
    if (b.addonIds !== undefined && !Array.isArray(b.addonIds)) {
      return NextResponse.json({ error: 'addonIds must be an array' }, { status: 400 })
    }
  }

  // Fetch all services referenced
  const serviceIds = [...new Set(bookings.map(b => b.serviceId))]
  const services = await prisma.service.findMany({ where: { id: { in: serviceIds }, isActive: true } })
  if (services.length !== serviceIds.length) {
    return NextResponse.json({ error: 'One or more services not found or inactive' }, { status: 404 })
  }
  const serviceMap = new Map(services.map(s => [s.id, s]))

  // Fetch and validate all add-ons across all bookings
  const allAddonIds = [...new Set(bookings.flatMap(b => b.addonIds ?? []))]
  const fetchedAddons = allAddonIds.length > 0
    ? await prisma.addon.findMany({ where: { id: { in: allAddonIds }, isActive: true }, select: { id: true, price: true, requiresTier: true } })
    : []
  if (fetchedAddons.length !== allAddonIds.length) {
    return NextResponse.json({ error: 'One or more add-ons are invalid' }, { status: 400 })
  }
  const addonMap = new Map(fetchedAddons.map(a => [a.id, a]))

  // Validate tier restriction per booking
  for (const b of bookings) {
    const svc = serviceMap.get(b.serviceId)!
    const addonIds = [...new Set(b.addonIds ?? [])]
    if (svc.tier === null && addonIds.some(id => addonMap.get(id)?.requiresTier)) {
      return NextResponse.json({ error: 'A tier-restricted add-on was selected for a non-tier service' }, { status: 400 })
    }
  }

  // Compute totals
  const groupToken = randomUUID()
  const [year, month, day] = bookings[0].date.split('-').map(Number)
  const bookingDate = new Date(Date.UTC(year, month - 1, day))

  const bookingData = bookings.map(b => {
    const svc = serviceMap.get(b.serviceId)!
    const addonIds = [...new Set(b.addonIds ?? [])]
    const selectedAddons = addonIds.map(id => addonMap.get(id)!)
    const addonsPricePaid = selectedAddons.reduce((s, a) => s + a.price, 0)
    const endTime = addMinutesToTime(b.startTime, svc.durationMinutes)
    return { b, svc, selectedAddons, addonsPricePaid, endTime }
  })

  const totalPrice = bookingData.reduce((s, { svc, addonsPricePaid }) => s + svc.price + addonsPricePaid, 0)
  const payerPhone = bookings[0].customerPhone
  const firstServiceName = serviceMap.get(bookings[0].serviceId)!.nameFa
  const paymentDescription = bookings.length === 1
    ? `رزرو ${firstServiceName} — نخلسپا`
    : `رزرو گروهی ${bookings.length} غرفه — نخلسپا`

  // Create all bookings in a transaction
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
    // Store authority only on the first booking — verify route finds group via it
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

- [ ] **Step 2: Manual verification**

Use browser DevTools or a REST client to POST to `/api/bookings/create`:

```json
{
  "bookings": [
    { "serviceId": "<nasim-id>", "customerName": "علی", "customerPhone": "09121234567", "date": "<tomorrow>", "startTime": "10:00", "addonIds": [] },
    { "serviceId": "<aftab-id>", "customerName": "مریم", "customerPhone": "09351234568", "date": "<tomorrow>", "startTime": "10:00", "addonIds": [] }
  ]
}
```

Expected: `{ "paymentUrl": "https://..." }` returned. Check DB — two bookings exist with same `groupToken`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/bookings/create/route.ts
git commit -m "feat: create API accepts multi-booking array, groupToken, single Zarinpal payment"
```

---

## Task 8: Backend — Verify API (group update + SMS to payer)

**Files:**
- Modify: `src/app/api/bookings/verify/route.ts`

**Interfaces:**
- Consumes: `booking.groupToken` from Task 1; payer booking has `zarinpalAuthority`
- Produces: all group bookings set to PAID; SMS sent to payer only; redirect to payer's confirm token

- [ ] **Step 1: Rewrite `src/app/api/bookings/verify/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { zarinpalVerify } from '@/lib/zarinpal'
import { smsQueue } from '@/lib/queue'
import { sendConfirmSms, sendAdminSms } from '@/lib/smsir'
import { BookingStatus } from '@prisma/client'

export async function GET(req: NextRequest) {
  const authority = req.nextUrl.searchParams.get('Authority')
  const status = req.nextUrl.searchParams.get('Status')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

  if (status !== 'OK' || !authority) {
    return NextResponse.redirect(`${siteUrl}/booking/failed`)
  }

  // Payer booking carries the zarinpalAuthority
  const payerBooking = await prisma.booking.findFirst({
    where: { zarinpalAuthority: authority },
    include: { service: true },
  })
  if (!payerBooking) return NextResponse.redirect(`${siteUrl}/booking/failed`)

  if (payerBooking.status === BookingStatus.PAID) {
    return NextResponse.redirect(`${siteUrl}/booking/confirm/${payerBooking.token}`)
  }

  if (payerBooking.status !== BookingStatus.PENDING_PAYMENT) {
    return NextResponse.redirect(`${siteUrl}/booking/failed`)
  }

  // Atomic guard: only one concurrent callback wins
  const updated = await prisma.booking.updateMany({
    where: { id: payerBooking.id, status: BookingStatus.PENDING_PAYMENT },
    data: { status: BookingStatus.PAID },
  })
  if (updated.count === 0) {
    return NextResponse.redirect(`${siteUrl}/booking/confirm/${payerBooking.token}`)
  }

  try {
    // Total price = sum of all bookings in the group
    const groupToken = payerBooking.groupToken
    const allGroupBookings = groupToken
      ? await prisma.booking.findMany({ where: { groupToken } })
      : [payerBooking]

    const totalPrice = allGroupBookings.reduce(
      (s, b) => s + b.addonsPricePaid,
      0
    ) + await (async () => {
      const svcIds = [...new Set(allGroupBookings.map(b => b.serviceId))]
      const svcs = await prisma.service.findMany({ where: { id: { in: svcIds } }, select: { id: true, price: true } })
      const svcMap = new Map(svcs.map(s => [s.id, s.price]))
      return allGroupBookings.reduce((s, b) => s + (svcMap.get(b.serviceId) ?? 0), 0)
    })()

    const { refId } = await zarinpalVerify(authority, totalPrice)

    // Mark all group bookings PAID and store refId on payer
    await prisma.$transaction([
      prisma.booking.updateMany({
        where: { groupToken: groupToken ?? payerBooking.id },
        data: { status: BookingStatus.PAID },
      }),
      prisma.booking.update({
        where: { id: payerBooking.id },
        data: { zarinpalRefId: refId },
      }),
    ])

    // Schedule SMS reminders for payer only
    const [h, m] = payerBooking.startTime.split(':').map(Number)
    const appointmentMs = payerBooking.date.getTime() + (h * 60 + m) * 60 * 1000
    const delay24h = Math.max(0, appointmentMs - 24 * 60 * 60 * 1000 - Date.now())
    const delay2h = Math.max(0, appointmentMs - 2 * 60 * 60 * 1000 - Date.now())

    const [reminder24, reminder2] = await prisma.$transaction([
      prisma.smsReminder.create({ data: { bookingId: payerBooking.id, sendAt: new Date(appointmentMs - 24 * 60 * 60 * 1000) } }),
      prisma.smsReminder.create({ data: { bookingId: payerBooking.id, sendAt: new Date(appointmentMs - 2 * 60 * 60 * 1000) } }),
    ])

    const dateFa = payerBooking.date.toLocaleDateString('fa-IR')
    const reminderParams = { name: payerBooking.customerName, service: payerBooking.service.nameFa, time: payerBooking.startTime }

    await Promise.all([
      smsQueue.add('reminder-24h', { reminderId: reminder24.id, phone: payerBooking.customerPhone, template: 'reminder24h', params: reminderParams }, { delay: delay24h }),
      smsQueue.add('reminder-2h',  { reminderId: reminder2.id,  phone: payerBooking.customerPhone, template: 'reminder2h',  params: reminderParams }, { delay: delay2h }),
      sendConfirmSms(payerBooking.customerPhone, { name: payerBooking.customerName, service: payerBooking.service.nameFa, date: dateFa, time: payerBooking.startTime, refId: String(refId) }),
      sendAdminSms(process.env.ADMIN_PHONE!, { name: payerBooking.customerName, service: payerBooking.service.nameFa, date: dateFa, time: payerBooking.startTime, phone: payerBooking.customerPhone }),
    ])

    return NextResponse.redirect(`${siteUrl}/booking/confirm/${payerBooking.token}`)
  } catch (err) {
    console.error('Booking verify error', err)
    await prisma.booking.update({
      where: { id: payerBooking.id },
      data: { status: BookingStatus.PENDING_PAYMENT },
    }).catch(() => {})
    return NextResponse.redirect(`${siteUrl}/booking/failed`)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/bookings/verify/route.ts
git commit -m "feat: verify API updates all group bookings to PAID, SMS to payer only"
```

---

## Task 9: Confirm Page — Group Booking Summary

**Files:**
- Modify: `src/app/booking/confirm/[token]/page.tsx`

**Interfaces:**
- Consumes: `booking.groupToken`; fetches all group bookings

- [ ] **Step 1: Rewrite `src/app/booking/confirm/[token]/page.tsx`**

```typescript
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AmbientBackground } from '@/components/ui/AmbientBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { ConfirmCheckmark } from '@/components/booking/ConfirmCheckmark'
import { GoldButton } from '@/components/ui/GoldButton'
import { BookingStatus } from '@prisma/client'
import Link from 'next/link'

function toFaTime(t: string) {
  return t.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

export default async function ConfirmPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const booking = await prisma.booking.findUnique({
    where: { token },
    include: { service: true },
  })
  if (!booking || (booking.status !== BookingStatus.PAID && booking.status !== BookingStatus.CONFIRMED)) notFound()

  // Fetch all bookings in the group (or just this one if solo / legacy)
  const groupBookings = booking.groupToken
    ? await prisma.booking.findMany({
        where: { groupToken: booking.groupToken },
        include: { service: true },
        orderBy: { createdAt: 'asc' },
      })
    : [booking]

  const dateFa = new Date(booking.date.toISOString().split('T')[0] + 'T12:00:00').toLocaleDateString('fa-IR')
  const isGroup = groupBookings.length > 1

  return (
    <>
      <AmbientBackground />
      <div className="relative z-10 max-w-lg mx-auto min-h-screen flex flex-col items-center justify-center px-6">
        <ConfirmCheckmark />
        <h1 className="text-2xl font-light text-[#F3EFE8] mt-6 mb-2">رزرو تأیید شد</h1>
        <p className="text-xs text-[#F3EFE8]/40 mb-8 text-center font-light">رسید پرداخت از طریق SMS ارسال شد</p>

        {/* Shared date/time */}
        <GlassCard className="w-full p-4 mb-4 space-y-2">
          {([
            ['تاریخ', dateFa],
            ['ساعت', toFaTime(booking.startTime)],
            ['کد پیگیری', booking.zarinpalRefId ?? '—'],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span className="text-[#F3EFE8]/40 text-xs">{label}</span>
              <span className="text-[#F3EFE8] text-xs font-medium">{value}</span>
            </div>
          ))}
        </GlassCard>

        {/* Per-person room breakdown */}
        {isGroup ? (
          <div className="w-full flex flex-col gap-2 mb-8">
            {groupBookings.map((b, i) => (
              <GlassCard key={b.id} className="p-3 space-y-1.5">
                <p className="text-[10px] font-medium" style={{ color: 'rgba(243,239,232,0.4)' }}>
                  نفر {String(i + 1).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])}
                </p>
                {([
                  ['نام', b.customerName],
                  ['غرفه', b.service.nameFa],
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-[#F3EFE8]/40 text-xs">{label}</span>
                    <span className="text-[#F3EFE8] text-xs font-medium">{value}</span>
                  </div>
                ))}
              </GlassCard>
            ))}
          </div>
        ) : (
          <GlassCard className="w-full p-4 mb-8 space-y-2">
            {([
              ['خدمت', booking.service.nameFa],
              ['نام', booking.customerName],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-[#F3EFE8]/40 text-xs">{label}</span>
                <span className="text-[#F3EFE8] text-xs font-medium">{value}</span>
              </div>
            ))}
          </GlassCard>
        )}

        <Link href="/" className="w-full">
          <GoldButton className="w-full py-4">بازگشت به خانه</GoldButton>
        </Link>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Manual verification**

After a successful (sandbox) payment with 2 persons, confirm page should show:
- Shared date, time, and tracking code
- Two GlassCards — one per person with their name and room

- [ ] **Step 3: Commit**

```bash
git add src/app/booking/confirm/[token]/page.tsx
git commit -m "feat: confirm page shows per-person room breakdown for group bookings"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Slot logic: per-room availability, not global block | Task 3 |
| `availableCount` on SlotDTO | Tasks 2, 3 |
| Slot API `count` param | Task 3 |
| Step 2: room count badge on pills | Task 4 |
| Step 1: per-person service selector | Task 5 |
| Add/remove person button | Task 5 |
| Step 3: per-person forms, payer vs friend | Task 6 |
| Step 4: per-person breakdown, grand total | Task 6 |
| `groupToken` schema field | Task 1 |
| Create API: array of bookings, transaction, groupToken | Task 7 |
| Single Zarinpal payment for group | Task 7 |
| Verify API: all group bookings → PAID | Task 8 |
| SMS only to payer | Task 8 |
| Confirm page: group summary | Task 9 |
| Consultation service excluded from room count | Task 3 (`tier: { not: null }`) |
| Blocked slots still block whole spa | Task 3 |

All requirements covered. No placeholders found. Type names are consistent across all tasks (`WizardState`, `Person`, `SlotDTO.availableCount`, `MultiBookingCreateInput`, `groupToken`).
