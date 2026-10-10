ALTER TABLE "addons" ADD COLUMN "durationMinutes" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
UPDATE "services" AS service
SET "durationMinutes" = package."durationMinutes"
FROM (VALUES
  ('نفس تازه', 40),
  ('احیاگر', 100),
  ('دریای آرامش', 80),
  ('سبک بال', 40),
  ('شاهانه', 180)
) AS package("nameFa", "durationMinutes")
WHERE service."nameFa" = package."nameFa";
--> statement-breakpoint
UPDATE "addons" SET "durationMinutes" = 40 WHERE "nameFa" = 'حمام طهورا';
