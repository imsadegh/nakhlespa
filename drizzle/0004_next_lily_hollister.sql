CREATE TABLE "booking_customizations" (
	"id" text PRIMARY KEY NOT NULL,
	"bookingId" text NOT NULL,
	"category" text NOT NULL,
	"optionId" text,
	"codeSnapshot" text NOT NULL,
	"labelSnapshot" text NOT NULL,
	"pricePaid" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "booking_customizations_bookingId_category_key" UNIQUE("bookingId","category")
);
--> statement-breakpoint
CREATE TABLE "customization_options" (
	"id" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"code" text NOT NULL,
	"labelFa" text NOT NULL,
	"descriptionFa" text NOT NULL,
	"additionalPrice" integer DEFAULT 0 NOT NULL,
	"requiresTier" integer,
	"isActive" boolean DEFAULT true NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "customization_options_category_code_key" UNIQUE("category","code")
);
--> statement-breakpoint
ALTER TABLE "booking_customizations" ADD CONSTRAINT "booking_customizations_bookingId_bookings_id_fk" FOREIGN KEY ("bookingId") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "booking_customizations" ADD CONSTRAINT "booking_customizations_optionId_customization_options_id_fk" FOREIGN KEY ("optionId") REFERENCES "public"."customization_options"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "booking_customizations_bookingId_idx" ON "booking_customizations" USING btree ("bookingId");--> statement-breakpoint
ALTER TABLE "booking_addons" ADD CONSTRAINT "booking_addons_bookingId_addonId_key" UNIQUE("bookingId","addonId");