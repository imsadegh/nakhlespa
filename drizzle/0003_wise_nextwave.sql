ALTER TABLE "bookings" ADD COLUMN "bookingCode" text;--> statement-breakpoint
UPDATE "bookings"
SET "bookingCode" = 'NS-' || upper(substr(md5("token"), 1, 8))
WHERE "bookingCode" IS NULL;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "bookingCode" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_bookingCode_unique" UNIQUE("bookingCode");
