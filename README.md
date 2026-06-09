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

---

## VPS Deployment (Ubuntu)

### 1. Install system dependencies

```bash
# Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# Node.js (needed for PM2)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 process manager
sudo npm install -g pm2

# Nginx
sudo apt-get install -y nginx

# Docker (required by Supabase)
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt-get update && sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER   # then log out and back in

# Supabase CLI
sudo curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | sudo tar -xz -C /usr/local/bin
```

### 2. Clone and install

```bash
git clone <your-repo-url> /var/www/nakhlespa
cd /var/www/nakhlespa
bun install
```

### 3. Start Supabase

```bash
supabase start
```

Copy the printed `API URL`, `anon key`, `service_role key`, and `DB URL`.

### 4. Configure environment

Create `/var/www/nakhlespa/.env.local`:

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>

ZARINPAL_MERCHANT_ID=your_merchant_id
ZARINPAL_CALLBACK_URL=https://yourdomain.com/api/bookings/verify

SMSIR_API_KEY=your_api_key
SMSIR_LINE_NUMBER=your_line_number

NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

Create `/var/www/nakhlespa/.env` (Prisma CLI):

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### 5. Migrate, seed, and build

```bash
cd /var/www/nakhlespa
bunx prisma migrate deploy      # use deploy (not dev) in production
bun prisma/seed.ts
bun run build
```

### 6. Create admin user

```bash
supabase auth add-user --email admin@yourdomain.com --password YourStrongPassword
```

### 7. Start with PM2

The project includes `ecosystem.config.js` configured for 2 cluster instances.

```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup                     # follow the printed command to enable on boot
```

Check status:

```bash
pm2 status
pm2 logs nakhlespa
```

### 8. Configure Nginx

Copy the reference config and enable the site:

```bash
sudo cp /var/www/nakhlespa/nginx.conf /etc/nginx/sites-available/nakhlespa
# Edit the file to replace nakhlespa.ir with your actual domain
sudo nano /etc/nginx/sites-available/nakhlespa

sudo ln -s /etc/nginx/sites-available/nakhlespa /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 9. SSL with Certbot

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot auto-renews via a systemd timer. Verify: `sudo certbot renew --dry-run`

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

### Keep Supabase running across reboots

Supabase runs in Docker containers that stop on reboot. Add a cron entry to restart it:

```bash
crontab -e
# Add:
@reboot cd /var/www/nakhlespa && supabase start >> /var/log/supabase-start.log 2>&1
```
