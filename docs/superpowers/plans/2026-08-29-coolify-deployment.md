# Nakhlespa Coolify Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Package Nakhlespa as a single Coolify Docker Compose resource with a public Next.js service, private PostgreSQL and Redis, and a dedicated SMS worker.

**Architecture:** Build one production image from a multi-stage Bun Dockerfile. Run that image as `web` and `worker-sms`; keep PostgreSQL and Redis private behind the Compose network with named persistent volumes. Remove production worker startup from Next.js instrumentation so only the explicit worker service consumes BullMQ jobs.

**Tech Stack:** Next.js 16.2.6, Bun, Prisma 7, PostgreSQL 17 Alpine, Redis 7 Alpine, BullMQ, Docker Compose, Coolify Traefik.

## Global Constraints

- Use one Coolify Docker Compose resource; assign the public domain only to `web`.
- Do not add a custom Docker network or a second reverse proxy.
- Do not publish PostgreSQL or Redis ports in the production Compose file.
- Use `postgres` and `redis` as internal service hostnames; never use `localhost` between containers.
- Preserve the existing local `compose.yaml` host ports `5434` and `6380`.
- Production secrets must be supplied by Coolify and must not be committed.
- Keep application behavior, database schema, payment behavior, SMS templates, and UI unchanged.

---

### Task 1: Add deterministic standalone SMS worker entrypoint

**Files:**
- Create: `src/workers/sms.worker.ts`
- Modify: `src/instrumentation.ts`
- Test: `tests/sms-worker-entrypoint.test.ts`

**Interfaces:**
- Consumes: existing `startSmsWorker()` from `src/lib/queue.ts`, returning a BullMQ `Worker`.
- Produces: a worker process that starts exactly one SMS worker and closes it on SIGTERM/SIGINT.

- [ ] **Step 1: Write the failing test**

Add a focused source-contract test that confirms production instrumentation no longer starts the worker and that the standalone entrypoint imports the existing worker starter and registers shutdown handlers. Keep the test independent of Redis by reading the two source files as text.

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'bun:test'

describe('production SMS worker boundary', () => {
  test('does not start BullMQ from Next instrumentation', () => {
    const source = readFileSync('src/instrumentation.ts', 'utf8')
    expect(source).not.toContain('startSmsWorker()')
  })

  test('standalone worker owns startup and shutdown', () => {
    const source = readFileSync('src/workers/sms.worker.ts', 'utf8')
    expect(source).toContain("import { startSmsWorker } from '@/lib/queue'")
    expect(source).toContain('startSmsWorker()')
    expect(source).toContain("process.on('SIGTERM'")
    expect(source).toContain("process.on('SIGINT'")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/sms-worker-entrypoint.test.ts`

Expected: FAIL because `instrumentation.ts` currently calls `startSmsWorker()` and the entrypoint does not exist.

- [ ] **Step 3: Write the minimal implementation**

Create the entrypoint with an idempotent close handler:

```ts
import { startSmsWorker } from '@/lib/queue'

const worker = startSmsWorker()
let closing = false

async function shutdown(signal: string) {
  if (closing) return
  closing = true
  console.log(`Stopping SMS worker after ${signal}`)
  await worker.close()
  process.exit(0)
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))
```

Change `src/instrumentation.ts` to export an empty `register()` function so the web service does not create a BullMQ worker:

```ts
export async function register() {}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/sms-worker-entrypoint.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/workers/sms.worker.ts src/instrumentation.ts tests/sms-worker-entrypoint.test.ts
git commit -m "feat: isolate SMS worker process"
```

### Task 2: Add production image and Compose resource

**Files:**
- Create: `.dockerignore`
- Create: `Dockerfile`
- Create: `compose.production.yml`
- Modify: `package.json`
- Test: `tests/production-compose.test.ts`

**Interfaces:**
- Consumes: Task 1’s `src/workers/sms.worker.ts` and the existing `bun run build` / `bun run start` scripts.
- Produces: production image `nakhlespa-app:production`, services `web`, `postgres`, `redis`, and `worker-sms`.

- [ ] **Step 1: Write the failing test**

Add a static Compose contract test:

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'bun:test'

const compose = readFileSync('compose.production.yml', 'utf8')

describe('production Compose contract', () => {
  test('defines the four required services', () => {
    for (const service of ['web:', 'postgres:', 'redis:', 'worker-sms:']) {
      expect(compose).toContain(service)
    }
  })

  test('publishes only the web service', () => {
    expect(compose).toContain('expose:\n      - "3000"')
    expect(compose).not.toMatch(/postgres:[\s\S]*?ports:/)
    expect(compose).not.toMatch(/redis:[\s\S]*?ports:/)
    expect(compose).not.toMatch(/worker-sms:[\s\S]*?ports:/)
  })

  test('uses private service DNS and persistent volumes', () => {
    expect(compose).toContain('@postgres:5432')
    expect(compose).toContain('redis://redis:6379')
    expect(compose).toContain('postgres_data:')
    expect(compose).toContain('redis_data:')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/production-compose.test.ts`

Expected: FAIL because the production Dockerfile, Compose file, and service contract do not exist.

- [ ] **Step 3: Write the minimal implementation**

Create a multi-stage `Dockerfile` based on `oven/bun:1.4.0`: install frozen dependencies, run `bun run build`, install production dependencies, copy `.next`, `public`, `src`, `package.json`, and `tsconfig.json`, run as user `bun`, expose 3000, and default to `bun run start`.

Create `.dockerignore` excluding `node_modules`, `.next`, `.git`, all `.env` files, `graphify-out`, and `coverage`.

Add this package script:

```json
"worker:sms": "bun run src/workers/sms.worker.ts"
```

Create `compose.production.yml` with these exact service contracts:

```yaml
services:
  web:
    image: nakhlespa-app:production
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    expose:
      - "3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      REDIS_URL: redis://redis:6379
      BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}
      ZARINPAL_MERCHANT_ID: ${ZARINPAL_MERCHANT_ID}
      ZARINPAL_CALLBACK_URL: ${ZARINPAL_CALLBACK_URL}
      SMSIR_API_KEY: ${SMSIR_API_KEY}
      SMSIR_TEMPLATE_CONFIRM: ${SMSIR_TEMPLATE_CONFIRM}
      SMSIR_TEMPLATE_ADMIN: ${SMSIR_TEMPLATE_ADMIN}
      SMSIR_TEMPLATE_REMINDER_24H: ${SMSIR_TEMPLATE_REMINDER_24H}
      SMSIR_TEMPLATE_REMINDER_2H: ${SMSIR_TEMPLATE_REMINDER_2H}
      SMSIR_TEMPLATE_OTP: ${SMSIR_TEMPLATE_OTP}
      NEXT_PUBLIC_SITE_URL: ${NEXT_PUBLIC_SITE_URL}
      ADMIN_PHONE: ${ADMIN_PHONE}
      ADMIN_EMAIL: ${ADMIN_EMAIL}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started

  postgres:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: ["redis-server", "--appendonly", "yes"]
    volumes:
      - redis_data:/data

  worker-sms:
    image: nakhlespa-app:production
    restart: unless-stopped
    command: ["bun", "run", "worker:sms"]
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      REDIS_URL: redis://redis:6379
      SMSIR_API_KEY: ${SMSIR_API_KEY}
      SMSIR_TEMPLATE_REMINDER_24H: ${SMSIR_TEMPLATE_REMINDER_24H}
      SMSIR_TEMPLATE_REMINDER_2H: ${SMSIR_TEMPLATE_REMINDER_2H}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started

volumes:
  postgres_data:
  redis_data:
```

- [ ] **Step 4: Run tests and Compose validation**

Run: `bun test tests/production-compose.test.ts`

Expected: PASS.

Run: `docker compose --env-file .env.example -f compose.production.yml config`

Expected: valid rendered Compose configuration. If Docker is unavailable, run the test and inspect the rendered structure with an installed YAML parser instead.

- [ ] **Step 5: Commit**

```bash
git add .dockerignore Dockerfile compose.production.yml package.json tests/production-compose.test.ts
git commit -m "feat: add Coolify production Compose stack"
```

### Task 3: Define deployment variables and Coolify runbook

**Files:**
- Create: `.env.example`
- Modify: `README.md`
- Test: `tests/deployment-docs.test.ts`

**Interfaces:**
- Consumes: Task 2’s service names, ports, Compose interpolation variables, and image commands.
- Produces: reproducible local variable reference and a Coolify-specific operator runbook.

- [ ] **Step 1: Write the failing test**

Add a documentation contract test:

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'bun:test'

describe('deployment documentation contract', () => {
  test('documents required production variables', () => {
    const env = readFileSync('.env.example', 'utf8')
    for (const key of ['DB_USER', 'DB_PASSWORD', 'DB_NAME', 'BETTER_AUTH_SECRET', 'ZARINPAL_MERCHANT_ID', 'SMSIR_API_KEY', 'NEXT_PUBLIC_SITE_URL']) {
      expect(env).toContain(`${key}=`)
    }
  })

  test('documents Coolify Compose deployment and initialization', () => {
    const readme = readFileSync('README.md', 'utf8')
    expect(readme).toContain('Coolify')
    expect(readme).toContain('compose.production.yml')
    expect(readme).toContain('prisma migrate deploy')
    expect(readme).toContain('worker-sms')
    expect(readme).toContain('Do not open')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/deployment-docs.test.ts`

Expected: FAIL because `.env.example` and the Coolify runbook sections do not exist.

- [ ] **Step 3: Write the minimal implementation**

Create `.env.example` with safe placeholders for all Compose interpolation and application variables. Document local URLs using `127.0.0.1:5434` and `127.0.0.1:6380`; document production URLs in README using `postgres:5432` and `redis:6379`. Never include real credentials.

Replace the obsolete VPS/PM2/Nginx deployment instructions in `README.md` with: Coolify installation, Traefik-only routing, one Compose resource, public domain only on `web`, private PostgreSQL/Redis, Coolify environment setup, first deployment, Prisma migration/seed commands, SMS template configuration, SSH-tunneled database access, and webhook enablement after verification. Keep local setup and application route documentation intact.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test tests/deployment-docs.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .env.example README.md tests/deployment-docs.test.ts
git commit -m "docs: document Nakhlespa Coolify deployment"
```

### Task 4: Full verification and review

**Files:**
- Modify: only files from Tasks 1–3 if verification exposes a defect.

**Interfaces:**
- Consumes: the complete production deployment stack.
- Produces: verified build, tests, Compose configuration, and clean deployment diff.

- [ ] **Step 1: Run the complete test suite**

Run: `bun test`

Expected: all tests pass, including existing customer OTP tests.

- [ ] **Step 2: Run the production build**

Run: `bun run build`

Expected: Next.js production build completes successfully with no missing worker/module errors.

- [ ] **Step 3: Validate the production Compose file**

Run: `docker compose --env-file .env.example -f compose.production.yml config`

Expected: configuration renders successfully; only `web` has an exposed application port, and no internal service has a `ports:` mapping.

- [ ] **Step 4: Review the final diff**

Run: `git diff HEAD~3..HEAD --stat && git diff HEAD~3..HEAD --check`

Expected: only deployment, worker-boundary, environment-example, documentation, and test files changed; no secrets, unrelated UI changes, schema changes, or local Compose regressions appear.

- [ ] **Step 5: Commit any verification fix**

```bash
git add <only-files-fixed-by-verification>
git commit -m "fix: verify Coolify deployment configuration"
```
