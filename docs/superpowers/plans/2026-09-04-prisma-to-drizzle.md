# Prisma to Drizzle Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Prisma completely with Drizzle ORM while preserving the existing PostgreSQL schema, data, authentication, and application behavior.

**Architecture:** Define the current PostgreSQL schema once in `src/db/schema.ts`, expose a shared `pg`-backed Drizzle client from `src/lib/db.ts`, and migrate all server-side database access to typed Drizzle queries. Use Drizzle Kit for a non-destructive baseline and future migrations, and use Better Auth’s Drizzle adapter against the existing auth tables.

**Tech Stack:** Next.js 16.2.6, TypeScript, Bun, PostgreSQL, `pg`, `drizzle-orm`, `drizzle-kit`, `@better-auth/drizzle-adapter`, Better Auth, BullMQ, Redis.

## Global Constraints

- Preserve the existing PostgreSQL schema and data; do not run `prisma migrate reset`, `drizzle-kit push`, or any destructive reset/recreate operation against the configured database.
- Keep Better Auth, PostgreSQL, BullMQ, Redis, SMS.ir, Zarinpal, booking behavior, and UI behavior unchanged.
- Replace Prisma completely: no Prisma runtime/build imports or Prisma deployment commands remain after the migration.
- The existing `DATABASE_URL` remains the database connection source.
- Verify typechecking, tests, production build, and a static scan before claiming completion.
- Do not modify unrelated graphify artifacts or pre-existing documentation changes.

---

## File map

Create `src/db/schema.ts` for all application and Better Auth tables, PostgreSQL enums, relations, indexes, defaults, and existing table names. Create `src/lib/db.ts` for the shared Drizzle client and `drizzle.config.ts` for Drizzle Kit. Replace `prisma/seed.ts` with `src/db/seed.ts`.

Modify `src/lib/auth.ts`, `src/lib/queue.ts`, `src/lib/slots.ts`, `src/lib/discounts.ts`, every route/page listed in Tasks 4–5, `package.json`, `bun.lock`, `Dockerfile`, `compose.production.yml`, `README.md`, `CLAUDE.md`, and the Prisma-specific deployment tests. Remove `src/lib/prisma.ts`, `prisma.config.ts`, `prisma/schema.prisma`, and the Prisma migration directory only after the Drizzle baseline and all consumers are verified.

---

### Task 1: Add Drizzle dependencies and database primitives

**Files:**
- Create: `src/db/schema.ts`
- Create: `src/lib/db.ts`
- Create: `drizzle.config.ts`
- Modify: `package.json`
- Modify: `bun.lock`

**Interfaces:**
- Produces `db`, a shared Drizzle PostgreSQL database instance exported from `src/lib/db.ts`.
- Produces schema exports for all tables and enum constants consumed by later tasks.

- [ ] **Step 1: Add the required packages**

Run:

```bash
bun add drizzle-orm @better-auth/drizzle-adapter
bun add -d drizzle-kit
```

Expected: `package.json` and `bun.lock` contain the three Drizzle packages and the command exits with status 0.

- [ ] **Step 2: Define the shared PostgreSQL client**

Create `src/lib/db.ts` with a `pg` pool and Drizzle wrapper. Use a `globalThis` cache in development so hot reload does not create unbounded pools:

```ts
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

const globalForDb = globalThis as unknown as { db?: ReturnType<typeof drizzle> }

function createDb() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
  return drizzle(pool)
}

export const db = globalForDb.db ?? createDb()

if (process.env.NODE_ENV !== 'production') globalForDb.db = db
```

- [ ] **Step 3: Define every existing table and enum**

Translate `prisma/schema.prisma` into `src/db/schema.ts` using `pgEnum`, `pgTable`, `uuid`, `date`, `timestamp`, `integer`, `boolean`, and `text`. Preserve exact table names (`services`, `addons`, `booking_addons`, `working_hours`, `blocked_slots`, `bookings`, `sms_reminders`, `user`, `session`, `account`, `verification`, `customer_sessions`, `discount_codes`), column names, nullable fields, defaults, unique constraints, foreign keys, cascade behavior, and indexes. Export inferred `Select` and `Insert` types for tables used by application code.

- [ ] **Step 4: Configure Drizzle Kit**

Create `drizzle.config.ts` with schema `./src/db/schema.ts`, output `./drizzle`, dialect `postgresql`, and `process.env.DATABASE_URL` loaded from the project environment. The config must not contain Prisma imports or Prisma paths.

- [ ] **Step 5: Typecheck the primitives**

Run:

```bash
bunx tsc --noEmit
```

Expected: no errors attributable to the new schema/client files. Existing Prisma consumers may still fail until later tasks.

- [ ] **Step 6: Commit the primitive layer**

```bash
git add package.json bun.lock src/db/schema.ts src/lib/db.ts drizzle.config.ts
git commit -m "feat: add Drizzle database layer"
```

### Task 2: Establish a non-destructive Drizzle migration baseline

**Files:**
- Create: `drizzle/` migration files and metadata generated by Drizzle Kit
- Create: `tests/drizzle-migration.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces `db:migrate`, `db:generate`, and `db:seed` scripts for later deployment and local development.

- [ ] **Step 1: Add migration scripts**

Add these exact scripts to `package.json`:

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:seed": "bun src/db/seed.ts"
```

- [ ] **Step 2: Generate the baseline migration**

Run `bunx drizzle-kit generate --name baseline` using the schema from Task 1. Because the target database already contains the Prisma-created tables, inspect the generated SQL and turn the first migration into a baseline that does not create, drop, or alter existing application tables. Keep the generated Drizzle journal metadata valid.

- [ ] **Step 3: Add static migration safety assertions**

Create `tests/drizzle-migration.test.ts` that reads the baseline SQL and asserts it contains no `DROP TABLE`, `DROP TYPE`, `CREATE TABLE`, or `ALTER TABLE` statements for the existing schema. The test must also assert that `drizzle.config.ts` points at `src/db/schema.ts` and the `drizzle` output directory.

- [ ] **Step 4: Validate migration SQL without production credentials**

Run:

```bash
bun test tests/drizzle-migration.test.ts
```

Expected: PASS. If a disposable PostgreSQL database is available, run `bunx drizzle-kit migrate` against a clone and confirm it creates only Drizzle’s migration bookkeeping table and records the baseline.

- [ ] **Step 5: Commit the migration baseline**

```bash
git add drizzle package.json tests/drizzle-migration.test.ts
git commit -m "feat: baseline Drizzle migrations safely"
```

### Task 3: Migrate Better Auth and seed behavior

**Files:**
- Modify: `src/lib/auth.ts`
- Create: `src/db/seed.ts`
- Remove: `prisma/seed.ts`

**Interfaces:**
- `src/lib/auth.ts` continues exporting the existing Better Auth instance and handlers.
- `src/db/seed.ts` remains executable with `bun src/db/seed.ts` and preserves all current seed records and admin setup.

- [ ] **Step 1: Switch Better Auth’s adapter**

Replace the Prisma adapter import/configuration with `drizzleAdapter` from `better-auth/adapters/drizzle`, pass the shared `db`, and set the PostgreSQL provider to `pg`. Keep all existing auth options, secrets, trusted origins, and callbacks unchanged.

- [ ] **Step 2: Rewrite the seed script**

Convert every Prisma `upsert`, `updateMany`, `findMany`, `findUnique`, and disconnect call in `prisma/seed.ts` to Drizzle operations. Use `onConflictDoUpdate` for unique service/add-on/discount records, explicit `where` predicates for bulk updates, and `db.transaction` where the existing script relies on grouped writes. Preserve the current Persian seed values, working hours, booking seed behavior, and Better Auth admin creation flow.

- [ ] **Step 3: Run the seed typecheck and static auth scan**

Run:

```bash
bunx tsc --noEmit
rg -n "@prisma|prismaAdapter|PrismaClient|prisma\." src/lib/auth.ts src/db/seed.ts
```

Expected: the scan returns no matches. Do not execute the seed against production during this task.

- [ ] **Step 4: Commit the auth and seed migration**

```bash
git add src/lib/auth.ts src/db/seed.ts
git rm prisma/seed.ts
git commit -m "feat: move auth and seed data to Drizzle"
```

### Task 4: Convert shared server libraries and booking/payment workflows

**Files:**
- Modify: `src/lib/queue.ts`
- Modify: `src/lib/slots.ts`
- Modify: `src/lib/discounts.ts`
- Modify: `src/app/api/bookings/create/route.ts`
- Modify: `src/app/api/bookings/verify/route.ts`
- Modify: `src/app/api/slots/route.ts`
- Modify: `src/app/api/services/route.ts`
- Modify: `src/app/api/working-hours/route.ts`
- Modify: `src/app/api/discounts/validate/route.ts`
- Modify: `src/app/api/discounts/loyalty/route.ts`

**Interfaces:**
- Each module imports `db` from `@/lib/db` and table/enums/types from `@/db/schema`.
- Route response bodies, status codes, payment flow, discount calculations, slot calculations, and SMS reminder semantics remain unchanged.

- [ ] **Step 1: Convert read-only query helpers**

Rewrite slot, discount, service, and working-hours reads with Drizzle predicates. Preserve date comparisons, gender/status filtering, ordering, selected columns, and the `null`/empty-result behavior expected by callers.

- [ ] **Step 2: Convert booking creation and payment verification**

Rewrite inserts, updates, bulk updates/deletes, relation-dependent reads, increment expressions, and both transaction blocks. Use `eq`, `and`, `inArray`, `or`, `isNull`, `gte`, `lt`, `desc`, and `sql` expressions as needed. Preserve generated UUID/token defaults and return the inserted/updated booking values needed by Zarinpal and the response payloads.

- [ ] **Step 3: Convert queue reminder mutations**

Rewrite reminder status updates and error-state writes in `src/lib/queue.ts`. Preserve BullMQ job behavior and the existing `SmsReminderStatus` values by importing the Drizzle enum/type instead of `@prisma/client`.

- [ ] **Step 4: Typecheck and run focused tests**

Run:

```bash
bunx tsc --noEmit
bun test tests/customer-otp.test.ts tests/sms-worker-entrypoint.test.ts
```

Expected: typecheck and both focused test files pass.

- [ ] **Step 5: Commit the shared workflow conversion**

```bash
git add src/lib/queue.ts src/lib/slots.ts src/lib/discounts.ts src/app/api/bookings/create/route.ts src/app/api/bookings/verify/route.ts src/app/api/slots/route.ts src/app/api/services/route.ts src/app/api/working-hours/route.ts src/app/api/discounts/validate/route.ts src/app/api/discounts/loyalty/route.ts
git commit -m "feat: migrate booking workflows to Drizzle"
```

### Task 5: Convert admin and customer pages/routes and shared types

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/components/customer/BookingHistoryList.tsx`
- Modify: `src/components/admin/BookingActions.tsx`
- Modify: `src/app/admin/(panel)/discounts/page.tsx`
- Modify: `src/app/admin/(panel)/bookings/[id]/page.tsx`
- Modify: `src/app/admin/(panel)/bookings/columns.tsx`
- Modify: `src/app/my/bookings/page.tsx`
- Modify: `src/app/my/bookings/[token]/page.tsx`
- Modify: `src/app/book/page.tsx`
- Modify: `src/app/api/admin/discounts/route.ts`
- Modify: `src/app/api/admin/discounts/[id]/route.ts`
- Modify: `src/app/api/admin/bookings/route.ts`
- Modify: `src/app/api/admin/bookings/[id]/route.ts`
- Modify: `src/app/api/admin/schedule/route.ts`
- Modify: `src/app/api/admin/schedule/block/route.ts`
- Modify: `src/app/api/admin/schedule/block/[id]/route.ts`
- Modify: `src/app/api/admin/schedule/hours/route.ts`

**Interfaces:**
- UI components receive the same serializable props and enum string values as before.
- Admin/customer route response JSON and page rendering remain unchanged.

- [ ] **Step 1: Replace Prisma enum/type imports**

Export `BookingStatus` and `Gender` values/types from `src/db/schema.ts` or a focused `src/db/types.ts` module, then update `src/types/index.ts`, booking columns/actions, customer booking components, and pages to use those shared definitions.

- [ ] **Step 2: Convert customer and public reads**

Rewrite the booking history, token lookup, public booking page, and related API reads with Drizzle. Preserve relation data needed by page props, ordering, status labels, date formatting, and not-found behavior.

- [ ] **Step 3: Convert admin reads and writes**

Rewrite discount CRUD, booking status updates, booking detail queries, working-hours updates, blocked-slot creation/deletion, and schedule reads. Preserve validation, authorization checks, response codes, and transaction/bulk-update behavior.

- [ ] **Step 4: Run the full application checks**

Run:

```bash
bunx tsc --noEmit
bun test
```

Expected: no Prisma-related TypeScript errors and no test failures.

- [ ] **Step 5: Commit the UI-facing conversion**

```bash
git add src/types/index.ts src/components/customer/BookingHistoryList.tsx src/components/admin/BookingActions.tsx src/app/admin src/app/my src/app/book src/app/api/admin
git commit -m "feat: migrate admin and customer data access to Drizzle"
```

### Task 6: Remove Prisma tooling and update deployment/documentation

**Files:**
- Modify: `Dockerfile`
- Modify: `compose.production.yml`
- Modify: `README.md`
- Modify: `CLAUDE.md`
- Modify: `tests/production-compose.test.ts`
- Modify: `tests/deployment-docs.test.ts`
- Remove: `src/lib/prisma.ts`
- Remove: `prisma.config.ts`
- Remove: `prisma/schema.prisma`
- Remove: `prisma/migrations/`

**Interfaces:**
- Production startup runs Drizzle migrations before `next start`.
- Seed and local database instructions use the scripts from Task 2.

- [ ] **Step 1: Update container startup**

Change the production web command from `bunx prisma migrate deploy && exec bun run start` to `bun run db:migrate && exec bun run start`. Remove Prisma generate steps and Prisma-only files from the Docker build while copying `drizzle`, `src/db`, and `drizzle.config.ts` as needed for migration/seed operations.

- [ ] **Step 2: Update documentation and tests**

Replace Prisma migration, seed, Studio, schema, and environment instructions with Drizzle commands. Update deployment tests to assert `bun run db:migrate`, absence of Prisma generate/config copies, and consistent Drizzle documentation.

- [ ] **Step 3: Remove Prisma dependencies and files**

Remove `@prisma/adapter-pg`, `@prisma/client`, and `prisma` from `package.json`; remove the Prisma seed configuration. Delete only the Prisma files listed above after confirming `rg` has no source consumers.

- [ ] **Step 4: Run the repository-wide Prisma scan**

Run:

```bash
rg -n "@prisma|PrismaClient|prismaAdapter|prisma migrate|prisma generate|prisma studio|prisma/schema" --glob '!bun.lock' --glob '!docs/superpowers/**' --glob '!graphify-out/**' .
```

Expected: no matches in source, configuration, Docker, tests, README, or CLAUDE.md. Historical design/plan documents may retain references and are excluded intentionally.

- [ ] **Step 5: Commit the removal and deployment changes**

```bash
git add package.json bun.lock Dockerfile compose.production.yml README.md CLAUDE.md tests/production-compose.test.ts tests/deployment-docs.test.ts drizzle.config.ts
git rm src/lib/prisma.ts prisma.config.ts prisma/schema.prisma prisma/migrations
git commit -m "chore: remove Prisma and deploy with Drizzle"
```

### Task 7: Final verification and migration handoff

**Files:**
- `tests/drizzle-migration.test.ts` — add a local structural type for the parsed Drizzle snapshot so the `Object.values` traversal has typed `table` and `column` values.

- [ ] **Step 1: Run static validation**

Run:

```bash
git diff --check
rg -n "@prisma|PrismaClient|prismaAdapter|prisma migrate|prisma generate|prisma studio" --glob '!bun.lock' --glob '!docs/superpowers/**' --glob '!graphify-out/**' .
```

Expected: `git diff --check` exits 0 and the Prisma scan returns no matches.

- [x] **Step 2: Run typecheck, tests, and build**

The final review fix types the parsed snapshot locally as `DrizzleSnapshot`, including typed table columns and foreign keys; this keeps the assertions unchanged and does not alter production code. Verification is rerun after this fix.

Run each command separately:

```bash
bunx tsc --noEmit
bun test
bun run build
```

Expected: all three commands exit 0 with no TypeScript errors, test failures, or build failures.

- [ ] **Step 3: Validate the deployment contract**

Run:

```bash
bun test tests/production-compose.test.ts tests/deployment-docs.test.ts tests/drizzle-migration.test.ts
```

Expected: all deployment, documentation, and migration-safety tests pass.

- [ ] **Step 4: Review the final diff and status**

Run:

```bash
git diff --stat HEAD~6..HEAD
git status --short
```

Confirm every changed file is part of this plan, unrelated graphify artifacts remain untouched, and no required migration or deployment file is missing.

- [ ] **Step 5: Commit verification-only fixes, if any**

If verification required a correction, stage only the exact corrected files and run `git commit -m "test: verify Drizzle migration"`. If no correction was required, skip this step and do not create an empty commit.
