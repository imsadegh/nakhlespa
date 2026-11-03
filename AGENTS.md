# AGENTS.md

This file provides guidance to coding agents when working with code in this repository.

## Commands

```bash
bun run dev          # Start dev server
bun run build        # Production build
bun run start        # Start production server

bun run db:generate                      # Generate Drizzle migrations after schema changes
bun run db:migrate                       # Apply Drizzle migrations (reads DATABASE_URL)
bun run db:seed                          # Seed services, working hours, add-ons, and admin user
bun run db:seed:durations                # Update package and bath add-on durations only
```

No lint or test commands are configured.

## Before Committing

- Run `bun run build` and all available tests before every commit. The GitHub Actions validation currently runs `bun run build`; this repository has no test script configured.
- Do not commit when a validation check fails. Report the failure and fix it first.

## Environment Files

Use one root `.env` file for local CLI commands and application runtime. It contains `DATABASE_URL`, `BETTER_AUTH_SECRET`, `REDIS_URL`, `NEXT_PUBLIC_SITE_URL`, `ZIBAL_MERCHANT`, `ZIBAL_CALLBACK_URL`, `SMSIR_API_KEY`, `SMSIR_TEMPLATE_CONFIRM`, `SMSIR_TEMPLATE_ADMIN`, `SMSIR_TEMPLATE_REMINDER_24H`, `SMSIR_TEMPLATE_REMINDER_2H`, `SMSIR_TEMPLATE_OTP`, `ADMIN_PHONE`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.

## Architecture

### Stack
- **Next.js 16** with App Router — `proxy.ts` (not `middleware.ts`) for auth guards
- **Drizzle ORM** with the shared `node-postgres` client in `src/lib/db.ts`; schema and migrations live in `src/db/schema.ts` and `drizzle/`.
- **Better Auth** — admin authentication using Postgres-backed sessions; all auth calls go through server-side API routes (`/api/auth/login`, `/api/auth/logout`). `proxy.ts` validates sessions server-side.
- **BullMQ** — Redis-backed job queue for SMS reminder scheduling (replaces node-cron)
- **Tailwind v4** — config via `@theme {}` in `globals.css`; font variables must be registered there for utility classes to work

### Database Models
`Service` → `Booking` (many-to-one) → `SmsReminder` (one-to-many)  
`WorkingHours` (per weekday, Iranian calendar: Saturday=0…Friday=6)  
`BlockedSlot` (admin-blocked time ranges)

### Slot Availability (`src/lib/slots.ts`)
Generates 30-minute-interval slots within working hours, subtracting existing bookings and blocked slots. Day-of-week mapping uses Iranian week (Saturday=0) from JS UTC day.

### Booking Flow
1. Customer opens `BookingDialog` (popup from home page) or `/book` page
2. 4-step wizard: Service → Date/Time → Customer Details → Review
3. `POST /api/bookings/create` → redirects to Zibal payment
4. Zibal callback → `GET /api/bookings/verify` → sets status `PAID`, schedules SMS reminder, redirects to `/booking/confirm/[token]`

### Admin Area (`/admin/*`)
Protected by `proxy.ts` matcher. Login at `/admin` (Better Auth email/password). Routes: `/admin/dashboard`, `/admin/bookings`, `/admin/bookings/[id]`, `/admin/schedule`, `/admin/discounts`.

### Customer Portal (`/my/*`)
OTP-authenticated via `__customer_session` HttpOnly cookie. `proxy.ts` redirects unauthenticated requests to `/my/login?next=<path>`. Routes: `/my/login` (OTP flow), `/my/bookings` (booking history + loyalty progress), `/my/bookings/[token]` (detail). Session stored in `CustomerSession` table (30-min TTL). OTP codes SHA-256 hashed in `Verification` table; `SMSIR_TEMPLATE_OTP` template used for delivery.

### Theming
CSS custom properties in `globals.css` — three layers: `:root` (dark default), `[data-theme="light"]`, `@media (prefers-color-scheme: light)`. Anti-flash inline script in `layout.tsx` reads `localStorage.getItem('theme')` before hydration. **Always use CSS vars** (`var(--text-primary)`, `var(--text-muted)`, `var(--text-faint)`) not hardcoded colors like `text-[#F3EFE8]` — hardcoded values break light mode.

### Key UI Patterns
- `GlassCard` / `.glass` / `.glass-gold` — glassmorphism utility classes defined in `globals.css`
- `BookingDialogProvider` wraps the home page and exposes `{ open, available }` context. Components outside the provider must check `available` before calling `open()`, falling back to `router.push('/book')`.
- `AmbientBackground` — canvas particles respond to scrolling over softened gradients; gradients use `var(--orb-a/b/c)` CSS vars
- All text must use `font-vazir` (Vazirmatn). The font variable is set on `<html>` via `vazir.variable` and registered in `@theme`. Never use `font-mono` on Persian content.

### Payments & SMS
- `src/lib/zibal.ts` — `zibalRequest` / `zibalVerify`; app tomans are converted to gateway rials. Payment columns are `zibalTrackId` and `zibalRefId`; migration `0006_zibal-payment-columns` preserves existing values when renaming them.
- `src/lib/smsir.ts` — SMS.ir integration for booking reminders
- `src/lib/queue.ts` — BullMQ job queue for SMS reminder scheduling; worker starts in `src/instrumentation.ts`

### Path Alias
`@/` maps to `src/` (configured in `tsconfig.json`).

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

