# نخلسپا — Nakhlespa

Persian spa booking web app. Customers browse services and book appointments through a guided wizard with Zarinpal payment integration. Admins manage bookings, working hours, and blocked slots through a protected dashboard.

**Stack:** Next.js 16 · Drizzle ORM · Better Auth · BullMQ · Redis · Tailwind v4 · Bun

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
docker compose --env-file .env up -d
```

### 3. Configure environment

Create one root `.env` file from the example:

```bash
cp .env.example .env
```

Next.js and Drizzle read the same root `.env` file. The local Compose file also reads it through `--env-file .env`; keep `DATABASE_URL` on port `5434` and `REDIS_URL` on port `6380`.

### 4. Migrate and seed the database

```bash
bun run db:migrate
echo -n "Admin email: "
read ADMIN_EMAIL
echo -n "Admin password: "
read -s ADMIN_PASSWORD
echo
export ADMIN_EMAIL ADMIN_PASSWORD
bun run db:seed
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
bun run db:generate    # Generate Drizzle migrations after schema changes
```

---

## Dokploy Deployment

This is the production runbook for a single Dokploy-managed Ubuntu VPS. Dokploy runs the Compose resource and provides the HTTPS reverse proxy; GitHub Actions builds the application image and triggers the Dokploy deployment. Do not install PM2, Nginx, a separate Redis container, or a native PostgreSQL service.

### 1. Install Dokploy and prepare the VPS

Provision a supported Ubuntu VPS, point DNS for the production domain at it, and install Dokploy using the official instructions at [dokploy.com](https://dokploy.com). Complete the first-run server and admin setup. Allow inbound SSH and HTTP/HTTPS; PostgreSQL, Redis, and the worker remain private to the Compose network.

### 2. Create one Docker Compose resource

In Dokploy, create one Docker Compose service from this repository. Select the production branch, set the Compose path to `./compose.production.yml`, and use the repository integration only for source synchronization. The resource must contain `web`, `postgres`, `redis`, and `worker-sms`.

Configure Dokploy's domain feature for `web` on container port `3000`. Do not attach domains or publish host ports for `postgres`, `redis`, or `worker-sms`; they communicate through `postgres:5432` and `redis:6379` inside the Compose network. Keep Dokploy's managed HTTPS proxy as the only public reverse proxy.

The image is built by GitHub Actions and pulled by Dokploy. Set `NAKHLESPA_IMAGE=ghcr.io/imsadegh/nakhlespa:latest` in Dokploy. If the GHCR package is private, configure the Dokploy registry credentials with read-only package access. Do not enable a second Git push deployment trigger in Dokploy; GitHub Actions is the deployment trigger for this setup.

### 3. Configure Dokploy variables and GitHub secrets

Dokploy's Compose environment editor writes the values used for Compose interpolation. Add the following values there using real production secrets; never commit them or a production `.env` file:

```bash
NAKHLESPA_IMAGE=ghcr.io/imsadegh/nakhlespa:latest
DB_USER=your-production-db-user
DB_PASSWORD=your-production-db-password
DB_NAME=nakhlespa
BETTER_AUTH_SECRET=your-long-random-secret
ZARINPAL_MERCHANT_ID=your-production-merchant-id
ZARINPAL_SANDBOX=false
ZARINPAL_CALLBACK_URL=https://yourdomain.com/api/bookings/verify
SMSIR_API_KEY=your-production-smsir-api-key
SMSIR_TEMPLATE_CONFIRM=your-confirm-template-id
SMSIR_TEMPLATE_ADMIN=your-admin-template-id
SMSIR_TEMPLATE_REMINDER_24H=your-24h-template-id
SMSIR_TEMPLATE_REMINDER_2H=your-2h-template-id
SMSIR_TEMPLATE_OTP=your-otp-template-id
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
ADMIN_PHONE=your-admin-phone
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-production-admin-password
```

Do not add the local `DATABASE_URL` or `REDIS_URL` values from `.env.example`; those use `127.0.0.1`. The production Compose file supplies `postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}` and `redis://redis:6379` inside the containers. `ZARINPAL_SANDBOX` should normally be `false`. Use a URL-safe database password containing only letters and numbers because it is embedded in the connection URL, and do not change it after the PostgreSQL volume is initialized without also changing the database role password.

Add these GitHub Actions repository secrets:

| Secret | Value |
|--------|-------|
| `DOKPLOY_URL` | Dokploy base URL, for example `https://deploy.example.com` |
| `DOKPLOY_API_KEY` | Dokploy API key with permission to deploy the Compose resource |
| `DOKPLOY_COMPOSE_ID` | The Compose resource ID from Dokploy |

The workflow also uses the built-in `GITHUB_TOKEN` to publish the image to GHCR. If the package is private, grant Dokploy read-only access to GHCR. Keep the API key and registry credentials out of workflow logs and source control.

### 4. First deployment and initialization

Deploy the Compose resource from Dokploy. The `web` service runs `bun run db:migrate` before `next start`; it does not accept traffic until migrations succeed. PostgreSQL and Redis health checks complete before the application services start.

After the first deployment is healthy, run this one-time seed from the `web` container's Dokploy terminal:

```bash
echo -n "Admin email: "
read ADMIN_EMAIL
echo -n "Admin password: "
read -s ADMIN_PASSWORD
echo
export ADMIN_EMAIL ADMIN_PASSWORD
bun run db:seed
```

The seed creates services, working hours, add-ons, and the admin user. It is idempotent when intentionally rerun, but it must not run automatically on every restart.

### 5. CI/CD release flow and verification

The normal release flow is:

1. Push to `master` or start **Build and deploy** manually in GitHub Actions.
2. GitHub Actions installs dependencies and runs `bun run build`.
3. The workflow builds and pushes `ghcr.io/imsadegh/nakhlespa:latest` and the commit SHA tag.
4. The workflow calls Dokploy's `POST /api/compose.deploy` endpoint with the Compose ID.
5. Dokploy pulls the new image and recreates the services while retaining named volumes.

Check the public home page, admin login, customer OTP login, booking flow, payment callback, and reminder queue. Confirm `worker-sms` logs show a running BullMQ worker and that PostgreSQL/Redis have no public listener. After verification, enable the Zarinpal callback for the production domain.

If the image publish succeeds but the Dokploy call fails, use Dokploy's manual deploy after checking `DOKPLOY_URL`, `DOKPLOY_API_KEY`, and `DOKPLOY_COMPOSE_ID`. If a deployment fails, keep the previous image tag available and redeploy it by temporarily setting `NAKHLESPA_IMAGE` to its commit SHA tag; restore `latest` after the fix. Never delete the database or Redis volumes as a rollback step.

### 6. Backups and database access

Enable scheduled PostgreSQL backups in Dokploy or on the VPS and copy them to storage outside the server. Retain the `postgres_data` and `redis_data` volumes across redeployments; containers are replaceable, data is not.

For emergency database access, use Dokploy's terminal or an SSH tunnel through the VPS. Never publish PostgreSQL or Redis ports to the public internet. Review the current container/service names after every redeploy rather than relying on an old generated container name.

---

### SMS.ir Template Setup

This app uses SMS.ir's **Verify** API (`POST /v1/send/verify`) with five separate templates — one per message type. Each template uses named parameters (`{name}`, `{service}`, etc.). Create and approve the templates in the SMS.ir panel, then copy their numeric IDs into the Dokploy environment variables.

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
