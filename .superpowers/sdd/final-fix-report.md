# Final Fix Report — 2026-06-25

## Fix Status

### Fix 1 (CRITICAL) — Restore time-range overlap detection in slot availability
**Status: Applied**
**File:** `src/lib/slots.ts`
**Commit:** `b6da9bf`

Replaced the `bookingsPerSlot` Map (keyed by exact `startTime` string) with a
`existingBookingRanges` array and a `bookingsForSlot(slotStart, slotEnd)` closure.
The closure counts overlapping bookings using half-open interval logic:
`r.start < slotEnd && r.end > slotStart`. A 10:00–11:00 booking now correctly
reduces capacity for both the 10:00 and 10:30 slots.

---

### Fix 2 (CRITICAL) — Server-side availability check in create route
**Status: Applied**
**File:** `src/app/api/bookings/create/route.ts`
**Commit:** `06c006b`

After `bookingData` is computed and before the Prisma transaction, the route now
calls `getAvailableSlots` with the group's date, the max service duration, and the
group count. If the requested `startTime` slot is not found or is `taken`, the
route returns HTTP 409 before any DB writes occur.

---

### Fix 3 (IMPORTANT) — Prevent same room booked twice in same group
**Status: Applied**
**File:** `src/app/api/bookings/create/route.ts`
**Commit:** `7fa68f1`

Added a duplicate-serviceId check after the tier-restriction loop. If the incoming
`bookings` array contains the same `serviceId` more than once, the route returns
HTTP 400 before any further processing.

---

### Fix 4 (IMPORTANT) — Confirm page: filter group by PAID/CONFIRMED status
**Status: Applied**
**File:** `src/app/booking/confirm/[token]/page.tsx`
**Commit:** `7fa68f1`

Added `status: { in: [BookingStatus.PAID, BookingStatus.CONFIRMED] }` to the
`findMany` query so cancelled group members are excluded from the receipt display.

---

### Fix 5 (IMPORTANT) — Verify: throw instead of `?? 0` fallback on service price
**Status: Applied**
**File:** `src/app/api/bookings/verify/route.ts`
**Commit:** `7fa68f1`

Changed the `reduce` callback to throw `Error(\`Service ${b.serviceId} not found during verify\`)` if
`svcMap.get(b.serviceId)` is `undefined`. The thrown error bubbles into the existing
`try/catch`, which rolls back the booking status to `PENDING_PAYMENT` and redirects
to `/booking/failed` — safe behaviour rather than a silent wrong total.

---

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | `b6da9bf` | fix: restore time-range overlap detection in slot availability |
| 2 | `06c006b` | fix: add server-side slot availability check in create route |
| 3 | `7fa68f1` | fix: prevent duplicate room in same group; filter confirm page by status; throw on missing service in verify |

## Concerns

- **Race condition window (Fix 2):** The availability check and the transaction are two
  separate DB round-trips. Under high concurrency a slot could be taken between the
  check and the `prisma.$transaction`. The risk is low given spa booking volume, and
  a proper solution would require a SELECT … FOR UPDATE or serialisable transaction.
  Tracking this as a known limitation rather than a blocker.

- **Fix 2 uses dynamic `import()`:** `getAvailableSlots` is imported dynamically to
  avoid a circular-import chain (slots.ts → prisma → …). This is fine for Next.js
  route handlers; the import is cached after the first call.

## Corrective Deployment Review — 2026-08-29

### Scope

Applied the five findings from the broad Coolify deployment review. Changes are
limited to deployment configuration, deployment contract tests, and this report.
No application behavior, schema, payment behavior, SMS templates, UI, or unrelated
user changes were modified.

### Findings and corrections

1. **Prisma config missing from the release image — fixed.**
   `Dockerfile` now copies `prisma.config.ts` from the builder into the release
   image alongside `prisma/`, so `bunx prisma migrate deploy` has the config it
   needs at runtime.

2. **Prisma generation ordering — fixed and verified.**
   The builder now runs `bunx prisma generate` after `COPY . .` and before
   `bun run build`. This guarantees that `prisma/schema.prisma` and
   `prisma.config.ts` are present before generation. The real Docker build logged
   successful Prisma config loading, schema loading, and client generation before
   reaching the Next.js build.

3. **Deployment contract coverage — strengthened.**
   `tests/production-compose.test.ts` now statically checks release config copy,
   Prisma generation ordering, the worker command and Redis/SMS runtime variables,
   healthy Redis dependencies, and the non-predictable admin password placeholder.
   Existing web-only exposure checks remain in place.

4. **Redis readiness — fixed.**
   `compose.production.yml` now includes a `redis-cli ping` healthcheck, and both
   `web` and `worker-sms` require `redis` with `condition: service_healthy`.

5. **Predictable example admin password — fixed.**
   `.env.example` now uses `ADMIN_PASSWORD=replace-with-a-strong-admin-password`.
   It is explicitly covered by the deployment contract test and contains no
   committed production credential.

### Verification evidence

- `bun test tests/production-compose.test.ts` — **7 pass, 0 fail**.
- `bun test` — **18 pass, 0 fail** across 4 files.
- `docker compose --env-file .env.example -f compose.production.yml config` —
  **exit 0**; rendered config confirms four services, private Postgres/Redis,
  web-only `expose: 3000`, Redis healthcheck, and healthy dependency conditions.
- `git diff --check` — **exit 0**.
- `docker compose --env-file .env.example -f compose.production.yml build web worker-sms` —
  Docker reached the actual builder, installed dependencies, successfully ran
  `bunx prisma generate`, and completed Next.js compilation and TypeScript. The
  build stopped during page-data/prerender work because the build process tried to
  reach unavailable `127.0.0.1:6379` and `127.0.0.1:5432` services. This is an
  existing application build-time dependency and is not caused by the deployment
  contract changes.

### Concerns

- The production image build cannot complete in this workspace without the
  database and Redis endpoints expected by the application during Next.js
  prerendering. Coolify must provide the configured services or the application
  build should be run in an environment that satisfies those build-time reads.
- The requested build did verify the newly added Prisma ordering and release
  source changes before the environment-dependent prerender failure.

### Changed files in this corrective commit

- `Dockerfile`
- `compose.production.yml`
- `.env.example`
- `tests/production-compose.test.ts`
- `.superpowers/sdd/final-fix-report.md`
