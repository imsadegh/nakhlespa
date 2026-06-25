# Multi-Room Simultaneous Booking

**Date:** 2026-06-25  
**Status:** Approved

## Problem

The current slot availability logic blocks an entire time slot across all services the moment any booking exists at that time. Since each massage room has its own masseuse, rooms are fully independent — Customer A booking نسیم at 10:00 should not prevent Customer B from booking آفتاب at 10:00.

Additionally, a single customer should be able to reserve multiple rooms at the same time for a group of friends, with one payment covering all rooms.

---

## 1. Slot Availability Logic (Backend)

### Current behavior
`src/lib/slots.ts` fetches all bookings for a date and treats any overlap as a conflict, regardless of which service/room is booked.

### New behavior
- `getAvailableSlots` gains a `count` parameter (number of rooms the customer wants, default 1).
- For each candidate time slot, count how many non-cancelled bookings already exist at that exact `(date, startTime)`.
- A slot is `taken` when `existingCount + count > totalActiveRooms`.
- The return type gains `availableCount: number` — rooms free at that slot.
- Blocked slots (`BlockedSlot`) still mark the entire spa unavailable for that time range (no change).
- `totalActiveRooms` is queried at call time: `prisma.service.count({ where: { isActive: true, tier: { not: null } } })` — only tier rooms count (consultation is not a room with a masseuse).

### API change (`GET /api/slots`)
- Gains optional `count` query param (integer ≥ 1, default 1).
- Response shape: `{ startTime, endTime, taken, availableCount }[]`

---

## 2. Step 2 (Date/Time) UI

### Slot pill upgrade
Each available slot pill shows a small badge below/beside the time:
- `availableCount >= 2`: green-ish badge "X غرفه خالی"
- `availableCount === 1`: amber badge "۱ غرفه خالی" (urgency signal)
- `taken: true` (availableCount < count needed): strikethrough, disabled — same as today

### Slot API call
`Step2DateTime` reads the current person count from wizard state and passes `count=N` to `/api/slots`. When the customer adds a second person, the date/time step re-fetches with `count=2` so slots with only 1 room left become taken.

---

## 3. Multi-Person Wizard Flow

### Step 1 — Service selector becomes per-person

State changes from a single `serviceId / addonIds` to an array of **persons**:

```ts
type Person = {
  serviceId: string
  addonIds: string[]
  customerName?: string      // filled in Step 3
  customerPhone?: string     // filled in Step 3 (optional for non-payers)
  customerNotes?: string
}

type WizardState = {
  persons: Person[]          // always length >= 1
  date?: string
  startTime?: string
  endTime?: string
}
```

**UI:**
- Step 1 renders one collapsible card per person.
- Each card shows: person number (نفر ۱, نفر ۲ …), room selector (same grid as today), add-ons for that room.
- A "+ افزودن نفر دیگر" button appears at the bottom after the first person has a service selected.
- A × remove button on each card (hidden when only 1 person).
- Total price shown at the bottom sums all persons.

### Step 2 — Date/Time (unchanged flow, new slot logic)
Single date + time picker for the whole group. Passes `count=persons.length` to the slots API.

### Step 3 — Details per person
- Shows one form card per person.
- **Person 1 (payer):** name (required) + phone (required) + notes (optional).
- **Person 2+ (friends):** name (required) + phone (optional) + notes (optional).
- Label on Person 1 card: "پرداخت‌کننده — اطلاعات تماس ایشان برای تأیید رزرو استفاده می‌شود".

### Step 4 — Review
- Lists each person with their room name, add-ons, and price.
- Shows grand total.
- One "پرداخت با زرین‌پال" button.

---

## 4. Backend: `/api/bookings/create`

### Request body change
```ts
type MultiBookingCreateInput = {
  bookings: BookingCreateInput[]   // one per person, same date/startTime
}
```

Single-person bookings are just `{ bookings: [single] }` — the old shape is dropped.

### Transaction
- All bookings created in `prisma.$transaction`.
- A shared `groupToken` (UUID) is generated and set on all bookings in the group.
- Total price = sum of all `service.price + addonsPricePaid` across all bookings.
- One `zarinpalRequest` call for the total.
- On failure, the transaction rolls back all bookings atomically.

### `/api/bookings/verify`
- Finds the booking by `zarinpalAuthority` (first booking in the group carries it).
- Updates **all bookings with the same `groupToken`** to `PAID` in one `updateMany`.
- Schedules SMS reminder to Person 1's phone only.
- Redirects to `/booking/confirm/[token]` using Person 1's token.

---

## 5. Schema Change

Add `groupToken` to `Booking`:

```prisma
model Booking {
  // ... existing fields ...
  groupToken  String?   // shared UUID for multi-room group bookings; null for legacy solo bookings
  
  @@index([groupToken])
}
```

Migration: `bunx prisma migrate dev --name add-group-token`

---

## 6. Confirm Page (`/booking/confirm/[token]`)

- Fetch booking by token, then fetch all bookings with the same `groupToken`.
- If `groupToken` is null or only one booking: render existing single-booking view.
- If multiple: show a list of all rooms booked, with each person's name and room.

---

## 7. Out of Scope

- Admin UI changes beyond what already works (individual rows still appear in the bookings table).
- Per-person payment splitting.
- Changing date/time independently per person.
- Consultation service (`مشاوره`) is excluded from the room-count calculation for slot availability.
