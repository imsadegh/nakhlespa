# Graph Report - nakhlespa  (2026-09-13)

## Corpus Check
- 163 files · ~68,879 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 4, .css 2, .example 1)

## Summary
- 999 nodes · 2000 edges · 61 communities (50 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b7bb421b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- db.ts
- ScheduleManager.tsx
- app/page.tsx
- OtpLoginForm.tsx
- BookingStatus
- BookingDetailDialog.tsx
- ui.shadcn-components-radix-data-table.md
- ui.shadcn-components-radix-sidebar.md
- compilerOptions
- sidebar.tsx
- schema.ts
- File map
- seed.ts
- devDependencies
- components.json
- slots.ts
- Coolify Deployment
- cn
- Prisma to Drizzle Migration Design
- GlassCard.tsx
- BookingWizard.tsx
- drawer.tsx
- drizzle-migration.test.ts
- package.json
- Architecture
- 0000_baseline.sql
- index.ts
- Health Intake Form Design
- drizzle-kit
- dialog.tsx
- discounts/page.tsx
- button.tsx
- File Map
- booking-customization.test.tsx
- Step2DateTime.tsx
- Step3Details.tsx
- progress.tsx
- dependencies
- app/layout.tsx
- create/route.ts
- Booking Customization Design
- AGENTS.md
- Booking Customization Disclosure Design
- scripts
- toggle-group.tsx
- Global Constraints
- [id]/page.tsx
- Global Constraints
- ParticleCanvas
- postcss.config.mjs
- tailwindcss
- react
- dashboard/page.tsx
- production-compose.test.ts
- queue.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 143 edges
2. `react` - 41 edges
3. `db` - 36 edges
4. `drizzle-orm` - 35 edges
5. `BookingStatus` - 19 edges
6. `GlassCard()` - 18 edges
7. `bookings` - 16 edges
8. `getDefaultCustomization()` - 16 edges
9. `compilerOptions` - 16 edges
10. `lucide-react` - 15 edges

## Surprising Connections (you probably didn't know these)
- `booking()` --calls--> `getDefaultCustomization()`  [EXTRACTED]
  tests/booking-create-health-intake.test.ts → src/lib/booking-customization.ts
- `person()` --calls--> `getDefaultCustomization()`  [EXTRACTED]
  tests/booking-customization.test.tsx → src/lib/booking-customization.ts
- `booking()` --calls--> `getDefaultHealthIntake()`  [EXTRACTED]
  tests/booking-create-customization.test.ts → src/lib/health-intake.ts
- `CalendarDayButton()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/calendar.tsx → src/lib/utils.ts
- `DialogOverlay()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/dialog.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (61 total, 5 thin omitted)

### Community 0 - "db.ts"
Cohesion: 0.11
Nodes (9): drizzle-orm, dynamic, dynamic, blockedSlots, discountCodes, DiscountType, WorkingHours, db (+1 more)

### Community 1 - "ScheduleManager.tsx"
Cohesion: 0.08
Nodes (27): @tanstack/react-table, BookingDetailDialog(), BookingAddonRow, BookingRow, columns, statusLabel, statusStyle, BookingsDataTable() (+19 more)

### Community 2 - "app/page.tsx"
Cohesion: 0.08
Nodes (25): dynamic, BookingDialog(), BookingDialogProvider(), Ctx, CtxValue, useBookingDialog(), BookingCtaSection(), HeroSection() (+17 more)

### Community 3 - "OtpLoginForm.tsx"
Cohesion: 0.21
Nodes (14): hashCode(), POST(), hashCode(), POST(), safeEqual(), OtpLoginForm(), handleVerify(), Verification (+6 more)

### Community 4 - "BookingStatus"
Cohesion: 0.13
Nodes (18): GET(), dynamic, ConfirmPage(), toFaTime(), MyBookingsPage(), BookingDetailPage(), STATUS_LABEL, ConfirmCheckmark() (+10 more)

### Community 5 - "BookingDetailDialog.tsx"
Cohesion: 0.13
Nodes (18): date-fns-jalali, statusLabel, statusStyle, DatePicker(), DatePickerProps, jalaliLocale, toFaDate(), Popover() (+10 more)

### Community 6 - "ui.shadcn-components-radix-data-table.md"
Cohesion: 0.06
Nodes (32): Add pagination controls, Basic Table, Cell Formatting, Column Definitions, Column header, Column toggle, `<DataTable />` component, Filtering (+24 more)

### Community 7 - "ui.shadcn-components-radix-sidebar.md"
Cohesion: 0.07
Nodes (29): Changelog, Composition, Controlled Sidebar, Installation, Keyboard Shortcut, Props, Props, RTL (+21 more)

### Community 8 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 9 - "sidebar.tsx"
Cohesion: 0.06
Nodes (38): AdminSidebar(), links, PageTransition(), Input(), Separator(), Sidebar(), SidebarContent(), SidebarContext (+30 more)

### Community 10 - "schema.ts"
Cohesion: 0.05
Nodes (35): Account, accountRelations, Addon, addonsRelations, BlockedSlot, BookingAddon, bookingAddonsRelations, bookingsRelations (+27 more)

### Community 11 - "File map"
Cohesion: 0.18
Nodes (10): File map, Global Constraints, Prisma to Drizzle Migration Implementation Plan, Task 1: Add Drizzle dependencies and database primitives, Task 2: Establish a non-destructive Drizzle migration baseline, Task 3: Migrate Better Auth and seed behavior, Task 4: Convert shared server libraries and booking/payment workflows, Task 5: Convert admin and customer pages/routes and shared types (+2 more)

### Community 12 - "seed.ts"
Cohesion: 0.17
Nodes (11): better-auth, dynamic, { GET, POST }, addons, Gender, User, daysFromNow(), main() (+3 more)

### Community 13 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, drizzle-kit, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom, typescript

### Community 14 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 15 - "slots.ts"
Cohesion: 0.47
Nodes (9): GET(), services, getAvailableSlots(), getBlockedRanges(), getSlotsForRooms(), getWorkingDay(), minutesToTime(), parseDateUTC() (+1 more)

### Community 16 - "Coolify Deployment"
Cohesion: 0.11
Nodes (18): 1. Install Coolify, 1. Install dependencies, 2. Create one Compose resource, 2. Start Postgres and Redis locally, 3. Configure Coolify environment variables, 3. Configure environment, 4. First deployment and initialization, 4. Migrate and seed the database (+10 more)

### Community 17 - "cn"
Cohesion: 0.13
Nodes (29): buttonVariants, Calendar(), CardAction(), CardFooter(), Questionnaire(), QuestionnaireActions(), QuestionnaireChoice(), QuestionnaireChoiceDescription() (+21 more)

### Community 18 - "Prisma to Drizzle Migration Design"
Cohesion: 0.20
Nodes (9): Architecture, Authentication, Goal, Out of scope, Prisma to Drizzle Migration Design, Query and transaction migration, Scope, Seed and deployment (+1 more)

### Community 19 - "GlassCard.tsx"
Cohesion: 0.18
Nodes (10): framer-motion, AdminLoginPage(), BookButton(), Props, fadeUp, steps, GlassCard(), Props (+2 more)

### Community 20 - "BookingWizard.tsx"
Cohesion: 0.15
Nodes (13): BookingWizard(), emptyPerson(), variants, Props, TIER_COLORS, Props, GenderWindows, Props (+5 more)

### Community 21 - "drawer.tsx"
Cohesion: 0.10
Nodes (19): BookingHistoryList(), FullBooking, STATUS_COLOR, STATUS_LABEL, CustomerBookingsDrawer(), handleOpenChange(), loadBookings(), DrawerBookings (+11 more)

### Community 23 - "package.json"
Cohesion: 0.08
Nodes (23): name, private, version, @base-ui/react, @better-auth/drizzle-adapter, clsx, cn, date-fns (+15 more)

### Community 24 - "Architecture"
Cohesion: 0.13
Nodes (13): Admin Area (`/admin/*`), Architecture, Booking Flow, Commands, Customer Portal (`/my/*`), Database Models, Environment Files, Key UI Patterns (+5 more)

### Community 25 - "0000_baseline.sql"
Cohesion: 0.16
Nodes (21): "account", "addons", "blocked_slots", "booking_addons", booking_addons_addonId_idx, booking_addons_bookingId_idx, "bookings", bookings_date_idx (+13 more)

### Community 26 - "index.ts"
Cohesion: 0.14
Nodes (14): CUSTOMIZATION_FIELD_LABELS, CustomizationDisplayRow, CustomizationValidation, BookingCreateInput, BookingSummary, CustomerBookingDTO, CustomizationKey, CustomizationOption (+6 more)

### Community 27 - "Health Intake Form Design"
Cohesion: 0.14
Nodes (13): Admin print view, Booking flow, Goal, Health Intake Form Design, Privacy and access, Question groups, Questionnaire interaction, Stored data (+5 more)

### Community 29 - "dialog.tsx"
Cohesion: 0.19
Nodes (9): Props, Dialog(), DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay(), DialogTitle() (+1 more)

### Community 30 - "discounts/page.tsx"
Cohesion: 0.32
Nodes (3): dynamic, DiscountManager(), DiscountCodeDTO

### Community 31 - "button.tsx"
Cohesion: 0.12
Nodes (12): lucide-react, react-day-picker, Button(), CalendarDayButton(), Checkbox(), Sheet(), SheetContent(), SheetDescription() (+4 more)

### Community 32 - "File Map"
Cohesion: 0.20
Nodes (9): Booking Customization Implementation Plan, File Map, Global Constraints, Task 1: Define the shared customization contract, Task 2: Add persistence and migration, Task 3: Add the customer customization step, Task 4: Send and validate customizations in booking creation, Task 5: Display choices in customer review and staff views (+1 more)

### Community 33 - "booking-customization.test.tsx"
Cohesion: 0.13
Nodes (17): emptyPerson(), Step1Service(), addPerson(), selectService(), setPerson(), toggleAddon(), updatePerson(), StepCustomization() (+9 more)

### Community 34 - "Step2DateTime.tsx"
Cohesion: 0.33
Nodes (8): getDates(), iranianDayOfWeek(), JS_TO_IR, Props, Step2DateTime(), toFaNum(), toFaTime(), SlotDTO

### Community 35 - "Step3Details.tsx"
Cohesion: 0.06
Nodes (38): formatDate(), HealthFormPage(), persianDigits(), PrintableBooking, PrintHealthFormButton(), HealthQuestionnaire(), isValidIranPhone(), Props (+30 more)

### Community 36 - "progress.tsx"
Cohesion: 0.29
Nodes (6): StepProgress(), Progress(), ProgressIndicator(), ProgressLabel(), ProgressTrack(), ProgressValue()

### Community 37 - "dependencies"
Cohesion: 0.07
Nodes (29): dependencies, axios, @base-ui/react, better-auth, @better-auth/drizzle-adapter, bullmq, class-variance-authority, clsx (+21 more)

### Community 38 - "app/layout.tsx"
Cohesion: 0.20
Nodes (7): config, next, sonner, metadata, vazir, viewport, Toaster()

### Community 39 - "create/route.ts"
Cohesion: 0.07
Nodes (26): BookingDetailPage(), addMinutesToTime(), POST(), timeToMinutes(), GET(), GET(), Step4Review(), toFaTime() (+18 more)

### Community 40 - "Booking Customization Design"
Cohesion: 0.22
Nodes (8): Alternatives considered, API and persistence, Booking Customization Design, Booking flow and UI, Data model, Goal, Scope, Testing

### Community 42 - "Booking Customization Disclosure Design"
Cohesion: 0.25
Nodes (7): Booking Customization Disclosure Design, Data and behavior, Goal, Layout and visual treatment, Loofah explanations, User experience, Verification

### Community 43 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, db:generate, db:migrate, db:seed, dev, start, worker:sms

### Community 44 - "toggle-group.tsx"
Cohesion: 0.39
Nodes (6): class-variance-authority, ToggleGroup(), ToggleGroupContext, ToggleGroupItem(), Toggle(), toggleVariants

### Community 45 - "Global Constraints"
Cohesion: 0.29
Nodes (6): Global Constraints, Health Intake Form Implementation Plan, Task 1: Add the health-intake data contract and migration, Task 2: Add the required per-person questionnaire to the details step, Task 3: Validate and persist health intake through booking creation, Task 4: Add authenticated admin print forms

### Community 46 - "[id]/page.tsx"
Cohesion: 0.33
Nodes (3): statusLabel, statusStyle, BookingActions()

### Community 47 - "Global Constraints"
Cohesion: 0.40
Nodes (4): Booking Customization Disclosure Implementation Plan, Global Constraints, Task 1: Specify the disclosure and visual contracts with failing tests, Task 2: Implement the optional customization panel and visual refinements

### Community 48 - "ParticleCanvas"
Cohesion: 0.67
Nodes (3): ParticleCanvas(), draw(), isLightTheme()

### Community 75 - "react"
Cohesion: 0.17
Nodes (12): react, ContentProps, Props, Card(), CardContent(), CardDescription(), CardHeader(), CardTitle() (+4 more)

### Community 79 - "dashboard/page.tsx"
Cohesion: 0.40
Nodes (5): DashboardPage(), dynamic, statusLabel, statusStyle, toFaDate()

### Community 82 - "production-compose.test.ts"
Cohesion: 0.40
Nodes (4): compose, dockerfile, envExample, legacyOrm

### Community 87 - "queue.ts"
Cohesion: 0.11
Nodes (23): axios, bullmq, GET(), smsReminders, SmsReminderStatus, SmsReminderStatusValue, connectionOpts, processSmsJob() (+15 more)

## Knowledge Gaps
- **385 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+380 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 480 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `booking-customization.test.tsx`, `ScheduleManager.tsx`, `Step3Details.tsx`, `progress.tsx`, `BookingDetailDialog.tsx`, `sidebar.tsx`, `react`, `toggle-group.tsx`, `GlassCard.tsx`, `drawer.tsx`, `dialog.tsx`, `button.tsx`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `ScheduleManager.tsx`, `app/page.tsx`, `OtpLoginForm.tsx`, `BookingStatus`, `BookingDetailDialog.tsx`, `sidebar.tsx`, `cn`, `GlassCard.tsx`, `BookingWizard.tsx`, `drawer.tsx`, `package.json`, `dialog.tsx`, `discounts/page.tsx`, `button.tsx`, `booking-customization.test.tsx`, `Step2DateTime.tsx`, `Step3Details.tsx`, `toggle-group.tsx`, `[id]/page.tsx`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Why does `drizzle-orm` connect `db.ts` to `ScheduleManager.tsx`, `app/page.tsx`, `Step3Details.tsx`, `BookingStatus`, `OtpLoginForm.tsx`, `create/route.ts`, `schema.ts`, `seed.ts`, `[id]/page.tsx`, `dashboard/page.tsx`, `slots.ts`, `queue.ts`, `package.json`, `discounts/page.tsx`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _385 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `db.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10873440285204991 - nodes in this community are weakly interconnected._
- **Should `ScheduleManager.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08258258258258258 - nodes in this community are weakly interconnected._
- **Should `app/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08403361344537816 - nodes in this community are weakly interconnected._