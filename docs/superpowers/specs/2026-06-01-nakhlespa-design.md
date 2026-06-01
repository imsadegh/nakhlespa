# نخلسپا — Spa Booking Website Design Spec

**Date:** 2026-06-01  
**Brand:** نخلسپا (Nakhlespa) — Massage & Spa  
**Language:** Persian (RTL)  
**Status:** Approved for implementation

---

## 1. Project Overview

A professional Persian-language spa booking website for نخلسپا. Customers visit the site, browse services, book an appointment through a multi-step wizard, and pay online via Zarinpal. After successful payment, the admin receives an SMS notification via SMS.ir. Automated SMS reminders are sent to customers before their appointments.

The site features an Apple-inspired liquid glass UI aesthetic — deep green/gold color palette, backdrop-filter blur panels, specular highlights, and Framer Motion scroll animations.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS + custom CSS (glassmorphism) |
| Animations | Framer Motion |
| Database | PostgreSQL via Supabase (self-hosted on VPS, Docker) |
| ORM | Prisma |
| Payment | Zarinpal API |
| SMS | SMS.ir API |
| Cron | node-cron (running in Next.js server via PM2) |
| Server | Nginx (reverse proxy) + PM2 |
| Font | Vazirmatn (Persian) |
| Calendar | react-datepicker + date-fns-jalali (Jalali/Shamsi) |

---

## 3. Color Palette

| Name | Hex | Usage |
|---|---|---|
| Green Deep | `#0F3D2E` | Primary background, navbar, hero |
| Green Mid | `#1F5E46` | Cards, accents, buttons |
| Green Soft | `#4F6F52` | Subtle accents, borders |
| Gold Primary | `#C6A55B` | CTA buttons, highlights, prices |
| Gold Mid | `#A8873A` | Gradient second stop |
| Gold Dark | `#8C6A2F` | Gradient third stop |
| Brown Deep | `#3B2416` | Dark accents, booking bar |
| Brown Mid | `#4A2F1E` | Secondary dark surfaces |
| Cream | `#F3EFE8` | Text, light backgrounds |
| Sage | `#6E7F6A` | Muted text, descriptions |

---

## 4. Design System — Liquid Glass

All card/panel components use the following CSS pattern:

```css
/* Base glass */
background: rgba(255, 255, 255, 0.07);
backdrop-filter: blur(40px) saturate(200%) brightness(1.05);
border: 1px solid rgba(255, 255, 255, 0.15);
box-shadow:
  inset 0 1px 0 rgba(255, 255, 255, 0.30),  /* specular top edge */
  inset 0 -1px 0 rgba(255, 255, 255, 0.06),
  0 8px 32px rgba(0, 0, 0, 0.35);

/* Gold-tinted glass */
background: rgba(198, 165, 91, 0.10);
border: 1px solid rgba(198, 165, 91, 0.28);
box-shadow:
  inset 0 1px 0 rgba(255, 255, 255, 0.28),
  0 8px 40px rgba(198, 165, 91, 0.18);
```

Ambient background: layered radial gradients + 5 animated blurred orbs (filter: blur(100px)) that drift slowly. Fine grain noise texture overlay at 3.5% opacity.

---

## 5. Site Structure

### Public Pages

| Route | Description |
|---|---|
| `/` | Homepage |
| `/book` | Multi-step booking wizard |
| `/booking/confirm/[token]` | Post-payment confirmation |
| `/booking/failed` | Payment failure + retry |

### Admin Pages (Supabase Auth protected)

| Route | Description |
|---|---|
| `/admin` | Login (email + password) |
| `/admin/dashboard` | Today's bookings, upcoming, stats |
| `/admin/bookings` | Full booking list with filters |
| `/admin/bookings/[id]` | Booking detail: confirm, cancel, notes |
| `/admin/schedule` | Set working hours, block time slots |

---

## 6. Page Designs

### 6.1 Homepage (`/`)

Sections in order:
1. **Navbar** — sticky, frosted glass, logo (نخلسپا), nav links (خدمات, درباره ما, تماس), رزرو pill button
2. **Hero** — animated eyebrow tag, large thin-weight h1 with gold shimmer on key word, subtitle, two CTA buttons (رزرو آنلاین primary gold, مشاهده خدمات ghost glass), 3-stat strip (مشتری راضی, سال تجربه, ۲۴/۷)
3. **Feature Pills** — small glass capsules: متخصصان مجرب, پرداخت آنلاین, محیط آرام, رزرو فوری
4. **Services** — two liquid glass cards (ماساژ درمانی, ماساژ آرامش‌بخش) with icon, name, subtitle, price
5. **How It Works** — 3-step numbered section: انتخاب خدمت → انتخاب زمان → پرداخت
6. **Booking CTA Card** — large glass card with inner glow, headline, description, full-width gold button
7. **Footer** — brand name, phone, address, social links (if any)

### 6.2 Booking Wizard (`/book`)

Animated progress bar at top (4 steps). Each step transitions left/right with Framer Motion.

- **Step 1 — Service:** Two glass cards, tap to select, selected card gets gold border glow
- **Step 2 — Date & Time:** Jalali calendar, available time slots as staggered glass pills
- **Step 3 — Details:** Name, phone (required), notes (optional)
- **Step 4 — Review & Pay:** Summary card + gold Zarinpal pay button

On "Pay": POST to `/api/bookings/create` → creates booking with status `pending_payment` → redirects to Zarinpal payment URL.

### 6.3 Confirmation (`/booking/confirm/[token]`)

Server-side: verify payment with Zarinpal → update booking to `paid` → schedule SMS reminders → send confirmation SMS to customer and notification SMS to admin.

Client: animated SVG checkmark, booking summary card, "بازگشت به خانه" button.

### 6.4 Admin Dashboard

Protected by Supabase Auth middleware. Session check on every admin route via `middleware.ts`.

---

## 7. Data Model

### `services`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
name_fa         text NOT NULL
description_fa  text
duration_minutes integer NOT NULL
price           integer NOT NULL  -- in Tomans
is_active       boolean DEFAULT true
created_at      timestamptz DEFAULT now()
```

### `working_hours`
```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
day_of_week  integer NOT NULL  -- 0=Saturday, 1=Sunday, ..., 6=Friday
open_time    time NOT NULL
close_time   time NOT NULL
is_open      boolean DEFAULT true
created_at   timestamptz DEFAULT now()
```

### `blocked_slots`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
date        date NOT NULL
start_time  time NOT NULL
end_time    time NOT NULL
reason      text
created_at  timestamptz DEFAULT now()
```

### `bookings`
```sql
id                   uuid PRIMARY KEY DEFAULT gen_random_uuid()
token                uuid UNIQUE DEFAULT gen_random_uuid()
service_id           uuid REFERENCES services(id)
customer_name        text NOT NULL
customer_phone       text NOT NULL
customer_notes       text
date                 date NOT NULL
start_time           time NOT NULL
end_time             time NOT NULL  -- computed: start_time + service.duration_minutes
status               text NOT NULL DEFAULT 'pending_payment'
                     -- enum: pending_payment | paid | confirmed | cancelled
zarinpal_authority   text
zarinpal_ref_id      text
created_at           timestamptz DEFAULT now()
```

### `sms_reminders`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
booking_id  uuid REFERENCES bookings(id) ON DELETE CASCADE
send_at     timestamptz NOT NULL  -- e.g. 24h before, 2h before appointment
status      text NOT NULL DEFAULT 'pending'
            -- enum: pending | sent | failed
sent_at     timestamptz
created_at  timestamptz DEFAULT now()
```

---

## 8. API Routes (Next.js)

| Method | Route | Description |
|---|---|---|
| GET | `/api/services` | List active services |
| GET | `/api/slots?date=&serviceId=` | Available time slots for a date (working hours minus booked/blocked slots, split into service-duration intervals) |
| POST | `/api/bookings/create` | Create booking, init Zarinpal payment |
| GET | `/api/bookings/verify?Authority=&Status=` | Zarinpal callback — verify + confirm |
| GET | `/api/admin/bookings` | List bookings (admin only) |
| PATCH | `/api/admin/bookings/[id]` | Update booking status (admin only) |
| GET | `/api/admin/schedule` | Get working hours + blocked slots |
| POST | `/api/admin/schedule/block` | Add a blocked slot |
| DELETE | `/api/admin/schedule/block/[id]` | Remove a blocked slot |
| PUT | `/api/admin/schedule/hours` | Update working hours |

---

## 9. Booking & Payment Flow

```
Customer fills wizard
        ↓
POST /api/bookings/create
  → Insert booking (status: pending_payment)
  → Call Zarinpal /pg/v4/payment/request.json
  → Return Zarinpal payment URL
        ↓
Customer redirected to Zarinpal
        ↓
Zarinpal redirects to /api/bookings/verify?Authority=...&Status=OK
  → Call Zarinpal /pg/v4/payment/verify.json
  → If verified:
      → Update booking status → paid
      → Insert 2 sms_reminders (24h before, 2h before)
      → Send confirmation SMS to customer via SMS.ir
      → Send notification SMS to admin via SMS.ir
      → Redirect to /booking/confirm/[token]
  → If failed:
      → Update booking status → pending_payment (keep)
      → Redirect to /booking/failed
```

---

## 10. SMS Reminders Cron Job

A `node-cron` job runs every 15 minutes inside the Next.js server process (managed by PM2):

```
Every 15 minutes:
  SELECT * FROM sms_reminders
  WHERE status = 'pending' AND send_at <= NOW()
  
  For each reminder:
    → Fetch booking details
    → Send SMS via SMS.ir
    → Update reminder status → sent (or failed)
```

Two reminders are created per confirmed booking:
- `send_at = appointment_datetime - 24 hours`
- `send_at = appointment_datetime - 2 hours`

---

## 11. Animations (Framer Motion)

| Element | Animation |
|---|---|
| Page sections | `fadeUp` — fade in + translate Y(20px→0) on scroll enter (`whileInView`, `once: true`) |
| Booking steps | Slide left/right transition between steps (`AnimatePresence` + `x` variants) |
| Step progress bar | Animated width via `motion.div` |
| Time slot pills | Staggered entrance (`staggerChildren: 0.05`) when date selected |
| Glass cards | `whileHover: { scale: 1.02, y: -2 }` with spring |
| Gold CTA button | `whileTap: { scale: 0.97 }` spring bounce |
| Confirmation checkmark | SVG `pathLength` animation 0→1 on mount |
| Gold text shimmer | CSS `background-position` keyframe animation |
| Ambient orbs | CSS `@keyframes drift` — translate + scale loop |

---

## 12. Infrastructure (VPS)

```
VPS (4 cores, 8GB RAM)
├── Docker Compose
│   └── Supabase stack (Postgres, Auth, REST, Realtime, Studio)
├── Node.js (via PM2)
│   └── Next.js app (port 3000)
│       └── node-cron (SMS reminder job, embedded)
└── Nginx
    ├── nakhlespa.ir → proxy_pass localhost:3000
    └── supabase.nakhlespa.ir → proxy_pass localhost:8000 (Supabase Studio, private)
```

Supabase self-hosted runs on the official Docker Compose configuration. Next.js connects to it via the internal Postgres connection string (bypassing the REST layer, direct Prisma connection).

---

## 13. Environment Variables

```env
# Supabase
DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres
SUPABASE_URL=http://localhost:8000
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Zarinpal
ZARINPAL_MERCHANT_ID=...
ZARINPAL_CALLBACK_URL=https://nakhlespa.ir/api/bookings/verify

# SMS.ir
SMSIR_API_KEY=...
SMSIR_LINE_NUMBER=...
ADMIN_PHONE=+98...

# App
NEXT_PUBLIC_SITE_URL=https://nakhlespa.ir
ADMIN_EMAIL=...
```

---

## 14. Out of Scope (v1)

- Multi-branch support
- Customer accounts / booking history
- Service management via admin UI (services seeded directly in DB)
- Online gift cards
- Reviews / ratings system
