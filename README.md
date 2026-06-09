# نخلسپا — Nakhlespa

Persian spa booking web app. Customers browse services and book appointments through a guided wizard with Zarinpal payment integration. Admins manage bookings, working hours, and blocked slots through a protected dashboard.

**Stack:** Next.js 16 · Prisma v7 · Supabase Auth · Tailwind v4 · Bun

---

## Prerequisites

- [Bun](https://bun.sh) — `curl -fsSL https://bun.sh/install | bash`
- [Supabase CLI](https://supabase.com/docs/guides/cli) — `brew install supabase/tap/supabase`
- [Docker](https://www.docker.com/products/docker-desktop) or [OrbStack](https://orbstack.dev) (required by Supabase local)

---

## Local Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Start Supabase

```bash
supabase start
```

This prints the local credentials — copy them for the next step:

```
API URL:         http://127.0.0.1:54321
DB URL:          postgresql://postgres:postgres@127.0.0.1:54322/postgres
anon key:        eyJ...
service_role key: eyJ...
Studio URL:      http://127.0.0.1:54323
```

### 3. Configure environment

Create `.env.local` (Next.js runtime):

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<anon key from above>
SUPABASE_SERVICE_ROLE_KEY=<service_role key from above>
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from above>

# Payment (Zarinpal) — leave as placeholder for local dev
ZARINPAL_MERCHANT_ID=your_merchant_id
ZARINPAL_CALLBACK_URL=http://localhost:3000/api/bookings/verify

# SMS (SMS.ir) — optional for local dev
SMSIR_API_KEY=your_api_key
SMSIR_LINE_NUMBER=your_line_number
```

Create `.env` (Prisma CLI — must match `DATABASE_URL` above):

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### 4. Migrate and seed the database

```bash
bunx prisma migrate dev --name init
bun prisma/seed.ts
```

The seed creates two services (ماساژ درمانی, ماساژ آرامش‌بخش) and working hours (Saturday–Friday, 09:00–21:00).

### 5. Create an admin user

Open Supabase Studio at `http://127.0.0.1:54323` → **Authentication** → **Users** → **Add user**, then enter your email and password.

Or via CLI:

```bash
supabase auth add-user --email admin@example.com --password YourPassword123
```

### 6. Run the dev server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Pages

| URL | Description |
|-----|-------------|
| `/` | Home — hero, services, booking CTA |
| `/book` | Standalone booking page (fallback when outside home) |
| `/booking/confirm/[token]` | Post-payment confirmation |
| `/booking/failed` | Payment failure page |
| `/admin` | Admin login |
| `/admin/dashboard` | Stats and upcoming bookings |
| `/admin/bookings` | Full booking list |
| `/admin/bookings/[id]` | Booking detail and status actions |
| `/admin/schedule` | Working hours and blocked slots |

Admin routes (`/admin/dashboard`, `/admin/bookings`, `/admin/schedule`) are protected by `src/proxy.ts` — unauthenticated requests redirect to `/admin`.

---

## Useful Commands

```bash
bun run build          # Production build
bunx prisma studio     # Visual DB browser at http://localhost:5555
supabase stop          # Stop local Supabase containers
supabase status        # Show running services and credentials
```
