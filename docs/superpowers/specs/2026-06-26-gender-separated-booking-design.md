# Gender-Separated Booking Design

**Date:** 2026-06-26  
**Status:** Approved

## Overview

Nakhlespa operates with gender-segregated sessions: women's hours in the morning, men's in the afternoon/evening. This feature adds gender selection to the booking wizard, enforces time-window restrictions server-side, persists gender on bookings, and surfaces it in the admin dashboard and schedule manager.

---

## Database Schema

### New `Gender` enum

```prisma
enum Gender {
  FEMALE
  MALE
}
```

### `WorkingHours` — add `gender` column

```prisma
model WorkingHours {
  id        String   @id @default(uuid())
  dayOfWeek Int
  gender    Gender               // NEW
  openTime  String
  closeTime String
  isOpen    Boolean  @default(true)
  createdAt DateTime @default(now())

  @@unique([dayOfWeek, gender])  // was @@unique([dayOfWeek])
  @@map("working_hours")
}
```

The unique constraint changes from `[dayOfWeek]` to `[dayOfWeek, gender]`. There will be 14 rows: 7 days × 2 genders.

### `Booking` — add `gender` column

```prisma
model Booking {
  ...
  gender  Gender   // NEW — required field
  ...
}
```

Gender is a required field on every booking; it applies to the entire group (all people in a group booking share the same gender session).

### Migration & Seed

- Migration adds `gender` enum, alters `working_hours` unique constraint, adds `gender` column to both tables.
- Seed creates 14 `WorkingHours` rows. Initial values:
  - FEMALE: 08:00–14:30 (all 7 days)
  - MALE: 15:00–22:00 (all 7 days)
- Existing `Booking` rows must be backfilled — default to `MALE` (or handle with a nullable migration then backfill then set NOT NULL).

---

## Booking Wizard (Customer-facing)

### Step 0 — Gender Selection (new, inserted before Step 1)

- Full wizard step with two large tap-target cards.
- **خانم** card: shows women's session hours fetched from DB (e.g. 08:00–14:30)
- **آقا** card: shows men's session hours fetched from DB (e.g. 15:00–22:00)
- A `GET /api/gender-windows` endpoint (or reuse `/api/working-hours`) returns the min `openTime` and max `closeTime` across all days per gender, for display on this step. The exact per-day times are enforced later in slot generation — Step 0 just shows representative hours for user guidance.
- Selected gender stored as `gender: 'FEMALE' | 'MALE'` on `WizardState` (group-level, not per-person).
- Cannot proceed without selecting.

### Step 2 — Date/Time (slots)

- `/api/slots` receives `gender` query param.
- Slot generation queries `WorkingHours` with `{ dayOfWeek, gender }` — returns the gender-specific `openTime`/`closeTime`.
- Slots outside the gender window are never generated; customer only sees valid options.

### Step 4 — Review

- Gender badge (خانم / آقا) displayed in the booking summary before payment.

### API — `POST /api/bookings/create`

- `gender` added as a required field on each booking entry in the request body.
- Server validates: `startTime` falls within the gender's `WorkingHours` window for that day. Rejects with 400 if not (guards against tampered requests).
- `gender` persisted on every `Booking` row in the group.

---

## Types

```typescript
// WizardState gains:
gender?: 'FEMALE' | 'MALE'

// BookingCreateInput gains:
gender: 'FEMALE' | 'MALE'
```

---

## Admin Dashboard

### Bookings table (`columns.tsx`)

- Gender badge added inline inside the existing customer name cell.
- `خانم` — soft pink badge (`bg-pink-400/10 text-pink-400`)
- `آقا` — soft blue badge (`bg-blue-400/10 text-blue-400`)
- No new column added.
- `BookingRow` type gains `gender: 'FEMALE' | 'MALE'`.

### Booking detail dialog (`BookingDetailDialog.tsx`)

- Gender shown as a labeled field (e.g. "جنسیت: خانم") alongside service, date, status.

### Admin bookings API (`GET /api/admin/bookings`)

- Returns `gender` field in each booking row.

---

## Schedule Manager (Admin)

### Working hours UI (`ScheduleManager.tsx`)

- The single 7-row table splits into **two tabs**: `خانم` and `آقا`.
- Each tab shows 7 rows with its own `openTime`/`closeTime`/`isOpen` controls.
- Save action sends all 14 rows (tagged with gender) to the API.

### API — `PUT /api/admin/schedule/hours`

- Accepts `{ id, dayOfWeek, gender, isOpen, openTime, closeTime }[]`.
- Upserts by `{ dayOfWeek, gender }` (since IDs are stable after migration, plain updates by ID are fine).

### Schedule page data fetch

- `GET /api/admin/schedule` returns `hours` split by gender (or flat array with `gender` field — component sorts/groups client-side).

---

## Slot Generation (`src/lib/slots.ts`)

- `getAvailableSlots(date, durationMinutes, count, gender)` — adds `gender` param, queries `WorkingHours` with `{ dayOfWeek, gender }`.
- `getSlotsForRooms(date, serviceIds, gender)` — same addition.
- `/api/slots` route passes `gender` from query params to both functions.

---

## Enforcement Summary

| Layer | What it does |
|-------|-------------|
| Wizard Step 0 | Customer declares gender; stored in wizard state |
| Step 2 slot display | Only gender-appropriate slots shown |
| `POST /api/bookings/create` | Server validates startTime vs gender window; rejects if mismatch |
| DB | `gender` persisted on `Booking` |
| Admin table | Badge on customer cell |
| Admin detail | Gender field in detail dialog |
| Schedule manager | Two-tab UI for managing gender-specific hours |
