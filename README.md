# نخلسپا — Nakhlespa

Persian spa booking web app. Customers browse services and book appointments through a guided wizard with Zarinpal payment integration. Admins manage bookings, working hours, and blocked slots through a protected dashboard.

**Stack:** Next.js 16 · Prisma v7 · Better Auth · BullMQ · Redis · Tailwind v4 · Bun

---

## Prerequisites

- [Bun](https://bun.sh) — `curl -fsSL https://bun.sh/install | bash`
- [Docker](https://www.docker.com/products/docker-desktop) or [OrbStack](https://orbstack.dev) — for local Postgres and Redis containers

---

## Local Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Start Postgres and Redis locally

Use [OrbStack](https://orbstack.dev) with the included Compose file. Nakhlespa uses host ports `5434` and `6380` so it can run alongside Bonyad:

```bash
test -f .env || cp .env.example .env
docker compose --env-file .env up -d
```

### 3. Configure environment

Create `.env.local` (Next.js runtime):

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5434/nakhlespa
BETTER_AUTH_SECRET=dev-secret-not-for-production
REDIS_URL=redis://127.0.0.1:6380
ZARINPAL_MERCHANT_ID=your_merchant_id
ZARINPAL_CALLBACK_URL=http://localhost:3000/api/bookings/verify
SMSIR_API_KEY=your_api_key
SMSIR_TEMPLATE_CONFIRM=<template id for customer confirmation>
SMSIR_TEMPLATE_ADMIN=<template id for admin notification>
SMSIR_TEMPLATE_REMINDER_24H=<template id for 24h reminder>
SMSIR_TEMPLATE_REMINDER_2H=<template id for 2h reminder>
SMSIR_TEMPLATE_OTP=<template id for customer OTP login>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_PHONE=+989XXXXXXXXX
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=DevPassword123
```

Create `.env` (Prisma CLI — must match `DATABASE_URL` above):

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5434/nakhlespa
```

### 4. Migrate and seed the database

```bash
bunx prisma migrate dev --name init
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=DevPassword123 bun prisma/seed.ts
```

The seed creates services, working hours, add-ons, and the admin user. It is idempotent (safe to run multiple times).

### 5. Run the dev server

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
| `/admin/discounts` | Promo code management |
| `/my/login` | Customer OTP login (phone + 6-digit SMS code) |
| `/my/bookings` | Customer booking history + loyalty progress |
| `/my/bookings/[token]` | Customer booking detail |

Admin routes (`/admin/dashboard`, `/admin/bookings`, `/admin/schedule`, `/admin/discounts`) are protected by `src/proxy.ts` — unauthenticated requests redirect to `/admin`. Customer portal routes (`/my/bookings`, `/my/bookings/[token]`) are also protected — unauthenticated requests redirect to `/my/login`.

---

## Useful Commands

```bash
bun run build          # Production build
bunx prisma studio     # Visual DB browser at http://localhost:5555
podman ps              # Show running containers (Postgres, Redis)
```

---

## Coolify Deployment

This is the production runbook for a single Coolify server. Coolify manages the Compose resource, builds the app image, and provides Traefik-only public routing. Do not install or configure PM2, Nginx, a separate Redis container, or a native PostgreSQL service.

### 1. Install Coolify

Provision a supported Ubuntu VPS, point DNS for the production domain at it, and install Coolify using the official installer from [coolify.io](https://coolify.io). Complete the first-run server and admin setup in the Coolify dashboard. Allow inbound SSH and HTTP/HTTPS; the database, Redis, and worker services remain private to the Compose network.

### 2. Create one Compose resource

In Coolify, create one resource from this repository and select `compose.production.yml` as its Compose file. Configure the repository, branch, and automatic deploy policy as needed. The resource must contain the four services `web`, `postgres`, `redis`, and `worker-sms`.

Set the public domain only on `web`, targeting its exposed port `3000` through Traefik. Do not open or attach public domains or host ports to `postgres`, `redis`, or `worker-sms`; they communicate through the private service names `postgres:5432` and `redis:6379`.

### 3. Configure Coolify environment variables

Add every variable from `.env.example` in the resource's Environment Variables screen. Use real production secrets and approved SMS.ir/Zarinpal values; never commit them. The service-to-service values must use the Compose network, not localhost:

```bash
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
REDIS_URL=redis://redis:6379
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
ZARINPAL_CALLBACK_URL=https://yourdomain.com/api/bookings/verify
```

Set `BETTER_AUTH_SECRET` to a long random value, set the admin credentials, and configure all five SMS.ir template IDs, including `SMSIR_TEMPLATE_OTP`. Use `SMSIR_TEMPLATE_REMINDER_24H` and `SMSIR_TEMPLATE_REMINDER_2H` for the `worker-sms` service.

### 4. First deployment and initialization

Deploy the Compose resource from Coolify and wait for `web`, `postgres`, `redis`, and `worker-sms` to become running. Run the following commands from the `web` container's Coolify terminal (or an equivalent one-off command using the production image):

```bash
bunx prisma migrate deploy
ADMIN_EMAIL=admin@yourdomain.com ADMIN_PASSWORD=your-production-password bun prisma/seed.ts
```

`prisma migrate deploy` applies pending migrations. The seed is idempotent and creates the services, working hours, add-ons, and admin user. Repeat the migration command after each release before enabling new application traffic.

### 5. Verify before enabling webhooks

Check the public home page, admin login, customer OTP login, booking flow, payment callback, and both reminder queues. Confirm the `worker-sms` logs show a running BullMQ worker and that PostgreSQL/Redis have no public listener. Do not open those services to the internet.

After the health checks pass, enable the Zarinpal webhook/callback configuration for the production domain. If verification fails, disable the webhook until the callback URL, payment credentials, and worker logs have been corrected.

### 6. Maintenance and database access

For a release, push the change and redeploy the same Compose resource in Coolify. Review the deployment logs, then run `bunx prisma migrate deploy` if the release includes migrations. Do not run a second Compose stack alongside the resource.

For emergency database access, use an SSH tunnel to the VPS/Coolify host and connect through the private database endpoint; do not publish PostgreSQL's port:

```bash
ssh -N -L 15432:127.0.0.1:5432 user@your-server
```

Use the tunnel only if the Coolify host exposes PostgreSQL locally; otherwise use Coolify's terminal or its supported private-network access path. Keep backups and volume retention enabled for `postgres_data` and `redis_data`.

---

### SMS.ir Template Setup

This app uses SMS.ir's **Verify** API (`POST /v1/send/verify`) with five separate templates — one per message type. Each template uses named parameters (`{name}`, `{service}`, etc.). Create and approve the templates in the SMS.ir panel, then copy their numeric IDs into the Coolify environment variables.

| Env var | Template body |
|---------|---------------|
| `SMSIR_TEMPLATE_CONFIRM` | `{name} عزیز، رزرو شما برای {service} در تاریخ {date} ساعت {time} تأیید شد. کد پیگیری: {refId} — نخلسپا` |
| `SMSIR_TEMPLATE_ADMIN` | `رزرو جدید: {name} — {service} — {date} {time} — تلفن: {phone}` |
| `SMSIR_TEMPLATE_REMINDER_24H` | `{name} عزیز، یادآوری: نوبت {service} شما فردا ساعت {time} است — نخلسپا` |
| `SMSIR_TEMPLATE_REMINDER_2H` | `{name} عزیز، یادآوری: نوبت {service} شما ۲ ساعت دیگر ساعت {time} است — نخلسپا` |
| `SMSIR_TEMPLATE_OTP` | `کد ورود شما به نخلسپا: {code}` |

| Template | Trigger | Recipient |
|----------|---------|-----------|
| `CONFIRM` | Payment verified | Customer |
| `ADMIN` | Payment verified | `ADMIN_PHONE` |
| `REMINDER_24H` | 24h before appointment (BullMQ delayed job) | Customer |
| `REMINDER_2H` | 2h before appointment (BullMQ delayed job) | Customer |
| `OTP` | Customer requests login to `/my/bookings` | Customer |
