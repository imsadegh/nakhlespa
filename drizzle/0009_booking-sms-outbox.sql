CREATE TYPE "public"."BookingSmsTemplate" AS ENUM('confirm', 'reminder24h', 'reminder2h');--> statement-breakpoint
ALTER TYPE "public"."SmsReminderStatus" ADD VALUE 'SKIPPED';--> statement-breakpoint
ALTER TABLE "sms_reminders" ADD COLUMN "template" "BookingSmsTemplate";--> statement-breakpoint
ALTER TABLE "sms_reminders" ADD COLUMN "attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sms_reminders" ADD COLUMN "nextAttemptAt" timestamp (3);--> statement-breakpoint
ALTER TABLE "sms_reminders" ADD COLUMN "providerMessageId" text;--> statement-breakpoint
-- Previous versions stored either the correct UTC due time or Tehran wall time as UTC.
UPDATE "sms_reminders" AS reminder
SET "template" = schedule.template::"BookingSmsTemplate",
    "sendAt" = appointment.utc_time - schedule.lead,
    "nextAttemptAt" = appointment.utc_time - schedule.lead
FROM "bookings" AS booking
CROSS JOIN LATERAL (
  SELECT (booking."date" + booking."startTime"::time) AS wall_time,
         ((booking."date" + booking."startTime"::time) AT TIME ZONE 'Asia/Tehran') AT TIME ZONE 'UTC' AS utc_time
) AS appointment
CROSS JOIN (VALUES ('reminder24h', interval '24 hours'), ('reminder2h', interval '2 hours')) AS schedule(template, lead)
WHERE reminder."bookingId" = booking.id
  AND reminder.status = 'PENDING'
  AND reminder."sendAt" IN (appointment.utc_time - schedule.lead, appointment.wall_time - schedule.lead);
