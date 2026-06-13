# نخلسپا — Nakhlespa

Persian spa booking web app. Customers browse services and book appointments through a guided wizard with Zarinpal payment integration. Admins manage bookings, working hours, and blocked slots through a protected dashboard.

**Stack:** Next.js 16 · Prisma v7 · Supabase Auth · Tailwind v4 · Bun

---

## Prerequisites

- [Bun](https://bun.sh) — `curl -fsSL https://bun.sh/install | bash`
- [Supabase CLI](https://supabase.com/docs/guides/cli) — `brew install supabase/tap/supabase`
- [Docker](https://www.docker.com/products/docker-desktop) or [OrbStack](https://orbstack.dev) (macOS) / [Podman](https://podman.io) (Ubuntu VPS) — required by Supabase local

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

# Enable the Podman socket for your user (Supabase CLI uses it instead of Docker socket)
systemctl --user enable --now podman.socket
loginctl enable-linger $USER   # keep socket alive after logout
# Point the Docker client env var to the Podman socket
echo 'export DOCKER_HOST=unix:///run/user/$(id -u)/podman/podman.sock' >> ~/.bashrc
echo 'export DOCKER_HOST=unix:///run/user/$(id -u)/podman/podman.sock' >> ~/.profile
source ~/.bashrc

# Supabase CLI:
 #brew - recommended:
 brew install supabase/tap/supabase
 # project local (for user-local only):
 curl -fsSL https://raw.githubusercontent.com/supabase/cli/main/install | bash
 # Global:
 sudo curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | sudo tar -xz -C /usr/local/bin
```

### 2. Clone and install

```bash
git clone <your-repo-url> /var/www/nakhlespa
sudo chown -R $USER:$USER /var/www/nakhlespa
cd /var/www/nakhlespa
bun install
```

### 3. Start Supabase

```bash
supabase start
```

on low ram vps:
Disable Analytics Properly via supabase Config `supabase/config.toml`:

```toml
[analytics]
enabled = false
```

then run it with

```bash
supabase start --exclude analytics,vector,storage,imgproxy,mailpit
```

Copy the printed `API URL`, `anon key`, `service_role key`, and `DB URL`.

### 4. Configure environment

Create `/var/www/nakhlespa/.env.local`:

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Server-side only — loopback is fine, never sent to the browser
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>

# NEXT_PUBLIC_* vars are embedded in the browser bundle.
# Auth is handled entirely via /api/auth/* server routes, so the browser
# never calls Supabase directly — these values are never used at runtime,
# but Next.js requires them to be defined to avoid build-time errors.
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
bunx prisma generate
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

### 8. Configure Nginx

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

The reference `nginx.conf` listens on both port 80 and 443, both IPv4 and IPv6, and proxies all traffic to the Next.js app on port 3000. Auth calls from the browser go to Next.js API routes (`/api/auth/*`) which call Supabase server-side over loopback — the browser never reaches Supabase directly.

> **Shared VPS note:** `default_server` only affects requests that don't match any other `server_name`. Other sites (e.g. `hakimyar.ir`) continue to work via their own configs. Both IPv4 and IPv6 `default_server` must be set — missing `[::]` causes IPv6 requests to fall through to another site.

### 9. SSL via ArvanCloud CDN

Since the domain is proxied through ArvanCloud, SSL is handled at the CDN edge — **do not install Certbot on the VPS**.

1. Go to ArvanCloud dashboard → your domain → **SSL**
2. Enable **ArvanCloud Certificate** (free, auto-renewed)
3. Set SSL mode to **Full** (CDN↔origin over HTTP is fine since both ends are controlled)

Traffic flow: `User → HTTPS → ArvanCloud → HTTP → VPS`

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

Supabase runs in Podman containers that stop on reboot. The Podman socket is kept alive via `loginctl enable-linger` (set during install). Add a cron entry to restart Supabase itself:

```bash
crontab -e
# Add:
@reboot sleep 10 && export DOCKER_HOST=unix:///run/user/$(id -u)/podman/podman.sock && cd /var/www/nakhlespa && supabase start --exclude logflare,vector,imgproxy,mailpit,storage-api >> /var/log/supabase-start.log 2>&1
```

Two things are required in the cron entry:
- `sleep 10` — gives the Podman socket time to come up before Supabase tries to connect
- `export DOCKER_HOST=...` — cron doesn't source `.bashrc`, so the env var must be set inline
