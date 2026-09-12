-- Idempotent baseline for fresh databases and existing Prisma-created schemas.
-- The booking customization column is intentionally added by 0001.

DO $$ BEGIN
  CREATE TYPE "public"."BookingStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "public"."DiscountType" AS ENUM ('PERCENT', 'FIXED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "public"."Gender" AS ENUM ('FEMALE', 'MALE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "public"."SmsReminderStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "emailVerified" boolean NOT NULL,
  "image" text,
  "createdAt" timestamp (3) NOT NULL,
  "updatedAt" timestamp (3) NOT NULL,
  CONSTRAINT "user_email_unique" UNIQUE("email")
);
CREATE TABLE IF NOT EXISTS "services" (
  "id" text PRIMARY KEY NOT NULL,
  "nameFa" text NOT NULL,
  "descriptionFa" text,
  "durationMinutes" integer NOT NULL,
  "price" integer NOT NULL,
  "color" text,
  "symbol" text,
  "tier" integer,
  "isActive" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp (3) DEFAULT now() NOT NULL,
  CONSTRAINT "services_nameFa_key" UNIQUE("nameFa")
);
CREATE TABLE IF NOT EXISTS "addons" (
  "id" text PRIMARY KEY NOT NULL,
  "nameFa" text NOT NULL,
  "price" integer NOT NULL,
  "isActive" boolean DEFAULT true NOT NULL,
  "requiresTier" boolean DEFAULT false NOT NULL,
  "createdAt" timestamp (3) DEFAULT now() NOT NULL,
  CONSTRAINT "addons_nameFa_key" UNIQUE("nameFa")
);
CREATE TABLE IF NOT EXISTS "discount_codes" (
  "id" text PRIMARY KEY NOT NULL,
  "code" text NOT NULL,
  "type" "DiscountType" NOT NULL,
  "value" integer NOT NULL,
  "maxUses" integer,
  "usedCount" integer DEFAULT 0 NOT NULL,
  "expiresAt" timestamp (3),
  "isActive" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp (3) DEFAULT now() NOT NULL,
  CONSTRAINT "discount_codes_code_unique" UNIQUE("code")
);
CREATE TABLE IF NOT EXISTS "bookings" (
  "id" text PRIMARY KEY NOT NULL,
  "token" text NOT NULL,
  "serviceId" text NOT NULL REFERENCES "services"("id") ON DELETE restrict ON UPDATE cascade,
  "customerName" text NOT NULL,
  "customerPhone" text NOT NULL,
  "customerNotes" text,
  "date" date NOT NULL,
  "startTime" text NOT NULL,
  "endTime" text NOT NULL,
  "gender" "Gender" NOT NULL,
  "status" "BookingStatus" DEFAULT 'PENDING_PAYMENT' NOT NULL,
  "zarinpalAuthority" text,
  "zarinpalRefId" text,
  "addonsPricePaid" integer DEFAULT 0 NOT NULL,
  "groupToken" text,
  "discountCodeId" text REFERENCES "discount_codes"("id") ON DELETE set null ON UPDATE cascade,
  "discountAmount" integer DEFAULT 0 NOT NULL,
  "createdAt" timestamp (3) DEFAULT now() NOT NULL,
  CONSTRAINT "bookings_token_unique" UNIQUE("token")
);
CREATE TABLE IF NOT EXISTS "blocked_slots" (
  "id" text PRIMARY KEY NOT NULL,
  "date" date NOT NULL,
  "startTime" text NOT NULL,
  "endTime" text NOT NULL,
  "reason" text,
  "createdAt" timestamp (3) DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "booking_addons" (
  "id" text PRIMARY KEY NOT NULL,
  "bookingId" text NOT NULL REFERENCES "bookings"("id") ON DELETE cascade ON UPDATE cascade,
  "addonId" text NOT NULL REFERENCES "addons"("id") ON DELETE restrict ON UPDATE cascade,
  "pricePaid" integer NOT NULL
);
CREATE TABLE IF NOT EXISTS "account" (
  "id" text PRIMARY KEY NOT NULL,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE cascade ON UPDATE cascade,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamp (3),
  "refreshTokenExpiresAt" timestamp (3),
  "scope" text,
  "password" text,
  "createdAt" timestamp (3) NOT NULL,
  "updatedAt" timestamp (3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "session" (
  "id" text PRIMARY KEY NOT NULL,
  "expiresAt" timestamp (3) NOT NULL,
  "token" text NOT NULL,
  "createdAt" timestamp (3) NOT NULL,
  "updatedAt" timestamp (3) NOT NULL,
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE cascade ON UPDATE cascade,
  CONSTRAINT "session_token_unique" UNIQUE("token")
);
CREATE TABLE IF NOT EXISTS "customer_sessions" (
  "id" text PRIMARY KEY NOT NULL,
  "phone" text NOT NULL,
  "sessionToken" text NOT NULL,
  "expiresAt" timestamp (3) NOT NULL,
  "createdAt" timestamp (3) DEFAULT now() NOT NULL,
  CONSTRAINT "customer_sessions_sessionToken_unique" UNIQUE("sessionToken")
);
CREATE TABLE IF NOT EXISTS "sms_reminders" (
  "id" text PRIMARY KEY NOT NULL,
  "bookingId" text NOT NULL REFERENCES "bookings"("id") ON DELETE cascade ON UPDATE cascade,
  "sendAt" timestamp (3) NOT NULL,
  "status" "SmsReminderStatus" DEFAULT 'PENDING' NOT NULL,
  "sentAt" timestamp (3),
  "createdAt" timestamp (3) DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "verification" (
  "id" text PRIMARY KEY NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expiresAt" timestamp (3) NOT NULL,
  "createdAt" timestamp (3),
  "updatedAt" timestamp (3)
);
CREATE TABLE IF NOT EXISTS "working_hours" (
  "id" text PRIMARY KEY NOT NULL,
  "dayOfWeek" integer NOT NULL,
  "gender" "Gender" NOT NULL,
  "openTime" text NOT NULL,
  "closeTime" text NOT NULL,
  "isOpen" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp (3) DEFAULT now() NOT NULL,
  CONSTRAINT "working_hours_dayOfWeek_gender_key" UNIQUE("dayOfWeek", "gender")
);

CREATE INDEX IF NOT EXISTS "booking_addons_bookingId_idx" ON "booking_addons" USING btree ("bookingId");
CREATE INDEX IF NOT EXISTS "booking_addons_addonId_idx" ON "booking_addons" USING btree ("addonId");
CREATE INDEX IF NOT EXISTS "bookings_date_idx" ON "bookings" USING btree ("date");
CREATE INDEX IF NOT EXISTS "bookings_status_idx" ON "bookings" USING btree ("status");
CREATE INDEX IF NOT EXISTS "bookings_serviceId_idx" ON "bookings" USING btree ("serviceId");
CREATE INDEX IF NOT EXISTS "bookings_groupToken_idx" ON "bookings" USING btree ("groupToken");
CREATE INDEX IF NOT EXISTS "customer_sessions_phone_idx" ON "customer_sessions" USING btree ("phone");
CREATE INDEX IF NOT EXISTS "sms_reminders_status_sendAt_idx" ON "sms_reminders" USING btree ("status", "sendAt");
