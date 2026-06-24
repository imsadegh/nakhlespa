# نخلسپا — Nakhlespa

Persian spa booking web app. Customers browse services and book appointments through a guided wizard with Zarinpal payment integration. Admins manage bookings, working hours, and blocked slots through a protected dashboard.

**Stack:** Next.js 16 · Prisma v7 · Better Auth · BullMQ · Redis · Tailwind v4 · Bun

---

## Prerequisites

- [Bun](https://bun.sh) — `curl -fsSL https://bun.sh/install | bash`
- [Docker](https://www.docker.com/products/docker-desktop) or [OrbStack](https://orbstack.dev) (macOS) / [Podman](https://podman.io) (Ubuntu VPS) — for Postgres and Redis containers
- [Homebrew](https://brew.sh) (macOS) or native package manager (Linux) — for native Postgres/Redis install

---

## Local Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Start Postgres and Redis locally

**Option A — Docker/Podman (easiest):**
```bash
podman run -d --name postgres-nakhlespa -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=nakhlespa -p 5432:5432 postgres:16-alpine
podman run -d --name redis-nakhlespa -p 6379:6379 redis:7-alpine
```

**Option B — Native install (macOS):**
```bash
brew install postgresql redis
brew services start postgresql
brew services start redis
createdb nakhlespa
```

### 3. Configure environment

Create `.env.local` (Next.js runtime):

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/nakhlespa
BETTER_AUTH_SECRET=dev-secret-not-for-production
REDIS_URL=redis://127.0.0.1:6379
ZARINPAL_MERCHANT_ID=your_merchant_id
ZARINPAL_CALLBACK_URL=http://localhost:3000/api/bookings/verify
SMSIR_API_KEY=your_api_key
SMSIR_TEMPLATE_CONFIRM=<template id for customer confirmation>
SMSIR_TEMPLATE_ADMIN=<template id for admin notification>
SMSIR_TEMPLATE_REMINDER_24H=<template id for 24h reminder>
SMSIR_TEMPLATE_REMINDER_2H=<template id for 2h reminder>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_PHONE=+989XXXXXXXXX
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=DevPassword123
```

Create `.env` (Prisma CLI — must match `DATABASE_URL` above):

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/nakhlespa
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

Admin routes (`/admin/dashboard`, `/admin/bookings`, `/admin/schedule`) are protected by `src/proxy.ts` — unauthenticated requests redirect to `/admin`.

---

## Useful Commands

```bash
bun run build          # Production build
bunx prisma studio     # Visual DB browser at http://localhost:5555
podman ps              # Show running containers (Postgres, Redis)
```

---

## VPS Deployment (Ubuntu)

### 1. Install system dependencies

```bash
# Install Brew Package Manager:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# add Homebrew to your PATH:
echo >> /home/nakhles/.bashrc
echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv bash)"' >> /home/nakhles/.bashrc
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv bash)"

# this will prevent analytics from ever being sent:
brew analytics off

# Install Homebrew's dependencies
sudo apt-get install build-essential
brew install gcc

# ----
# Homebrew's Linux sandbox requires rootless Bubblewrap and unprivileged
# user namespaces. Check and update this system configuration:

sudo sysctl -w kernel.unprivileged_userns_clone=1
    # Allows unprivileged processes to create user namespaces. Rootless
    # Bubblewrap needs this to isolate builds without elevated privileges.

sudo sysctl -w user.max_user_namespaces=28633
    # Allows each user to allocate enough user namespaces. A zero or low
    # limit can prevent Bubblewrap from creating its sandbox.

sudo sysctl -w kernel.apparmor_restrict_unprivileged_userns=0 || true
    # Allows unprivileged user namespaces on AppArmor-enabled systems
    # that restrict them by default. Older kernels may not provide this
    # setting.
# ---

# Bun
brew install oven-sh/bun/bun
source ~/.bashrc

# Node.js (needed for PM2)
brew install node@24
brew link node@24

# PM2 process manager
npm install -g pm2

# Nginx
sudo apt-get install -y nginx

# Podman + required runtime dependencies
brew install podman conmon crun passt

# Podman looks for conmon, crun, and pasta in system paths — symlink from Homebrew
sudo mkdir -p /usr/local/libexec/podman /usr/local/bin
sudo ln -sf $(which conmon) /usr/local/libexec/podman/conmon
sudo ln -sf $(which crun) /usr/local/bin/crun
sudo ln -sf $(which pasta) /usr/local/bin/pasta

# Enable the Podman socket for your user (used for running Redis container)
systemctl --user enable --now podman.socket
loginctl enable-linger $USER   # keep socket alive after logout
# Point the Docker client env var to the Podman socket
echo 'export DOCKER_HOST=unix:///run/user/$(id -u)/podman/podman.sock' >> ~/.bashrc
echo 'export DOCKER_HOST=unix:///run/user/$(id -u)/podman/podman.sock' >> ~/.profile
source ~/.bashrc
```

### 2. Clone and install

```bash
git clone <your-repo-url> /var/www/nakhlespa
sudo chown -R $USER:$USER /var/www/nakhlespa
cd /var/www/nakhlespa
bun install
```

if you got error for download and install, you can try to download with global server:

```bash
bun install --registry https://registry.npmjs.org
```

### 3. Start Postgres and Redis

Postgres is installed natively:
```bash
sudo systemctl status postgresql   # should show active (running)
```

Redis runs as a dedicated Podman container on port **6380** (port 6379 is reserved for other services on the VPS):

```bash
podman run -d \
  --name redis-nakhlespa \
  --restart=always \
  -p 127.0.0.1:6380:6379 \
  redis:7-alpine \
  redis-server --requirepass your_strong_redis_password

# Verify it's running
redis-cli -p 6380 -a your_strong_redis_password ping
# Expected: PONG
```

**Enable auto-restart on reboot:**
```bash
podman generate systemd --name redis-nakhlespa --files --new
mkdir -p ~/.config/systemd/user
mv container-redis-nakhlespa.service ~/.config/systemd/user/
systemctl --user enable --now container-redis-nakhlespa.service
```

Check it's running:
```bash
podman ps | grep redis-nakhlespa   # should show redis:7-alpine on 127.0.0.1:6380->6379/tcp
```

### 4. Configure environment

Create `/var/www/nakhlespa/.env.local`:

```bash
DATABASE_URL=postgresql://nakhlespa:your_password@127.0.0.1:5432/nakhlespa
BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
REDIS_URL=redis://:your_strong_redis_password@127.0.0.1:6380
ZARINPAL_MERCHANT_ID=your_merchant_id
ZARINPAL_CALLBACK_URL=https://yourdomain.com/api/bookings/verify
SMSIR_API_KEY=your_api_key
SMSIR_TEMPLATE_CONFIRM=<template id for customer confirmation>
SMSIR_TEMPLATE_ADMIN=<template id for admin notification>
SMSIR_TEMPLATE_REMINDER_24H=<template id for 24h reminder>
SMSIR_TEMPLATE_REMINDER_2H=<template id for 2h reminder>
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
ADMIN_PHONE=+989XXXXXXXXX
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourStrongPassword
```

Create `/var/www/nakhlespa/.env` (Prisma CLI):

```bash
DATABASE_URL=postgresql://nakhlespa:your_password@127.0.0.1:5432/nakhlespa
```

### 5. Migrate, seed, and build

```bash
cd /var/www/nakhlespa
bunx prisma migrate deploy      # applies all pending migrations including Better Auth tables
bunx prisma generate
ADMIN_EMAIL=admin@yourdomain.com ADMIN_PASSWORD=YourStrongPassword bun prisma/seed.ts
bun run build
```

The seed reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env.local` to create the admin user. Run it once — it is idempotent.

### 6. Start with PM2

The project includes `ecosystem.config.js` configured for 2 cluster instances.

```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
# Copy and run the printed sudo command, e.g.:
# sudo env PATH=$PATH:/home/linuxbrew/.linuxbrew/Cellar/node@24/24.16.0/bin \
#   /home/linuxbrew/.linuxbrew/lib/node_modules/pm2/bin/pm2 startup systemd -u nakhles --hp /home/nakhles
pm2 save                        # save again after running the startup command
```

Check status:

```bash
pm2 status
pm2 logs nakhlespa
```

### 7. Configure Nginx

ArvanCloud CDN terminates HTTPS at the edge. The VPS listens on both port 80 (redirect) and 443 (self-signed cert for CDN↔origin encryption).

Generate a self-signed certificate for ArvanCloud→VPS encryption (ArvanCloud accepts self-signed; users see ArvanCloud's valid cert):

```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/nakhlespa-selfsigned.key \
  -out /etc/ssl/certs/nakhlespa-selfsigned.crt \
  -subj "/C=IR/ST=Tehran/L=Tehran/O=Nakhlespa/CN=nakhlespa.ir"

sudo chmod 600 /etc/ssl/private/nakhlespa-selfsigned.key
sudo chmod 644 /etc/ssl/certs/nakhlespa-selfsigned.crt
```

Copy the reference config and enable the site:

```bash
sudo cp /var/www/nakhlespa/nginx.conf /etc/nginx/sites-available/nakhlespa
# Edit the file to replace nakhlespa.ir with your actual domain if needed
sudo nano /etc/nginx/sites-available/nakhlespa

sudo ln -s /etc/nginx/sites-available/nakhlespa /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

The reference `nginx.conf` listens on both port 80 and 443, both IPv4 and IPv6, and proxies all traffic to the Next.js app on port 3000. Auth calls from the browser go to Next.js API routes (`/api/auth/*`) which validate sessions using Better Auth.

> **Shared VPS note:** `default_server` only affects requests that don't match any other `server_name`. Other sites (e.g. `hakimyar.ir`) continue to work via their own configs. Both IPv4 and IPv6 `default_server` must be set — missing `[::]` causes IPv6 requests to fall through to another site.

### 8. SSL via ArvanCloud CDN

Since the domain is proxied through ArvanCloud, SSL is handled at the CDN edge — **do not install Certbot on the VPS**.

1. Go to ArvanCloud dashboard → your domain → **SSL**
2. Enable **ArvanCloud Certificate** (free, auto-renewed)
3. Set SSL mode to **Full** (CDN↔origin over HTTP is fine since both ends are controlled)

Traffic flow: `User → HTTPS → ArvanCloud → HTTP → VPS`

---

### SMS.ir Template Setup

This app uses SMS.ir's **Verify** API (`POST /v1/send/verify`) with 4 separate templates — one per message type. Each template uses named parameters (`{name}`, `{service}`, etc.).

**Step 1 — Create 4 templates in the SMS.ir panel:**

1. Log in to [app.sms.ir](https://app.sms.ir)
2. Go to **پنل** → **الگوهای پیامک** (SMS Templates)
3. Create each template below, wait for approval, then copy the numeric Template ID

| # | Env var | Template body |
|---|---------|---------------|
| 1 | `SMSIR_TEMPLATE_CONFIRM` | `{name} عزیز، رزرو شما برای {service} در تاریخ {date} ساعت {time} تأیید شد. کد پیگیری: {refId} — نخلسپا` |
| 2 | `SMSIR_TEMPLATE_ADMIN` | `رزرو جدید: {name} — {service} — {date} {time} — تلفن: {phone}` |
| 3 | `SMSIR_TEMPLATE_REMINDER_24H` | `{name} عزیز، یادآوری: نوبت {service} شما فردا ساعت {time} است — نخلسپا` |
| 4 | `SMSIR_TEMPLATE_REMINDER_2H` | `{name} عزیز، یادآوری: نوبت {service} شما ۲ ساعت دیگر ساعت {time} است — نخلسپا` |

**Step 2 — Add the Template IDs to `.env.local`:**

```
SMSIR_TEMPLATE_CONFIRM=123456
SMSIR_TEMPLATE_ADMIN=123457
SMSIR_TEMPLATE_REMINDER_24H=123458
SMSIR_TEMPLATE_REMINDER_2H=123459
```

**When each message is sent:**

| Template | Trigger | Recipient |
|----------|---------|-----------|
| `CONFIRM` | Payment verified | Customer |
| `ADMIN` | Payment verified | `ADMIN_PHONE` |
| `REMINDER_24H` | 24h before appointment (BullMQ delayed job) | Customer |
| `REMINDER_2H` | 2h before appointment (BullMQ delayed job) | Customer |

---

### Updating the app

```bash
cd /var/www/nakhlespa
git pull
bun install
bunx prisma migrate deploy
bun run build
pm2 reload nakhlespa
```

