# Customer Portal & Discount System — Design Spec
_Date: 2026-06-29_

## Overview

Two related features:

1. **Customer portal** — customers can view their full booking history via an OTP-authenticated portal at `/my/bookings`, reachable from the booking confirmation page.
2. **Discount system** — promo codes (admin-managed) and automatic loyalty rewards (every 5th completed booking = 20% off), applied at checkout.

---

## Data Model

### New model: `CustomerSession`

```prisma
model CustomerSession {
  id            String   @id @default(uuid())
  phone         String
  sessionToken  String   @unique @default(uuid())
  expiresAt     DateTime
  createdAt     DateTime @default(now())

  @@index([phone])
  @@map("customer_sessions")
}
```

Stores authenticated customer sessions. Sessions expire after 30 minutes. HttpOnly cookie `__customer_session` holds the `sessionToken`.

### New model: `DiscountCode`

```prisma
model DiscountCode {
  id        String       @id @default(uuid())
  code      String       @unique
  type      DiscountType
  value     Int          // percent (20 = 20%) or fixed Tomans
  maxUses   Int?         // null = unlimited
  usedCount Int          @default(0)
  expiresAt DateTime?
  isActive  Boolean      @default(true)
  createdAt DateTime     @default(now())
  bookings  Booking[]

  @@map("discount_codes")
}

enum DiscountType {
  PERCENT
  FIXED
}
```

The special loyalty code `LOYALTY_AUTO` (PERCENT, value=20, maxUses=null) is seeded once and applied automatically by server logic — never by customer input.

### Changes to `Booking`

Add two fields:

```prisma
discountCodeId  String?      // FK to DiscountCode, nullable
discountCode    DiscountCode? @relation(fields: [discountCodeId], references: [id])
discountAmount  Int          @default(0) // Tomans discounted, immutable snapshot
```

`discountAmount` is computed and stored at booking creation time so it remains accurate even if the code is later deactivated or changed.

### Seeding

`prisma/seed.ts` must insert the `LOYALTY_AUTO` discount code on first run (upsert by code to be idempotent).

---

## OTP Authentication Flow

### New API routes under `/api/customer/auth/`

**`POST /api/customer/auth/otp/send`**
- Body: `{ phone: string }`
- Rate limit: max 3 active `Verification` records per phone in the last 10 minutes. Return 429 if exceeded.
- Generate a 6-digit numeric code. Store SHA-256 hashed value (using Node's built-in `crypto.createHash`) in `Verification` table: `identifier = phone`, `value = hashedCode`, `expiresAt = now + 10min`. Use `crypto.timingSafeEqual` for comparison to avoid timing attacks.
- Send code via SMS.ir using a new OTP template (`SMSIR_TEMPLATE_OTP` env var).
- Response: `{ ok: true }` or error.

**`POST /api/customer/auth/otp/verify`**
- Body: `{ phone: string, code: string }`
- Look up `Verification` by `identifier = phone`, check `bcrypt.compare(code, value)` and `expiresAt > now`.
- On success: delete the `Verification` record, create a `CustomerSession` row (`expiresAt = now + 30min`), set `__customer_session` HttpOnly cookie (`sameSite=lax`, `path=/my`).
- `POST /api/bookings/create` subtracts `discountAmount` from `totalPrice` before calling `zarinpalRequest`.
- Response: `{ ok: true }` or `{ error: 'invalid_code' | 'expired' }`.

**`POST /api/customer/auth/logout`**
- Delete `CustomerSession` by cookie value, clear the cookie.

### Session helper

`src/lib/customer-auth.ts` exports:

```ts
getCustomerSession(req: NextRequest): Promise<{ phone: string } | null>
```

Reads `__customer_session` cookie → looks up `CustomerSession` → checks `expiresAt` → returns `{ phone }` or `null`.

### `proxy.ts` change

Add `/my/:path*` to the matcher. If `getCustomerSession` returns null, redirect to `/my/login?next=<original path>`.

---

## Customer Portal Pages

### `/my/login`

Two-step form using existing `GlassCard` + `GoldButton` components, matching site aesthetics:

1. **Step 1** — phone input (Iranian format, `09xxxxxxxxx`). Submit calls `POST /api/customer/auth/otp/send`.
2. **Step 2** — 6-digit OTP input. Submit calls `POST /api/customer/auth/otp/verify`. On success, redirect to `/my/bookings` (or `?next=` param).

Error states: invalid phone format, rate limit hit, wrong code, expired code.

### `/my/bookings`

Server component. Flow:
1. `getCustomerSession` → get `phone`.
2. Fetch all `Booking` where `customerPhone = phone` and `status IN [PAID, CONFIRMED, CANCELLED]`, ordered by `date DESC`, including `service`, `addons`, `discountCode`.
3. Count `status IN [PAID, CONFIRMED]` bookings for loyalty progress.

UI:
- Loyalty progress indicator: if `count % 5 === 4` (discount eligible on next booking), show "رزرو بعدی شما ۲۰٪ تخفیف دارد!". Otherwise show "X رزرو تأیید شده — تا تخفیف بعدی Y رزرو مانده" where Y = `5 - (count % 5)`.
- Each booking as a `GlassCard`: service name, date, time, status badge, total paid (with discount line if `discountAmount > 0`).
- Link each card to `/my/bookings/[token]`.

### `/my/bookings/[token]`

Server component. Validates that the booking's `customerPhone` matches session phone (return 404 otherwise). Shows full detail: service, addons, discount applied, Zarinpal ref ID — reusing the display structure from `/booking/confirm/[token]`.

### Confirmation page link

`/booking/confirm/[token]` gets a new link below the existing "بازگشت به خانه" button:

> "مشاهده همه رزروهای شما ←"

Routes to `/my/bookings`. If customer is not authenticated, `proxy.ts` redirects to `/my/login?next=/my/bookings`.

---

## Discount System

### Validation logic (`src/lib/discounts.ts`)

Exports:

```ts
validatePromoCode(code: string, phone: string, subtotal: number): Promise<{ valid: boolean; discountAmount: number; codeId: string; message?: string }>

checkLoyaltyDiscount(phone: string, subtotal: number): Promise<{ eligible: boolean; discountAmount: number; codeId: string }>
```

Loyalty eligibility: count `Booking` where `customerPhone = phone AND status IN [PAID, CONFIRMED]`. Eligible if `count % 5 === 4` (this would be the 5th, 10th, … booking).

Stacking rule: promo code takes priority. Loyalty discount applies only when no promo code is entered.

### Checkout flow changes

**`Step4Review` component:**
- Add collapsible promo code input below the price breakdown.
- On submit/blur calls `GET /api/discounts/validate?code=X&phone=Y&total=Z`.
- Shows discount line in price summary if valid.
- Loyalty discount (if eligible) is shown automatically as a read-only line: "تخفیف وفاداری ۲۰٪" — no input needed.

**`POST /api/bookings/create`:**
- Accept optional `discountCodeId?: string` and `discountAmount?: number` in the request body.
- Server re-validates discount independently (never trust client-computed discounts).
- Re-check loyalty eligibility server-side.
- `totalPrice` sent to Zarinpal is after discount.
- `discountCodeId` and `discountAmount` stored on created `Booking`. Increment `DiscountCode.usedCount` atomically in the same transaction.

### New API routes

**`GET /api/discounts/validate`** — public endpoint.
- Query params: `code`, `phone`, `total`.
- Returns `{ valid, discountAmount, codeId, message }`.
- Checks: code exists, isActive, not expired, usedCount < maxUses, format valid.

**`GET /api/admin/discounts`** — admin only. Returns all `DiscountCode` rows ordered by `createdAt DESC`.

**`POST /api/admin/discounts`** — admin only. Creates a new code.
- Body: `{ code, type, value, maxUses?, expiresAt? }`.
- Validates: code is unique, value > 0, type is PERCENT|FIXED.
- `LOYALTY_AUTO` code cannot be created via this endpoint (reserved name).

**`PATCH /api/admin/discounts/[id]`** — admin only. Toggles `isActive` only. `LOYALTY_AUTO` cannot be deactivated via API.

---

## Admin UI

### `/admin/discounts` (new page)

- Table: code, type, value, uses (usedCount / maxUses or "∞"), expiry, status (active/inactive), deactivate button.
- `LOYALTY_AUTO` row is read-only, labeled "تخفیف وفاداری (خودکار)".
- Create form above table: code name, percent/fixed toggle, value, max uses (optional), expiry date (optional).
- Matches existing admin table style (`data-table`, `columns` pattern from bookings page).

### `AdminSidebar.tsx`

Add "تخفیف‌ها" nav item with a ticket/tag icon, pointing to `/admin/discounts`, between existing items.

---

## New Environment Variable

```
SMSIR_TEMPLATE_OTP=<template_id>
```

Must be added to `.env.local`. The SMS.ir template should send: "کد ورود شما به نخلسپا: {code}".

---

## Out of Scope

- Stacking multiple discount codes
- Customer account editing (name, phone change)
- Admin per-customer discount history (derivable from bookings table filter)
- Push notifications or email
