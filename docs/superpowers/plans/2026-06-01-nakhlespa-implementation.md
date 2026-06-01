# نخلسپا Spa Booking Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Persian-language spa booking website with liquid glass UI, multi-step booking wizard, Zarinpal payment, SMS.ir notifications, and a protected admin panel — self-hosted on a VPS with Supabase + Next.js 15.

**Architecture:** Next.js 15 App Router handles both frontend and API routes. Prisma connects directly to Supabase's PostgreSQL. A node-cron job embedded in the server process fires SMS reminders every 15 minutes. Nginx proxies all traffic; PM2 keeps the Node process alive.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Framer Motion, Prisma, Supabase (self-hosted), Zarinpal API, SMS.ir API, node-cron, Nginx, PM2, Vazirmatn font, date-fns-jalali

---

## File Map

```
nakhlespa/
├── prisma/
│   └── schema.prisma                        # DB schema
├── src/
│   ├── app/
│   │   ├── layout.tsx                       # Root layout, RTL, font
│   │   ├── page.tsx                         # Homepage
│   │   ├── book/
│   │   │   └── page.tsx                     # Booking wizard
│   │   ├── booking/
│   │   │   ├── confirm/[token]/page.tsx     # Payment confirmation
│   │   │   └── failed/page.tsx             # Payment failure
│   │   ├── admin/
│   │   │   ├── layout.tsx                   # Admin auth guard layout
│   │   │   ├── page.tsx                     # Admin login
│   │   │   ├── dashboard/page.tsx           # Dashboard
│   │   │   ├── bookings/
│   │   │   │   ├── page.tsx                 # Bookings list
│   │   │   │   └── [id]/page.tsx            # Booking detail
│   │   │   └── schedule/page.tsx            # Working hours + blocks
│   │   └── api/
│   │       ├── services/route.ts            # GET /api/services
│   │       ├── slots/route.ts               # GET /api/slots
│   │       ├── bookings/
│   │       │   ├── create/route.ts          # POST /api/bookings/create
│   │       │   └── verify/route.ts          # GET /api/bookings/verify
│   │       └── admin/
│   │           ├── bookings/
│   │           │   ├── route.ts             # GET /api/admin/bookings
│   │           │   └── [id]/route.ts        # PATCH /api/admin/bookings/[id]
│   │           └── schedule/
│   │               ├── route.ts             # GET /api/admin/schedule
│   │               ├── block/route.ts       # POST /api/admin/schedule/block
│   │               ├── block/[id]/route.ts  # DELETE
│   │               └── hours/route.ts       # PUT /api/admin/schedule/hours
│   ├── components/
│   │   ├── ui/
│   │   │   ├── GlassCard.tsx               # Reusable liquid glass panel
│   │   │   ├── GoldButton.tsx              # Primary CTA button
│   │   │   ├── GhostButton.tsx             # Secondary glass button
│   │   │   ├── AmbientBackground.tsx       # Animated orbs + noise
│   │   │   ├── Navbar.tsx                  # Sticky frosted nav
│   │   │   └── Footer.tsx
│   │   ├── home/
│   │   │   ├── HeroSection.tsx
│   │   │   ├── ServicesSection.tsx
│   │   │   ├── HowItWorksSection.tsx
│   │   │   └── BookingCtaSection.tsx
│   │   ├── booking/
│   │   │   ├── BookingWizard.tsx           # Wizard shell + step state
│   │   │   ├── StepProgress.tsx            # Animated progress bar
│   │   │   ├── Step1Service.tsx
│   │   │   ├── Step2DateTime.tsx
│   │   │   ├── Step3Details.tsx
│   │   │   └── Step4Review.tsx
│   │   └── admin/
│   │       ├── AdminSidebar.tsx
│   │       ├── BookingTable.tsx
│   │       ├── BookingDetail.tsx
│   │       └── ScheduleManager.tsx
│   ├── lib/
│   │   ├── prisma.ts                       # Prisma singleton
│   │   ├── supabase.ts                     # Supabase client (auth)
│   │   ├── zarinpal.ts                     # Zarinpal request/verify helpers
│   │   ├── smsir.ts                        # SMS.ir send helper
│   │   ├── slots.ts                        # Slot generation logic
│   │   └── cron.ts                         # node-cron reminder job
│   ├── types/
│   │   └── index.ts                        # Shared TS types
│   └── middleware.ts                        # Admin route auth guard
├── public/
│   └── fonts/                              # Vazirmatn woff2 files
├── .env.local
├── next.config.ts
├── tailwind.config.ts
└── ecosystem.config.js                     # PM2 config
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `.env.local`, `src/app/layout.tsx`

- [ ] **Step 1: Init Next.js project**

```bash
cd /path/to/nakhlespa
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --no-eslint
```

- [ ] **Step 2: Install dependencies**

```bash
npm install framer-motion prisma @prisma/client @supabase/supabase-js \
  date-fns date-fns-jalali react-day-picker node-cron axios \
  @types/node-cron
```

- [ ] **Step 3: Configure next.config.ts**

```ts
// next.config.ts
import type { NextConfig } from 'next'

const config: NextConfig = {
  experimental: { serverActions: { allowedOrigins: ['localhost:3000'] } },
}

export default config
```

- [ ] **Step 4: Configure tailwind.config.ts**

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'green-deep':  '#0F3D2E',
        'green-mid':   '#1F5E46',
        'green-soft':  '#4F6F52',
        'gold':        '#C6A55B',
        'gold-mid':    '#A8873A',
        'gold-dark':   '#8C6A2F',
        'brown-deep':  '#3B2416',
        'brown-mid':   '#4A2F1E',
        'cream':       '#F3EFE8',
        'sage':        '#6E7F6A',
      },
      fontFamily: {
        vazir: ['Vazirmatn', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 5: Set up root layout with RTL + Vazirmatn font**

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next'
import { Vazirmatn } from 'next/font/google'
import './globals.css'

const vazir = Vazirmatn({ subsets: ['arabic'], variable: '--font-vazir', display: 'swap' })

export const metadata: Metadata = {
  title: 'نخلسپا — رزرو آنلاین ماساژ',
  description: 'رزرو آنلاین خدمات ماساژ درمانی و آرامش‌بخش نخلسپا',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={vazir.variable}>
      <body className="font-vazir bg-[#04100b] text-cream antialiased">{children}</body>
    </html>
  )
}
```

- [ ] **Step 6: Create globals.css with glass utilities**

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .glass {
    background: rgba(255, 255, 255, 0.07);
    backdrop-filter: blur(40px) saturate(200%) brightness(1.05);
    -webkit-backdrop-filter: blur(40px) saturate(200%) brightness(1.05);
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.30),
      inset 0 -1px 0 rgba(255, 255, 255, 0.06),
      0 8px 32px rgba(0, 0, 0, 0.35);
  }

  .glass-gold {
    background: rgba(198, 165, 91, 0.10);
    backdrop-filter: blur(40px) saturate(220%) brightness(1.08);
    -webkit-backdrop-filter: blur(40px) saturate(220%) brightness(1.08);
    border: 1px solid rgba(198, 165, 91, 0.28);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.28),
      inset 0 -1px 0 rgba(198, 165, 91, 0.08),
      0 8px 40px rgba(198, 165, 91, 0.18),
      0 2px 8px rgba(0, 0, 0, 0.3);
  }
}
```

- [ ] **Step 7: Create .env.local**

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres
SUPABASE_URL=http://localhost:8000
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ZARINPAL_MERCHANT_ID=your_merchant_id
ZARINPAL_CALLBACK_URL=https://nakhlespa.ir/api/bookings/verify
SMSIR_API_KEY=your_api_key
SMSIR_LINE_NUMBER=your_line_number
ADMIN_PHONE=+98xxxxxxxxxx
NEXT_PUBLIC_SITE_URL=https://nakhlespa.ir
ADMIN_EMAIL=admin@nakhlespa.ir
```

- [ ] **Step 8: Verify dev server starts**

```bash
npm run dev
```
Expected: server running at http://localhost:3000 with default Next.js page.

- [ ] **Step 9: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Next.js 15 project with RTL layout and glass design system"
```

---

## Task 2: Database Schema + Prisma

**Files:**
- Create: `prisma/schema.prisma`, `src/lib/prisma.ts`, `prisma/seed.ts`

- [ ] **Step 1: Init Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 2: Write schema**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Service {
  id              String    @id @default(uuid())
  nameFa          String
  descriptionFa   String?
  durationMinutes Int
  price           Int
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  bookings        Booking[]

  @@map("services")
}

model WorkingHours {
  id          String   @id @default(uuid())
  dayOfWeek   Int
  openTime    String
  closeTime   String
  isOpen      Boolean  @default(true)
  createdAt   DateTime @default(now())

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
  status             BookingStatus @default(PENDING_PAYMENT)
  zarinpalAuthority  String?
  zarinpalRefId      String?
  createdAt          DateTime      @default(now())
  smsReminders       SmsReminder[]

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

  @@map("sms_reminders")
}

enum SmsReminderStatus {
  PENDING
  SENT
  FAILED
}
```

- [ ] **Step 3: Run migration**

```bash
npx prisma migrate dev --name init
```
Expected: Migration created and applied. Tables visible in Supabase Studio.

- [ ] **Step 4: Create Prisma singleton**

```ts
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 5: Create seed file**

```ts
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.service.createMany({
    data: [
      { nameFa: 'ماساژ درمانی', descriptionFa: 'Swedish · Deep Tissue · Sports', durationMinutes: 60, price: 350000 },
      { nameFa: 'ماساژ آرامش‌بخش', descriptionFa: 'Aromatherapy · Hot Stone · Luxury', durationMinutes: 90, price: 450000 },
    ],
  })

  // Saturday=0 to Friday=6, open 9am–9pm every day
  await prisma.workingHours.createMany({
    data: Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      openTime: '09:00',
      closeTime: '21:00',
      isOpen: true,
    })),
  })
}

main().finally(() => prisma.$disconnect())
```

- [ ] **Step 6: Add seed script to package.json**

Add to `package.json`:
```json
"prisma": { "seed": "ts-node prisma/seed.ts" }
```

Install ts-node:
```bash
npm install -D ts-node
```

- [ ] **Step 7: Run seed**

```bash
npx prisma db seed
```
Expected: Services and working hours rows inserted.

- [ ] **Step 8: Commit**

```bash
git add prisma/ src/lib/prisma.ts package.json
git commit -m "feat: prisma schema, migration, and seed data"
```

---

## Task 3: Shared Types + Lib Helpers

**Files:**
- Create: `src/types/index.ts`, `src/lib/zarinpal.ts`, `src/lib/smsir.ts`, `src/lib/slots.ts`, `src/lib/supabase.ts`

- [ ] **Step 1: Write shared types**

```ts
// src/types/index.ts
export type ServiceDTO = {
  id: string
  nameFa: string
  descriptionFa: string | null
  durationMinutes: number
  price: number
}

export type SlotDTO = {
  startTime: string  // "HH:mm"
  endTime: string    // "HH:mm"
}

export type BookingCreateInput = {
  serviceId: string
  customerName: string
  customerPhone: string
  customerNotes?: string
  date: string        // "YYYY-MM-DD"
  startTime: string   // "HH:mm"
}

export type BookingSummary = {
  id: string
  token: string
  customerName: string
  customerPhone: string
  date: string
  startTime: string
  endTime: string
  status: string
  service: ServiceDTO
  createdAt: string
}
```

- [ ] **Step 2: Write Zarinpal helper**

```ts
// src/lib/zarinpal.ts
import axios from 'axios'

const MERCHANT = process.env.ZARINPAL_MERCHANT_ID!
const CALLBACK = process.env.ZARINPAL_CALLBACK_URL!
const BASE = 'https://api.zarinpal.com/pg/v4/payment'

export async function zarinpalRequest(amount: number, description: string, mobile: string) {
  const { data } = await axios.post(`${BASE}/request.json`, {
    merchant_id: MERCHANT,
    amount,
    description,
    callback_url: CALLBACK,
    metadata: { mobile },
  })
  if (data.data.code !== 100) throw new Error(`Zarinpal request failed: ${data.errors?.message}`)
  return {
    authority: data.data.authority as string,
    paymentUrl: `https://www.zarinpal.com/pg/StartPay/${data.data.authority}`,
  }
}

export async function zarinpalVerify(authority: string, amount: number) {
  const { data } = await axios.post(`${BASE}/verify.json`, {
    merchant_id: MERCHANT,
    amount,
    authority,
  })
  if (data.data.code !== 100 && data.data.code !== 101) {
    throw new Error(`Zarinpal verify failed: ${data.errors?.message}`)
  }
  return { refId: String(data.data.ref_id) }
}
```

- [ ] **Step 3: Write SMS.ir helper**

```ts
// src/lib/smsir.ts
import axios from 'axios'

const API_KEY = process.env.SMSIR_API_KEY!
const LINE = process.env.SMSIR_LINE_NUMBER!

export async function sendSms(mobile: string, message: string) {
  await axios.post(
    'https://api.sms.ir/v1/send/bulk',
    { lineNumber: LINE, messageTexts: [message], mobiles: [mobile] },
    { headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' } }
  )
}
```

- [ ] **Step 4: Write slot generation logic**

```ts
// src/lib/slots.ts
import { prisma } from '@/lib/prisma'

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

export async function getAvailableSlots(date: string, durationMinutes: number): Promise<{ startTime: string; endTime: string }[]> {
  // date: "YYYY-MM-DD"
  const jsDate = new Date(date)
  // Iranian week: Saturday=0 ... Friday=6
  // JS getDay: Sunday=0, Monday=1 ... Saturday=6
  const jsDayMap: Record<number, number> = { 6: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 }
  const dayOfWeek = jsDayMap[jsDate.getDay()]

  const workingDay = await prisma.workingHours.findFirst({ where: { dayOfWeek, isOpen: true } })
  if (!workingDay) return []

  const open = timeToMinutes(workingDay.openTime)
  const close = timeToMinutes(workingDay.closeTime)

  // Existing bookings that day
  const existingBookings = await prisma.booking.findMany({
    where: { date: new Date(date), status: { not: 'CANCELLED' } },
    select: { startTime: true, endTime: true },
  })

  // Blocked slots that day
  const blocked = await prisma.blockedSlot.findMany({
    where: { date: new Date(date) },
    select: { startTime: true, endTime: true },
  })

  const busyRanges = [...existingBookings, ...blocked].map(b => ({
    start: timeToMinutes(b.startTime),
    end: timeToMinutes(b.endTime),
  }))

  const slots: { startTime: string; endTime: string }[] = []
  let cursor = open
  while (cursor + durationMinutes <= close) {
    const slotEnd = cursor + durationMinutes
    const conflict = busyRanges.some(r => cursor < r.end && slotEnd > r.start)
    if (!conflict) slots.push({ startTime: minutesToTime(cursor), endTime: minutesToTime(slotEnd) })
    cursor += 30 // 30-minute increments
  }
  return slots
}
```

- [ ] **Step 5: Write Supabase client for auth**

```ts
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

- [ ] **Step 6: Commit**

```bash
git add src/types/ src/lib/
git commit -m "feat: shared types, zarinpal, smsir, slots, supabase helpers"
```

---

## Task 4: API Routes

**Files:**
- Create: all files under `src/app/api/`

- [ ] **Step 1: GET /api/services**

```ts
// src/app/api/services/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const services = await prisma.service.findMany({ where: { isActive: true } })
  return NextResponse.json(services)
}
```

- [ ] **Step 2: GET /api/slots**

```ts
// src/app/api/slots/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAvailableSlots } from '@/lib/slots'

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  const serviceId = req.nextUrl.searchParams.get('serviceId')
  if (!date || !serviceId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const service = await prisma.service.findUnique({ where: { id: serviceId } })
  if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 })

  const slots = await getAvailableSlots(date, service.durationMinutes)
  return NextResponse.json(slots)
}
```

- [ ] **Step 3: POST /api/bookings/create**

```ts
// src/app/api/bookings/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { zarinpalRequest } from '@/lib/zarinpal'
import type { BookingCreateInput } from '@/types'

export async function POST(req: NextRequest) {
  const body: BookingCreateInput = await req.json()
  const service = await prisma.service.findUnique({ where: { id: body.serviceId } })
  if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 })

  const booking = await prisma.booking.create({
    data: {
      serviceId: body.serviceId,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerNotes: body.customerNotes,
      date: new Date(body.date),
      startTime: body.startTime,
      endTime: body.endTime ?? body.startTime, // endTime computed by client from slot
      status: 'PENDING_PAYMENT',
    },
  })

  const { authority, paymentUrl } = await zarinpalRequest(
    service.price,
    `رزرو ${service.nameFa} — نخلسپا`,
    body.customerPhone
  )

  await prisma.booking.update({ where: { id: booking.id }, data: { zarinpalAuthority: authority } })

  return NextResponse.json({ paymentUrl })
}
```

- [ ] **Step 4: GET /api/bookings/verify (Zarinpal callback)**

```ts
// src/app/api/bookings/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { zarinpalVerify } from '@/lib/zarinpal'
import { sendSms } from '@/lib/smsir'

export async function GET(req: NextRequest) {
  const authority = req.nextUrl.searchParams.get('Authority')
  const status = req.nextUrl.searchParams.get('Status')
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

  if (status !== 'OK' || !authority) {
    return NextResponse.redirect(`${siteUrl}/booking/failed`)
  }

  const booking = await prisma.booking.findFirst({
    where: { zarinpalAuthority: authority },
    include: { service: true },
  })
  if (!booking) return NextResponse.redirect(`${siteUrl}/booking/failed`)

  try {
    const { refId } = await zarinpalVerify(authority, booking.service.price)

    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'PAID', zarinpalRefId: refId },
    })

    // Schedule reminders
    const appointmentDate = new Date(booking.date)
    const [h, m] = booking.startTime.split(':').map(Number)
    appointmentDate.setHours(h, m, 0, 0)
    await prisma.smsReminder.createMany({
      data: [
        { bookingId: booking.id, sendAt: new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000) },
        { bookingId: booking.id, sendAt: new Date(appointmentDate.getTime() - 2 * 60 * 60 * 1000) },
      ],
    })

    // Confirmation SMS to customer
    await sendSms(
      booking.customerPhone,
      `${booking.customerName} عزیز، رزرو شما برای ${booking.service.nameFa} در تاریخ ${booking.date.toLocaleDateString('fa-IR')} ساعت ${booking.startTime} تأیید شد. کد پیگیری: ${refId} — نخلسپا`
    )
    // Notification SMS to admin
    await sendSms(
      process.env.ADMIN_PHONE!,
      `رزرو جدید: ${booking.customerName} — ${booking.service.nameFa} — ${booking.date.toLocaleDateString('fa-IR')} ${booking.startTime} — تلفن: ${booking.customerPhone}`
    )

    return NextResponse.redirect(`${siteUrl}/booking/confirm/${booking.token}`)
  } catch {
    return NextResponse.redirect(`${siteUrl}/booking/failed`)
  }
}
```

- [ ] **Step 5: Admin booking routes**

```ts
// src/app/api/admin/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status')
  const bookings = await prisma.booking.findMany({
    where: status ? { status: status as any } : undefined,
    include: { service: true },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(bookings)
}
```

```ts
// src/app/api/admin/bookings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { status } = await req.json()
  const booking = await prisma.booking.update({ where: { id: params.id }, data: { status } })
  return NextResponse.json(booking)
}
```

- [ ] **Step 6: Admin schedule routes**

```ts
// src/app/api/admin/schedule/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const [hours, blocks] = await Promise.all([
    prisma.workingHours.findMany({ orderBy: { dayOfWeek: 'asc' } }),
    prisma.blockedSlot.findMany({ orderBy: { date: 'asc' } }),
  ])
  return NextResponse.json({ hours, blocks })
}
```

```ts
// src/app/api/admin/schedule/block/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { date, startTime, endTime, reason } = await req.json()
  const block = await prisma.blockedSlot.create({ data: { date: new Date(date), startTime, endTime, reason } })
  return NextResponse.json(block)
}
```

```ts
// src/app/api/admin/schedule/block/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.blockedSlot.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
```

```ts
// src/app/api/admin/schedule/hours/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest) {
  const hours: { id: string; isOpen: boolean; openTime: string; closeTime: string }[] = await req.json()
  await Promise.all(
    hours.map(h => prisma.workingHours.update({ where: { id: h.id }, data: { isOpen: h.isOpen, openTime: h.openTime, closeTime: h.closeTime } }))
  )
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 7: Commit**

```bash
git add src/app/api/
git commit -m "feat: all API routes — services, slots, bookings, payment, admin"
```

---

## Task 5: Admin Auth Middleware

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Write middleware**

```ts
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(req: NextRequest) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${req.cookies.get('sb-access-token')?.value}` } } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/admin', req.url))
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/dashboard/:path*', '/admin/bookings/:path*', '/admin/schedule/:path*', '/api/admin/:path*'],
}
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: admin route auth middleware via Supabase"
```

---

## Task 6: UI Components

**Files:**
- Create: all files under `src/components/ui/`

- [ ] **Step 1: AmbientBackground**

```tsx
// src/components/ui/AmbientBackground.tsx
'use client'
import { motion } from 'framer-motion'

const orbs = [
  { size: 500, color: '#0F3D2E', top: '-150px', right: '-100px', opacity: 0.6, duration: 20, delay: 0 },
  { size: 350, color: '#C6A55B', bottom: '-80px', left: '-60px', opacity: 0.18, duration: 25, delay: -4 },
  { size: 280, color: '#1F5E46', top: '35%', left: '20%', opacity: 0.35, duration: 18, delay: -8 },
  { size: 200, color: '#4F6F52', bottom: '25%', right: '5%', opacity: 0.28, duration: 22, delay: -10 },
  { size: 160, color: '#A8873A', top: '55%', right: '40%', opacity: 0.15, duration: 30, delay: -3 },
]

export function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 90% 70% at 15% 10%, #0F3D2E 0%, transparent 55%), radial-gradient(ellipse 70% 60% at 85% 30%, #1a4a35 0%, transparent 50%), radial-gradient(ellipse 60% 50% at 60% 80%, #3B2416 0%, transparent 50%), #04100b' }}
      />
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ width: orb.size, height: orb.size, background: orb.color, opacity: orb.opacity, filter: 'blur(100px)', ...(orb.top && { top: orb.top }), ...(orb.right && { right: orb.right }), ...(orb.bottom && { bottom: orb.bottom }), ...(orb.left && { left: orb.left }) }}
          animate={{ x: [0, 30, -20, 15, 0], y: [0, -40, 30, 15, 0], scale: [1, 1.06, 0.94, 1.03, 1] }}
          transition={{ duration: orb.duration, delay: orb.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: GlassCard**

```tsx
// src/components/ui/GlassCard.tsx
import { cn } from '@/lib/utils'

type Props = { children: React.ReactNode; className?: string; gold?: boolean }

export function GlassCard({ children, className, gold }: Props) {
  return (
    <div className={cn(gold ? 'glass-gold' : 'glass', 'rounded-2xl', className)}>
      {children}
    </div>
  )
}
```

Add utils helper:
```ts
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }
```

```bash
npm install clsx tailwind-merge
```

- [ ] **Step 3: GoldButton + GhostButton**

```tsx
// src/components/ui/GoldButton.tsx
'use client'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type Props = { children: React.ReactNode; onClick?: () => void; className?: string; type?: 'button' | 'submit' }

export function GoldButton({ children, onClick, className, type = 'button' }: Props) {
  return (
    <motion.button
      type={type}
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-green-deep cursor-pointer',
        'bg-gradient-to-br from-[#d4b368] via-gold to-[#9a7830]',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-2px_0_rgba(0,0,0,0.18),0_6px_24px_rgba(198,165,91,0.4)]',
        'transition-shadow hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_10px_36px_rgba(198,165,91,0.55)]',
        className
      )}
    >
      {children}
    </motion.button>
  )
}
```

```tsx
// src/components/ui/GhostButton.tsx
'use client'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type Props = { children: React.ReactNode; onClick?: () => void; className?: string }

export function GhostButton({ children, onClick, className }: Props) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm text-cream/80 cursor-pointer',
        'bg-white/7 border border-white/14 backdrop-blur-xl',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_4px_16px_rgba(0,0,0,0.25)]',
        'hover:bg-white/12 transition-colors',
        className
      )}
    >
      {children}
    </motion.button>
  )
}
```

- [ ] **Step 4: Navbar**

```tsx
// src/components/ui/Navbar.tsx
'use client'
import Link from 'next/link'
import { GoldButton } from './GoldButton'

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 bg-[rgba(4,16,11,0.45)] backdrop-blur-[48px] border-b border-white/8 shadow-[0_1px_0_rgba(255,255,255,0.06),0_4px_24px_rgba(0,0,0,0.4)]">
      <div className="text-lg font-bold text-cream">
        نخل<span className="text-gold">سپا</span>
      </div>
      <div className="flex gap-5">
        <Link href="#services" className="text-xs text-cream/55 hover:text-cream transition-colors">خدمات</Link>
        <Link href="#how" className="text-xs text-cream/55 hover:text-cream transition-colors">درباره ما</Link>
        <Link href="#contact" className="text-xs text-cream/55 hover:text-cream transition-colors">تماس</Link>
      </div>
      <Link href="/book">
        <GoldButton className="text-xs px-4 py-2">رزرو</GoldButton>
      </Link>
    </nav>
  )
}
```

- [ ] **Step 5: Footer**

```tsx
// src/components/ui/Footer.tsx
export function Footer() {
  return (
    <footer id="contact" className="relative z-10 border-t border-white/8 mt-16 px-6 py-10 text-center">
      <div className="text-xl font-bold text-cream mb-2">نخل<span className="text-gold">سپا</span></div>
      <p className="text-xs text-cream/40 mb-1">مرکز ماساژ و آرامش</p>
      <p className="text-xs text-cream/40">تهران — تلفن: ۰۲۱-XXXXXXXX</p>
      <p className="text-xs text-cream/20 mt-6">© ۱۴۰۴ نخلسپا. تمام حقوق محفوظ است.</p>
    </footer>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/ src/lib/utils.ts
git commit -m "feat: UI primitives — glass card, buttons, navbar, footer, ambient background"
```

---

## Task 7: Homepage

**Files:**
- Create: `src/app/page.tsx`, `src/components/home/*.tsx`

- [ ] **Step 1: HeroSection**

```tsx
// src/components/home/HeroSection.tsx
'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { GoldButton } from '@/components/ui/GoldButton'
import { GhostButton } from '@/components/ui/GhostButton'
import { GlassCard } from '@/components/ui/GlassCard'

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }

export function HeroSection() {
  return (
    <section className="px-6 pt-14 pb-8">
      <motion.div
        initial="hidden" animate="show"
        variants={{ show: { transition: { staggerChildren: 0.1 } } }}
      >
        {/* Eyebrow */}
        <motion.div variants={fadeUp} className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full text-[9px] tracking-[3.5px] text-gold bg-gold/8 border border-gold/22 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
          SPA &amp; WELLNESS
        </motion.div>

        {/* Headline */}
        <motion.h1 variants={fadeUp} className="text-4xl font-light leading-relaxed text-cream mb-4 tracking-tight">
          لحظه‌ای برای{' '}
          <span className="font-bold bg-gradient-to-r from-gold via-[#e8c87a] to-gold-mid bg-[length:200%] text-transparent bg-clip-text animate-[shimmer_4s_linear_infinite]">
            خودت
          </span>{' '}
          باش
        </motion.h1>

        <motion.p variants={fadeUp} className="text-sm font-light text-cream/50 leading-loose mb-8 max-w-xs">
          ماساژ تخصصی درمانی و آرامش‌بخش با بهترین متخصصان — در فضایی آرام و انحصاری
        </motion.p>

        <motion.div variants={fadeUp} className="flex gap-3 mb-10 flex-wrap">
          <Link href="/book"><GoldButton>← رزرو آنلاین</GoldButton></Link>
          <GhostButton>مشاهده خدمات</GhostButton>
        </motion.div>

        {/* Stats */}
        <motion.div variants={fadeUp} className="flex gap-2">
          {[['۵۰۰+', 'مشتری راضی'], ['۱۰+', 'سال تجربه'], ['۲۴/۷', 'رزرو آنلاین']].map(([num, lbl]) => (
            <GlassCard key={lbl} className="flex-1 py-3 px-2 text-center rounded-2xl">
              <div className="text-xl font-bold text-gold mb-1">{num}</div>
              <div className="text-[8px] text-cream/40 tracking-wide">{lbl}</div>
            </GlassCard>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
```

Add shimmer keyframe to globals.css:
```css
@keyframes shimmer { 0%{background-position:0%} 100%{background-position:200%} }
```

- [ ] **Step 2: ServicesSection**

```tsx
// src/components/home/ServicesSection.tsx
'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { GlassCard } from '@/components/ui/GlassCard'
import type { ServiceDTO } from '@/types'

const icons: Record<string, string> = { 'ماساژ درمانی': '💆', 'ماساژ آرامش‌بخش': '🌿' }

export function ServicesSection({ services }: { services: ServiceDTO[] }) {
  return (
    <section id="services" className="px-6 mb-8">
      <motion.p
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        className="text-[10px] tracking-[3px] text-cream/30 mb-3 font-light"
      >
        — خدمات ما
      </motion.p>
      <div className="flex flex-col gap-3">
        {services.map((svc, i) => (
          <motion.div
            key={svc.id}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            whileHover={{ x: -3, y: -1 }}
          >
            <Link href="/book">
              <GlassCard gold={i === 1} className="flex items-center gap-4 p-5 cursor-pointer relative overflow-hidden group">
                <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-2xl flex-shrink-0 bg-gold/14 border border-gold/28 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_4px_12px_rgba(198,165,91,0.15)]">
                  {icons[svc.nameFa] ?? '✦'}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-cream mb-0.5">{svc.nameFa}</h3>
                  <p className="text-[10px] text-cream/40">{svc.descriptionFa}</p>
                </div>
                <div className="text-left flex flex-col items-end gap-1">
                  <span className="text-xs text-gold font-semibold">از {svc.price.toLocaleString('fa-IR')}</span>
                  <span className="text-base text-cream/20">←</span>
                </div>
              </GlassCard>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: HowItWorksSection**

```tsx
// src/components/home/HowItWorksSection.tsx
'use client'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'

const steps = [
  { n: '۱', title: 'انتخاب خدمت', desc: 'ماساژ درمانی یا آرامش‌بخش را انتخاب کنید' },
  { n: '۲', title: 'انتخاب زمان', desc: 'تاریخ و ساعت مناسب را از تقویم شمسی انتخاب کنید' },
  { n: '۳', title: 'پرداخت آنلاین', desc: 'پرداخت امن از طریق زرین‌پال و دریافت تأییدیه SMS' },
]

export function HowItWorksSection() {
  return (
    <section id="how" className="px-6 mb-8">
      <motion.p
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        className="text-[10px] tracking-[3px] text-cream/30 mb-3 font-light"
      >
        — چطور کار می‌کند
      </motion.p>
      <div className="flex flex-col gap-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.12 }}
          >
            <GlassCard className="flex items-center gap-4 p-4">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-green-deep bg-gradient-to-br from-gold to-gold-mid flex-shrink-0 shadow-[0_4px_12px_rgba(198,165,91,0.3)]">
                {s.n}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-cream mb-0.5">{s.title}</h4>
                <p className="text-[10px] text-cream/40">{s.desc}</p>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: BookingCtaSection**

```tsx
// src/components/home/BookingCtaSection.tsx
'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'

export function BookingCtaSection() {
  return (
    <motion.section
      className="px-6 mb-8"
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <GlassCard className="p-7 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-gold/18 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-green-mid/25 blur-2xl pointer-events-none" />
        <h2 className="text-xl font-semibold text-cream mb-2 relative">آماده رزرو هستید؟</h2>
        <p className="text-xs text-cream/45 leading-loose mb-6 relative font-light">
          همین الان نوبت بگیرید — بعد از تأیید، پرداخت آنلاین از طریق زرین‌پال انجام می‌شود.
        </p>
        <Link href="/book" className="block relative">
          <GoldButton className="w-full text-sm py-4 rounded-[14px]">← رزرو نوبت آنلاین</GoldButton>
        </Link>
      </GlassCard>
    </motion.section>
  )
}
```

- [ ] **Step 5: Homepage page.tsx**

```tsx
// src/app/page.tsx
import { prisma } from '@/lib/prisma'
import { AmbientBackground } from '@/components/ui/AmbientBackground'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { HeroSection } from '@/components/home/HeroSection'
import { ServicesSection } from '@/components/home/ServicesSection'
import { HowItWorksSection } from '@/components/home/HowItWorksSection'
import { BookingCtaSection } from '@/components/home/BookingCtaSection'

export default async function HomePage() {
  const services = await prisma.service.findMany({ where: { isActive: true } })
  return (
    <>
      <AmbientBackground />
      <div className="relative z-10 max-w-lg mx-auto min-h-screen">
        <Navbar />
        <HeroSection />
        <ServicesSection services={services} />
        <HowItWorksSection />
        <BookingCtaSection />
        <Footer />
      </div>
    </>
  )
}
```

- [ ] **Step 6: Verify homepage renders**

```bash
npm run dev
```
Open http://localhost:3000 — expect ambient orbs, glassmorphism navbar, hero with gold shimmer text, service cards, how-it-works steps, CTA card.

- [ ] **Step 7: Commit**

```bash
git add src/app/page.tsx src/components/home/
git commit -m "feat: homepage with hero, services, how-it-works, CTA sections"
```

---

## Task 8: Booking Wizard

**Files:**
- Create: `src/app/book/page.tsx`, `src/components/booking/*.tsx`

- [ ] **Step 1: BookingWizard shell**

```tsx
// src/components/booking/BookingWizard.tsx
'use client'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { StepProgress } from './StepProgress'
import { Step1Service } from './Step1Service'
import { Step2DateTime } from './Step2DateTime'
import { Step3Details } from './Step3Details'
import { Step4Review } from './Step4Review'
import type { ServiceDTO, BookingCreateInput } from '@/types'

export type WizardState = Partial<BookingCreateInput> & { endTime?: string }

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

export function BookingWizard({ services }: { services: ServiceDTO[] }) {
  const [step, setStep] = useState(1)
  const [dir, setDir] = useState(1)
  const [state, setState] = useState<WizardState>({})

  function goNext() { setDir(1); setStep(s => s + 1) }
  function goBack() { setDir(-1); setStep(s => s - 1) }
  function update(patch: Partial<WizardState>) { setState(s => ({ ...s, ...patch })) }

  const stepProps = { state, update, goNext, goBack, services }

  return (
    <div className="px-5 pt-6">
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

- [ ] **Step 2: StepProgress**

```tsx
// src/components/booking/StepProgress.tsx
'use client'
import { motion } from 'framer-motion'

export function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="flex justify-between text-[9px] text-cream/30 mb-2 tracking-wider">
        <span>مرحله {current} از {total}</span>
        <span>{Math.round((current / total) * 100)}٪</span>
      </div>
      <div className="h-0.5 bg-white/8 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-l from-gold to-gold-mid rounded-full"
          animate={{ width: `${(current / total) * 100}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Step1Service**

```tsx
// src/components/booking/Step1Service.tsx
'use client'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import type { ServiceDTO } from '@/types'
import type { WizardState } from './BookingWizard'

type Props = { state: WizardState; update: (p: Partial<WizardState>) => void; goNext: () => void; services: ServiceDTO[] }
const icons: Record<string, string> = { 'ماساژ درمانی': '💆', 'ماساژ آرامش‌بخش': '🌿' }

export function Step1Service({ state, update, goNext, services }: Props) {
  return (
    <div>
      <h2 className="text-xl font-light text-cream mb-1">خدمت مورد نظر</h2>
      <p className="text-xs text-cream/40 mb-6 font-light">یک سرویس انتخاب کنید</p>
      <div className="flex flex-col gap-3 mb-8">
        {services.map((svc, i) => {
          const selected = state.serviceId === svc.id
          return (
            <motion.div key={svc.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <GlassCard
                gold={selected}
                className={`flex items-center gap-4 p-5 cursor-pointer transition-all ${selected ? 'shadow-[0_0_0_2px_#C6A55B,0_8px_32px_rgba(198,165,91,0.3)]' : ''}`}
                onClick={() => update({ serviceId: svc.id, endTime: undefined })}
              >
                <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-2xl flex-shrink-0 bg-gold/14 border border-gold/28">
                  {icons[svc.nameFa] ?? '✦'}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-cream mb-0.5">{svc.nameFa}</h3>
                  <p className="text-[10px] text-cream/40">{svc.descriptionFa} — {svc.durationMinutes} دقیقه</p>
                </div>
                <span className="text-xs text-gold font-semibold">{svc.price.toLocaleString('fa-IR')} ت</span>
              </GlassCard>
            </motion.div>
          )
        })}
      </div>
      <GoldButton className="w-full py-4" onClick={goNext} disabled={!state.serviceId}>
        ادامه ←
      </GoldButton>
    </div>
  )
}
```

- [ ] **Step 4: Step2DateTime**

```tsx
// src/components/booking/Step2DateTime.tsx
'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GoldButton } from '@/components/ui/GoldButton'
import { GhostButton } from '@/components/ui/GhostButton'
import type { WizardState } from './BookingWizard'
import type { SlotDTO } from '@/types'

type Props = { state: WizardState; update: (p: Partial<WizardState>) => void; goNext: () => void; goBack: () => void }

function toJalaliLabel(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function getDates(count = 14) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i + 1)
    return d.toISOString().split('T')[0]
  })
}

export function Step2DateTime({ state, update, goNext, goBack }: Props) {
  const [slots, setSlots] = useState<SlotDTO[]>([])
  const [loading, setLoading] = useState(false)
  const dates = getDates()

  useEffect(() => {
    if (!state.date || !state.serviceId) return
    setLoading(true)
    fetch(`/api/slots?date=${state.date}&serviceId=${state.serviceId}`)
      .then(r => r.json())
      .then((data: SlotDTO[]) => { setSlots(data); update({ startTime: undefined, endTime: undefined }) })
      .finally(() => setLoading(false))
  }, [state.date, state.serviceId])

  return (
    <div>
      <h2 className="text-xl font-light text-cream mb-1">انتخاب تاریخ</h2>
      <p className="text-xs text-cream/40 mb-5 font-light">تاریخ مورد نظر را انتخاب کنید</p>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        {dates.map(d => {
          const label = new Date(d).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })
          const selected = state.date === d
          return (
            <button key={d} onClick={() => update({ date: d })}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs transition-all ${selected ? 'bg-gold text-green-deep font-bold shadow-[0_4px_16px_rgba(198,165,91,0.4)]' : 'glass text-cream/60 hover:text-cream'}`}>
              {label}
            </button>
          )
        })}
      </div>

      {state.date && (
        <>
          <p className="text-[10px] tracking-widest text-cream/30 mb-3">— ساعت‌های موجود</p>
          {loading ? (
            <p className="text-xs text-cream/40 text-center py-8">در حال بارگذاری...</p>
          ) : slots.length === 0 ? (
            <p className="text-xs text-cream/40 text-center py-8">ظرفیتی برای این روز موجود نیست</p>
          ) : (
            <motion.div className="flex flex-wrap gap-2 mb-8"
              variants={{ show: { transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="show">
              {slots.map(slot => {
                const selected = state.startTime === slot.startTime
                return (
                  <motion.button key={slot.startTime}
                    variants={{ hidden: { opacity: 0, scale: 0.85 }, show: { opacity: 1, scale: 1 } }}
                    onClick={() => update({ startTime: slot.startTime, endTime: slot.endTime })}
                    className={`px-4 py-2 rounded-xl text-xs transition-all ${selected ? 'bg-gold text-green-deep font-bold shadow-[0_4px_16px_rgba(198,165,91,0.35)]' : 'glass text-cream/70 hover:text-cream'}`}>
                    {slot.startTime}
                  </motion.button>
                )
              })}
            </motion.div>
          )}
        </>
      )}

      <div className="flex gap-3">
        <GhostButton onClick={goBack} className="flex-1">→ برگشت</GhostButton>
        <GoldButton onClick={goNext} className="flex-1" disabled={!state.startTime}>ادامه ←</GoldButton>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Step3Details**

```tsx
// src/components/booking/Step3Details.tsx
'use client'
import { GoldButton } from '@/components/ui/GoldButton'
import { GhostButton } from '@/components/ui/GhostButton'
import type { WizardState } from './BookingWizard'

type Props = { state: WizardState; update: (p: Partial<WizardState>) => void; goNext: () => void; goBack: () => void }

const inputClass = 'w-full glass rounded-xl px-4 py-3 text-sm text-cream placeholder:text-cream/30 bg-transparent outline-none focus:ring-1 focus:ring-gold/40 transition-all'

export function Step3Details({ state, update, goNext, goBack }: Props) {
  return (
    <div>
      <h2 className="text-xl font-light text-cream mb-1">اطلاعات شما</h2>
      <p className="text-xs text-cream/40 mb-6 font-light">لطفاً اطلاعات تماس را وارد کنید</p>
      <div className="flex flex-col gap-3 mb-8">
        <input className={inputClass} placeholder="نام و نام خانوادگی *" value={state.customerName ?? ''} onChange={e => update({ customerName: e.target.value })} />
        <input className={inputClass} placeholder="شماره موبایل *" type="tel" value={state.customerPhone ?? ''} onChange={e => update({ customerPhone: e.target.value })} />
        <textarea className={`${inputClass} resize-none h-24`} placeholder="توضیحات (اختیاری)" value={state.customerNotes ?? ''} onChange={e => update({ customerNotes: e.target.value })} />
      </div>
      <div className="flex gap-3">
        <GhostButton onClick={goBack} className="flex-1">→ برگشت</GhostButton>
        <GoldButton onClick={goNext} className="flex-1" disabled={!state.customerName || !state.customerPhone}>ادامه ←</GoldButton>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Step4Review**

```tsx
// src/components/booking/Step4Review.tsx
'use client'
import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import { GhostButton } from '@/components/ui/GhostButton'
import type { WizardState } from './BookingWizard'
import type { ServiceDTO } from '@/types'

type Props = { state: WizardState; goBack: () => void; services: ServiceDTO[] }

export function Step4Review({ state, goBack, services }: Props) {
  const [loading, setLoading] = useState(false)
  const service = services.find(s => s.id === state.serviceId)

  async function handlePay() {
    setLoading(true)
    const res = await fetch('/api/bookings/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    })
    const { paymentUrl } = await res.json()
    window.location.href = paymentUrl
  }

  return (
    <div>
      <h2 className="text-xl font-light text-cream mb-1">مرور و پرداخت</h2>
      <p className="text-xs text-cream/40 mb-6 font-light">اطلاعات رزرو را بررسی کنید</p>
      <GlassCard className="p-5 mb-6 space-y-3">
        {[
          ['خدمت', service?.nameFa],
          ['تاریخ', state.date ? new Date(state.date).toLocaleDateString('fa-IR') : ''],
          ['ساعت', state.startTime],
          ['مدت', service ? `${service.durationMinutes} دقیقه` : ''],
          ['نام', state.customerName],
          ['موبایل', state.customerPhone],
          ['مبلغ قابل پرداخت', service ? `${service.price.toLocaleString('fa-IR')} تومان` : ''],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-cream/40 text-xs">{label}</span>
            <span className="text-cream font-medium text-xs">{value}</span>
          </div>
        ))}
      </GlassCard>
      <div className="flex gap-3">
        <GhostButton onClick={goBack} className="flex-1">→ برگشت</GhostButton>
        <GoldButton onClick={handlePay} className="flex-1 py-4" disabled={loading}>
          {loading ? 'در حال انتقال...' : '← پرداخت با زرین‌پال'}
        </GoldButton>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Book page**

```tsx
// src/app/book/page.tsx
import { prisma } from '@/lib/prisma'
import { AmbientBackground } from '@/components/ui/AmbientBackground'
import { Navbar } from '@/components/ui/Navbar'
import { BookingWizard } from '@/components/booking/BookingWizard'

export default async function BookPage() {
  const services = await prisma.service.findMany({ where: { isActive: true } })
  return (
    <>
      <AmbientBackground />
      <div className="relative z-10 max-w-lg mx-auto min-h-screen">
        <Navbar />
        <BookingWizard services={services} />
      </div>
    </>
  )
}
```

- [ ] **Step 8: Commit**

```bash
git add src/app/book/ src/components/booking/
git commit -m "feat: multi-step booking wizard with service selection, date/time picker, details, and payment"
```

---

## Task 9: Confirmation + Failure Pages

**Files:**
- Create: `src/app/booking/confirm/[token]/page.tsx`, `src/app/booking/failed/page.tsx`

- [ ] **Step 1: Confirmation page**

```tsx
// src/app/booking/confirm/[token]/page.tsx
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AmbientBackground } from '@/components/ui/AmbientBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { ConfirmCheckmark } from '@/components/booking/ConfirmCheckmark'
import Link from 'next/link'
import { GoldButton } from '@/components/ui/GoldButton'

export default async function ConfirmPage({ params }: { params: { token: string } }) {
  const booking = await prisma.booking.findUnique({ where: { token: params.token }, include: { service: true } })
  if (!booking || booking.status === 'PENDING_PAYMENT') notFound()

  return (
    <>
      <AmbientBackground />
      <div className="relative z-10 max-w-lg mx-auto min-h-screen flex flex-col items-center justify-center px-6">
        <ConfirmCheckmark />
        <h1 className="text-2xl font-light text-cream mt-6 mb-2">رزرو تأیید شد</h1>
        <p className="text-xs text-cream/40 mb-8 text-center font-light">رسید پرداخت از طریق SMS ارسال شد</p>
        <GlassCard className="w-full p-5 mb-8 space-y-3">
          {[
            ['خدمت', booking.service.nameFa],
            ['تاریخ', booking.date.toLocaleDateString('fa-IR')],
            ['ساعت', booking.startTime],
            ['نام', booking.customerName],
            ['کد پیگیری', booking.zarinpalRefId ?? '—'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span className="text-cream/40 text-xs">{label}</span>
              <span className="text-cream text-xs font-medium">{value}</span>
            </div>
          ))}
        </GlassCard>
        <Link href="/"><GoldButton className="w-full py-4 justify-center">بازگشت به خانه</GoldButton></Link>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Animated checkmark component**

```tsx
// src/components/booking/ConfirmCheckmark.tsx
'use client'
import { motion } from 'framer-motion'

export function ConfirmCheckmark() {
  return (
    <motion.div
      initial={{ scale: 0 }} animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className="w-20 h-20 rounded-full bg-gradient-to-br from-gold to-gold-mid flex items-center justify-center shadow-[0_8px_32px_rgba(198,165,91,0.5)]"
    >
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <motion.path
          d="M8 18L15 25L28 11"
          stroke="#0F3D2E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
        />
      </svg>
    </motion.div>
  )
}
```

- [ ] **Step 3: Failed page**

```tsx
// src/app/booking/failed/page.tsx
import { AmbientBackground } from '@/components/ui/AmbientBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import Link from 'next/link'

export default function FailedPage() {
  return (
    <>
      <AmbientBackground />
      <div className="relative z-10 max-w-lg mx-auto min-h-screen flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 rounded-full glass flex items-center justify-center text-4xl mb-6">✗</div>
        <h1 className="text-2xl font-light text-cream mb-2">پرداخت ناموفق</h1>
        <p className="text-xs text-cream/40 mb-8 text-center font-light max-w-xs">پرداخت انجام نشد. می‌توانید مجدداً تلاش کنید یا با پشتیبانی تماس بگیرید.</p>
        <GlassCard className="w-full p-5 mb-6 text-center">
          <p className="text-xs text-cream/50">در صورت کسر وجه از حساب، مبلغ ظرف ۷۲ ساعت برگشت داده می‌شود.</p>
        </GlassCard>
        <Link href="/book" className="w-full mb-3">
          <GoldButton className="w-full py-4 justify-center">← تلاش مجدد</GoldButton>
        </Link>
        <Link href="/" className="text-xs text-cream/40 hover:text-cream transition-colors">بازگشت به خانه</Link>
      </div>
    </>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/booking/ src/components/booking/ConfirmCheckmark.tsx
git commit -m "feat: booking confirmation and payment failure pages"
```

---

## Task 10: SMS Reminder Cron Job

**Files:**
- Create: `src/lib/cron.ts`, modify `src/app/layout.tsx`

- [ ] **Step 1: Write cron job**

```ts
// src/lib/cron.ts
import cron from 'node-cron'
import { prisma } from '@/lib/prisma'
import { sendSms } from '@/lib/smsir'

export function startCronJobs() {
  cron.schedule('*/15 * * * *', async () => {
    const due = await prisma.smsReminder.findMany({
      where: { status: 'PENDING', sendAt: { lte: new Date() } },
      include: { booking: { include: { service: true } } },
    })

    for (const reminder of due) {
      try {
        const { booking } = reminder
        await sendSms(
          booking.customerPhone,
          `${booking.customerName} عزیز، یادآوری: نوبت ${booking.service.nameFa} شما فردا ساعت ${booking.startTime} است — نخلسپا`
        )
        await prisma.smsReminder.update({ where: { id: reminder.id }, data: { status: 'SENT', sentAt: new Date() } })
      } catch {
        await prisma.smsReminder.update({ where: { id: reminder.id }, data: { status: 'FAILED' } })
      }
    }
  })
}
```

- [ ] **Step 2: Start cron in layout (server-side, runs once on boot)**

Add to `src/app/layout.tsx` before the component:

```ts
import { startCronJobs } from '@/lib/cron'

// Start cron only in production server context
if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
  startCronJobs()
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/cron.ts src/app/layout.tsx
git commit -m "feat: node-cron SMS reminder job — fires every 15 minutes"
```

---

## Task 11: Admin Panel

**Files:**
- Create: all files under `src/app/admin/` and `src/components/admin/`

- [ ] **Step 1: Admin login page**

```tsx
// src/app/admin/page.tsx
'use client'
import { useState } from 'react'
import { AmbientBackground } from '@/components/ui/AmbientBackground'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('ایمیل یا رمز اشتباه است'); return }
    router.push('/admin/dashboard')
  }

  const inputClass = 'w-full glass rounded-xl px-4 py-3 text-sm text-cream placeholder:text-cream/30 bg-transparent outline-none focus:ring-1 focus:ring-gold/40'

  return (
    <>
      <AmbientBackground />
      <div className="relative z-10 max-w-sm mx-auto min-h-screen flex flex-col items-center justify-center px-6">
        <div className="text-2xl font-bold text-cream mb-1">نخل<span className="text-gold">سپا</span></div>
        <p className="text-xs text-cream/40 mb-8">پنل مدیریت</p>
        <GlassCard className="w-full p-6 space-y-3">
          <input className={inputClass} type="email" placeholder="ایمیل" value={email} onChange={e => setEmail(e.target.value)} />
          <input className={inputClass} type="password" placeholder="رمز عبور" value={password} onChange={e => setPassword(e.target.value)} />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <GoldButton onClick={handleLogin} className="w-full py-3 mt-2 justify-center">ورود</GoldButton>
        </GlassCard>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Admin layout (auth guard)**

```tsx
// src/app/admin/layout.tsx
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AmbientBackground } from '@/components/ui/AmbientBackground'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AmbientBackground />
      <div className="relative z-10 flex min-h-screen max-w-5xl mx-auto">
        <AdminSidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </>
  )
}
```

- [ ] **Step 3: AdminSidebar**

```tsx
// src/components/admin/AdminSidebar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const links = [
  { href: '/admin/dashboard', label: 'داشبورد', icon: '📊' },
  { href: '/admin/bookings', label: 'رزروها', icon: '📅' },
  { href: '/admin/schedule', label: 'زمان‌بندی', icon: '🕐' },
]

export function AdminSidebar() {
  const path = usePathname()
  return (
    <aside className="w-48 p-4 flex flex-col gap-2 border-l border-white/8">
      <div className="text-sm font-bold text-cream mb-4 px-2">نخل<span className="text-gold">سپا</span></div>
      {links.map(l => (
        <Link key={l.href} href={l.href}
          className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all', path.startsWith(l.href) ? 'glass-gold text-gold' : 'text-cream/50 hover:text-cream hover:bg-white/5')}>
          <span>{l.icon}</span>{l.label}
        </Link>
      ))}
    </aside>
  )
}
```

- [ ] **Step 4: Admin dashboard page**

```tsx
// src/app/admin/dashboard/page.tsx
import { prisma } from '@/lib/prisma'
import { GlassCard } from '@/components/ui/GlassCard'

export default async function DashboardPage() {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const [todayCount, upcomingCount, totalPaid] = await Promise.all([
    prisma.booking.count({ where: { date: today, status: { not: 'CANCELLED' } } }),
    prisma.booking.count({ where: { date: { gt: today }, status: { not: 'CANCELLED' } } }),
    prisma.booking.count({ where: { status: 'PAID' } }),
  ])

  const upcoming = await prisma.booking.findMany({
    where: { date: { gte: today }, status: { not: 'CANCELLED' } },
    include: { service: true },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    take: 10,
  })

  return (
    <div>
      <h1 className="text-xl font-light text-cream mb-6">داشبورد</h1>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[['رزرو امروز', todayCount], ['رزرو آینده', upcomingCount], ['پرداخت موفق', totalPaid]].map(([label, val]) => (
          <GlassCard key={label} className="p-4 text-center">
            <div className="text-2xl font-bold text-gold mb-1">{Number(val).toLocaleString('fa-IR')}</div>
            <div className="text-[10px] text-cream/40">{label}</div>
          </GlassCard>
        ))}
      </div>
      <h2 className="text-sm text-cream/60 mb-3">رزروهای پیش رو</h2>
      <div className="flex flex-col gap-2">
        {upcoming.map(b => (
          <GlassCard key={b.id} className="flex items-center gap-4 p-4">
            <div className="text-xs text-gold font-mono">{b.date.toLocaleDateString('fa-IR')} {b.startTime}</div>
            <div className="flex-1">
              <div className="text-xs text-cream font-medium">{b.customerName}</div>
              <div className="text-[10px] text-cream/40">{b.service.nameFa}</div>
            </div>
            <span className={`text-[9px] px-2 py-0.5 rounded-full ${b.status === 'CONFIRMED' ? 'bg-green-mid/30 text-green-soft' : 'bg-gold/15 text-gold'}`}>
              {b.status === 'CONFIRMED' ? 'تأیید شده' : 'پرداخت شده'}
            </span>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Bookings list page**

```tsx
// src/app/admin/bookings/page.tsx
import { prisma } from '@/lib/prisma'
import { GlassCard } from '@/components/ui/GlassCard'
import Link from 'next/link'

export default async function BookingsPage() {
  const bookings = await prisma.booking.findMany({ include: { service: true }, orderBy: { createdAt: 'desc' } })
  const statusLabel: Record<string, string> = { PENDING_PAYMENT: 'در انتظار پرداخت', PAID: 'پرداخت شده', CONFIRMED: 'تأیید شده', CANCELLED: 'لغو شده' }
  const statusColor: Record<string, string> = { PENDING_PAYMENT: 'text-yellow-400', PAID: 'text-gold', CONFIRMED: 'text-green-soft', CANCELLED: 'text-red-400' }

  return (
    <div>
      <h1 className="text-xl font-light text-cream mb-6">رزروها</h1>
      <div className="flex flex-col gap-2">
        {bookings.map(b => (
          <Link key={b.id} href={`/admin/bookings/${b.id}`}>
            <GlassCard className="flex items-center gap-4 p-4 hover:glass-gold transition-all cursor-pointer">
              <div className="text-xs text-gold font-mono w-28 flex-shrink-0">{b.date.toLocaleDateString('fa-IR')} {b.startTime}</div>
              <div className="flex-1">
                <div className="text-xs text-cream font-medium">{b.customerName}</div>
                <div className="text-[10px] text-cream/40">{b.service.nameFa} — {b.customerPhone}</div>
              </div>
              <span className={`text-[9px] ${statusColor[b.status]}`}>{statusLabel[b.status]}</span>
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Booking detail page**

```tsx
// src/app/admin/bookings/[id]/page.tsx
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { GlassCard } from '@/components/ui/GlassCard'
import { BookingActions } from '@/components/admin/BookingActions'

export default async function BookingDetailPage({ params }: { params: { id: string } }) {
  const booking = await prisma.booking.findUnique({ where: { id: params.id }, include: { service: true } })
  if (!booking) notFound()

  return (
    <div>
      <h1 className="text-xl font-light text-cream mb-6">جزئیات رزرو</h1>
      <GlassCard className="p-5 mb-6 space-y-3">
        {[
          ['نام', booking.customerName],
          ['موبایل', booking.customerPhone],
          ['خدمت', booking.service.nameFa],
          ['تاریخ', booking.date.toLocaleDateString('fa-IR')],
          ['ساعت', `${booking.startTime} — ${booking.endTime}`],
          ['توضیحات', booking.customerNotes ?? '—'],
          ['کد پیگیری', booking.zarinpalRefId ?? '—'],
          ['وضعیت', booking.status],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between">
            <span className="text-cream/40 text-xs">{label}</span>
            <span className="text-cream text-xs">{value}</span>
          </div>
        ))}
      </GlassCard>
      <BookingActions bookingId={booking.id} currentStatus={booking.status} />
    </div>
  )
}
```

```tsx
// src/components/admin/BookingActions.tsx
'use client'
import { useRouter } from 'next/navigation'
import { GoldButton } from '@/components/ui/GoldButton'
import { GhostButton } from '@/components/ui/GhostButton'

export function BookingActions({ bookingId, currentStatus }: { bookingId: string; currentStatus: string }) {
  const router = useRouter()

  async function updateStatus(status: string) {
    await fetch(`/api/admin/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    router.refresh()
  }

  return (
    <div className="flex gap-3">
      {currentStatus !== 'CONFIRMED' && currentStatus !== 'CANCELLED' && (
        <GoldButton onClick={() => updateStatus('CONFIRMED')} className="flex-1 justify-center">تأیید رزرو</GoldButton>
      )}
      {currentStatus !== 'CANCELLED' && (
        <GhostButton onClick={() => updateStatus('CANCELLED')} className="flex-1 justify-center text-red-400">لغو رزرو</GhostButton>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Schedule management page**

```tsx
// src/app/admin/schedule/page.tsx
import { prisma } from '@/lib/prisma'
import { ScheduleManager } from '@/components/admin/ScheduleManager'

export default async function SchedulePage() {
  const [hours, blocks] = await Promise.all([
    prisma.workingHours.findMany({ orderBy: { dayOfWeek: 'asc' } }),
    prisma.blockedSlot.findMany({ orderBy: { date: 'desc' } }),
  ])
  return <ScheduleManager hours={hours} blocks={blocks} />
}
```

```tsx
// src/components/admin/ScheduleManager.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GlassCard } from '@/components/ui/GlassCard'
import { GoldButton } from '@/components/ui/GoldButton'
import { GhostButton } from '@/components/ui/GhostButton'

const DAY_NAMES = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']

type Hour = { id: string; dayOfWeek: number; openTime: string; closeTime: string; isOpen: boolean }
type Block = { id: string; date: Date; startTime: string; endTime: string; reason: string | null }

export function ScheduleManager({ hours, blocks }: { hours: Hour[]; blocks: Block[] }) {
  const [localHours, setLocalHours] = useState(hours)
  const [newBlock, setNewBlock] = useState({ date: '', startTime: '', endTime: '', reason: '' })
  const router = useRouter()

  async function saveHours() {
    await fetch('/api/admin/schedule/hours', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(localHours) })
    router.refresh()
  }

  async function addBlock() {
    await fetch('/api/admin/schedule/block', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newBlock) })
    router.refresh()
  }

  async function removeBlock(id: string) {
    await fetch(`/api/admin/schedule/block/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  const inputClass = 'glass rounded-xl px-3 py-2 text-xs text-cream bg-transparent outline-none focus:ring-1 focus:ring-gold/40'

  return (
    <div>
      <h1 className="text-xl font-light text-cream mb-6">زمان‌بندی</h1>

      <h2 className="text-sm text-cream/60 mb-3">ساعت کاری</h2>
      <div className="flex flex-col gap-2 mb-6">
        {localHours.map((h, i) => (
          <GlassCard key={h.id} className="flex items-center gap-3 p-3">
            <span className="text-xs text-cream/60 w-16 flex-shrink-0">{DAY_NAMES[h.dayOfWeek]}</span>
            <input type="time" value={h.openTime} onChange={e => { const next = [...localHours]; next[i] = { ...h, openTime: e.target.value }; setLocalHours(next) }} className={inputClass} />
            <span className="text-cream/30 text-xs">تا</span>
            <input type="time" value={h.closeTime} onChange={e => { const next = [...localHours]; next[i] = { ...h, closeTime: e.target.value }; setLocalHours(next) }} className={inputClass} />
            <button onClick={() => { const next = [...localHours]; next[i] = { ...h, isOpen: !h.isOpen }; setLocalHours(next) }}
              className={`text-[9px] px-2 py-1 rounded-full transition-all ${h.isOpen ? 'bg-green-mid/30 text-green-soft' : 'bg-white/8 text-cream/30'}`}>
              {h.isOpen ? 'باز' : 'بسته'}
            </button>
          </GlassCard>
        ))}
      </div>
      <GoldButton onClick={saveHours} className="w-full justify-center mb-8">ذخیره ساعت‌ها</GoldButton>

      <h2 className="text-sm text-cream/60 mb-3">مسدود کردن زمان</h2>
      <GlassCard className="p-4 mb-4 flex flex-col gap-3">
        <input type="date" value={newBlock.date} onChange={e => setNewBlock(b => ({ ...b, date: e.target.value }))} className={inputClass} />
        <div className="flex gap-2">
          <input type="time" value={newBlock.startTime} onChange={e => setNewBlock(b => ({ ...b, startTime: e.target.value }))} className={`${inputClass} flex-1`} />
          <input type="time" value={newBlock.endTime} onChange={e => setNewBlock(b => ({ ...b, endTime: e.target.value }))} className={`${inputClass} flex-1`} />
        </div>
        <input value={newBlock.reason} onChange={e => setNewBlock(b => ({ ...b, reason: e.target.value }))} placeholder="دلیل (اختیاری)" className={inputClass} />
        <GoldButton onClick={addBlock} className="w-full justify-center">افزودن بلاک</GoldButton>
      </GlassCard>

      <div className="flex flex-col gap-2">
        {blocks.map(b => (
          <GlassCard key={b.id} className="flex items-center gap-3 p-3">
            <div className="flex-1">
              <div className="text-xs text-cream">{new Date(b.date).toLocaleDateString('fa-IR')} — {b.startTime} تا {b.endTime}</div>
              {b.reason && <div className="text-[10px] text-cream/40">{b.reason}</div>}
            </div>
            <GhostButton onClick={() => removeBlock(b.id)} className="text-[10px] px-2 py-1 text-red-400">حذف</GhostButton>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Commit**

```bash
git add src/app/admin/ src/components/admin/
git commit -m "feat: admin panel — login, dashboard, bookings list, booking detail, schedule manager"
```

---

## Task 12: Infrastructure — VPS Deployment

**Files:**
- Create: `ecosystem.config.js`, `nginx.conf` (reference only)

- [ ] **Step 1: Create PM2 ecosystem config**

```js
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'nakhlespa',
    script: 'node_modules/.bin/next',
    args: 'start',
    instances: 2,
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
  }],
}
```

- [ ] **Step 2: Build and start with PM2 on VPS**

```bash
npm run build
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # follow the printed command to enable auto-start
```

- [ ] **Step 3: Nginx config (reference — apply on VPS)**

```nginx
# /etc/nginx/sites-available/nakhlespa
server {
    listen 80;
    server_name nakhlespa.ir www.nakhlespa.ir;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and test:
```bash
ln -s /etc/nginx/sites-available/nakhlespa /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

- [ ] **Step 4: SSL with Certbot**

```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d nakhlespa.ir -d www.nakhlespa.ir
```

- [ ] **Step 5: Install Supabase self-hosted via Docker**

Follow Supabase self-hosted docs:
```bash
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
cp .env.example .env
# Edit .env: set POSTGRES_PASSWORD, JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY
docker compose up -d
```

- [ ] **Step 6: Point DATABASE_URL in .env.local to Supabase Postgres**

```
DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/postgres
```

- [ ] **Step 7: Run migrations in production**

```bash
npx prisma migrate deploy
npx prisma db seed
```

- [ ] **Step 8: Final commit**

```bash
git add ecosystem.config.js
git commit -m "feat: PM2 ecosystem config for VPS deployment"
```

---

## Self-Review Checklist

- [x] Homepage — Hero, Services, HowItWorks, CTA ✓
- [x] Booking wizard — 4 steps, animation, slot fetching ✓
- [x] Zarinpal — request on create, verify on callback ✓
- [x] SMS.ir — confirmation SMS, admin notification, reminders ✓
- [x] Cron — node-cron every 15min, sends pending reminders ✓
- [x] Admin — login, dashboard, bookings list, detail, schedule ✓
- [x] Middleware — protects all /admin/* and /api/admin/* routes ✓
- [x] Prisma types — BookingStatus enum used consistently ✓
- [x] Slot logic — working hours, booked slots, blocked slots all subtracted ✓
- [x] Infrastructure — Nginx, PM2, Supabase Docker, SSL ✓
