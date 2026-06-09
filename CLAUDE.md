# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
bun run dev          # Start dev server
bun run build        # Production build
bun run start        # Start production server

bunx prisma migrate dev --name <name>   # Run DB migrations (reads .env, not .env.local)
bun prisma/seed.ts                       # Seed services and working hours
bunx prisma studio                       # Open Prisma Studio GUI

supabase start       # Start local Supabase (Docker/OrbStack required)
supabase stop
supabase status      # Get local API URL, anon key, service_role key
```

No lint or test commands are configured.

## Environment Files

Two env files are required:
- **`.env.local`** — read by Next.js at runtime: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ZARINPAL_MERCHANT_ID`, `ZARINPAL_CALLBACK_URL`, `SMSIR_API_KEY`, `SMSIR_TEMPLATE_ID`
- **`.env`** — read by Prisma CLI tools only: `DATABASE_URL`

Prisma CLI (`migrate`, `studio`) reads `.env`, not `.env.local`. Both must have matching `DATABASE_URL`.

## Architecture

### Stack
- **Next.js 16** with App Router — `proxy.ts` (not `middleware.ts`) for auth guards
- **Prisma v7** with `@prisma/adapter-pg` driver adapter — `PrismaClient` must receive `{ adapter }` everywhere, including `prisma/seed.ts`. The `datasource` block in `schema.prisma` has **no `url` field** (breaking change from v6).
- **Supabase Auth** (`@supabase/ssr`) — admin authentication only; `createBrowserClient` in client components, `createServerClient` in `proxy.ts`
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
3. `POST /api/bookings/create` → redirects to Zarinpal payment
4. Zarinpal callback → `GET /api/bookings/verify` → sets status `PAID`, schedules SMS reminder, redirects to `/booking/confirm/[token]`

### Admin Area (`/admin/*`)
Protected by `proxy.ts` matcher. Login at `/admin` (Supabase email/password). Routes: `/admin/dashboard`, `/admin/bookings`, `/admin/bookings/[id]`, `/admin/schedule`.

### Theming
CSS custom properties in `globals.css` — three layers: `:root` (dark default), `[data-theme="light"]`, `@media (prefers-color-scheme: light)`. Anti-flash inline script in `layout.tsx` reads `localStorage.getItem('theme')` before hydration. **Always use CSS vars** (`var(--text-primary)`, `var(--text-muted)`, `var(--text-faint)`) not hardcoded colors like `text-[#F3EFE8]` — hardcoded values break light mode.

### Key UI Patterns
- `GlassCard` / `.glass` / `.glass-gold` — glassmorphism utility classes defined in `globals.css`
- `BookingDialogProvider` wraps the home page and exposes `{ open, available }` context. Components outside the provider must check `available` before calling `open()`, falling back to `router.push('/book')`.
- `AmbientBackground` — canvas particle system, reacts to scroll and clicks; uses `var(--orb-a/b/c)` CSS vars for theme-aware colors
- All text must use `font-vazir` (Vazirmatn). The font variable is set on `<html>` via `vazir.variable` and registered in `@theme`. Never use `font-mono` on Persian content.

### Payments & SMS
- `src/lib/zarinpal.ts` — `zarinpalRequest` / `zarinpalVerify`
- `src/lib/smsir.ts` — SMS.ir integration for booking reminders
- `src/lib/cron.ts` — node-cron job that fires SMS reminders

### Path Alias
`@/` maps to `src/` (configured in `tsconfig.json`).
