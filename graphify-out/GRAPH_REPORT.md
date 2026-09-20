# Graph Report - nakhlespa  (2026-09-20)

## Corpus Check
- 174 files · ~77,299 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 4, .css 2, .example 1)

## Summary
- 1070 nodes · 2321 edges · 78 communities (67 shown, 11 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 140 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `85f50145`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- next
- react
- ServicesSection.tsx
- OtpLoginForm.tsx
- drizzle-orm
- DatePicker.tsx
- ui.shadcn-components-radix-data-table.md
- ui.shadcn-components-radix-sidebar.md
- compilerOptions
- sidebar.tsx
- schema.ts
- Prisma to Drizzle Migration Design
- seed.ts
- devDependencies
- components.json
- slots.ts
- Coolify Deployment
- cn
- create/route.ts
- GlassCard.tsx
- BookingWizard.tsx
- CustomerBookingsDrawer.tsx
- Step3Details.tsx
- package.json
- Architecture
- 0000_baseline.sql
- index.ts
- Health Intake Form Design
- health-intake.ts
- BookingDetailDialog.tsx
- discounts/page.tsx
- Sidebar
- Person
- Step1Service.tsx
- Step2DateTime.tsx
- booking-create-customization.test.ts
- columns.tsx
- dependencies
- app/layout.tsx
- booking-create-health-intake.test.ts
- Booking Customization Design
- AGENTS.md
- Booking Customization Disclosure Design
- scripts
- utils.ts
- Global Constraints
- booking-customization.ts
- GoldButton.tsx
- ParticleCanvas
- AdminSidebar.tsx
- Global Constraints
- (panel)/layout.tsx
- Database-Backed Booking Customizations
- health-form/page.tsx
- SidebarGroup
- ThemeToggle.tsx
- booking-customization.test.tsx
- ScheduleManager
- BookingDialogProvider.tsx
- Global Constraints
- Gradient Waves Landing Background
- "booking_customizations"
- SidebarMenu
- [...all]/route.ts
- health-intake.test.tsx
- postcss.config.mjs
- SidebarProvider
- tailwindcss
- HealthQuestionnaire
- StepCustomization.tsx
- dashboard/page.tsx
- queue.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 145 edges
2. `next` - 47 edges
3. `react` - 41 edges
4. `drizzle-orm` - 38 edges
5. `db` - 38 edges
6. `GlassCard()` - 20 edges
7. `BookingStatus` - 20 edges
8. `getDefaultCustomization()` - 19 edges
9. `Button()` - 17 edges
10. `GoldButton()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Task 1: Specify the disclosure and visual contracts with failing tests` --references--> `goNext()`  [INFERRED]
  docs/superpowers/plans/2026-09-08-booking-customization-disclosure.md → src/components/booking/BookingWizard.tsx
- `Task 1: Specify the disclosure and visual contracts with failing tests` --references--> `goBack()`  [INFERRED]
  docs/superpowers/plans/2026-09-08-booking-customization-disclosure.md → src/components/booking/BookingWizard.tsx
- `Task 2: Integrate waves into the landing page only` --references--> `AmbientBackground()`  [INFERRED]
  docs/superpowers/plans/2026-09-14-gradient-waves-landing-background.md → src/components/ui/AmbientBackground.tsx
- `Design` --references--> `AmbientBackground()`  [INFERRED]
  docs/superpowers/specs/2026-09-14-gradient-waves-landing-background-design.md → src/components/ui/AmbientBackground.tsx
- `Task 4: Add authenticated admin print forms` --references--> `HealthFormPage()`  [INFERRED]
  docs/superpowers/plans/2026-09-08-health-intake-form.md → src/app/admin/(panel)/bookings/[id]/health-form/page.tsx

## Import Cycles
- None detected.

## Communities (78 total, 11 thin omitted)

### Community 0 - "next"
Cohesion: 0.09
Nodes (11): config, next, dynamic, dynamic, dynamic, blockedSlots, customerSessions, customizationOptions (+3 more)

### Community 1 - "react"
Cohesion: 0.14
Nodes (16): react, sonner, DataTableProps, BookingActions(), Block, DAY_NAMES, Hour, Input() (+8 more)

### Community 2 - "ServicesSection.tsx"
Cohesion: 0.28
Nodes (7): DESCRIPTIONS, formatDuration(), ServicesSection(), Props, SYMBOL_ICONS, TIER_COLORS, TierIcon()

### Community 3 - "OtpLoginForm.tsx"
Cohesion: 0.11
Nodes (25): axios, ref_crypto, ref_node_assert, ref_node_test, GET(), hashCode(), POST(), hashCode() (+17 more)

### Community 4 - "drizzle-orm"
Cohesion: 0.15
Nodes (18): Task 5: Convert admin and customer pages/routes and shared types, drizzle-orm, GET(), dynamic, ConfirmPage(), toFaTime(), MyBookingsPage(), BookingDetailPage() (+10 more)

### Community 5 - "DatePicker.tsx"
Cohesion: 0.12
Nodes (20): date-fns-jalali, lucide-react, react-day-picker, Calendar(), CalendarDayButton(), DatePicker(), DatePickerProps, jalaliLocale (+12 more)

### Community 6 - "ui.shadcn-components-radix-data-table.md"
Cohesion: 0.06
Nodes (32): Add pagination controls, Basic Table, Cell Formatting, Column Definitions, Column header, Column toggle, `<DataTable />` component, Filtering (+24 more)

### Community 7 - "ui.shadcn-components-radix-sidebar.md"
Cohesion: 0.16
Nodes (13): SidebarMenuAction(), SidebarMenuBadge(), SidebarMenuItem(), Controlled Sidebar, Installation, RTL, SidebarMenuAction, SidebarMenuBadge (+5 more)

### Community 8 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 9 - "sidebar.tsx"
Cohesion: 0.16
Nodes (13): SidebarContext, SidebarContextProps, SidebarInput(), SidebarMenuButton(), sidebarMenuButtonVariants, SidebarMenuSubButton(), SidebarMenuSubItem(), SidebarProvider() (+5 more)

### Community 10 - "schema.ts"
Cohesion: 0.05
Nodes (40): Database Models, ref_node_crypto, accountRelations, Addon, addonsRelations, BlockedSlot, Booking, BookingAddon (+32 more)

### Community 11 - "Prisma to Drizzle Migration Design"
Cohesion: 0.09
Nodes (23): File map, Global Constraints, Prisma to Drizzle Migration Implementation Plan, Task 1: Add Drizzle dependencies and database primitives, Task 2: Establish a non-destructive Drizzle migration baseline, Task 3: Migrate Better Auth and seed behavior, Task 4: Convert shared server libraries and booking/payment workflows, Task 6: Remove Prisma tooling and update deployment/documentation (+15 more)

### Community 12 - "seed.ts"
Cohesion: 0.14
Nodes (10): dynamic, addons, DiscountType, daysFromNow(), main(), seedAdmin(), seedDatabase(), auth (+2 more)

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
Cohesion: 0.09
Nodes (33): buttonVariants, ProgressIndicator(), ProgressLabel(), ProgressTrack(), ProgressValue(), QuestionnaireActions(), QuestionnaireChoice(), QuestionnaireChoiceDescription() (+25 more)

### Community 18 - "create/route.ts"
Cohesion: 0.18
Nodes (15): Payments & SMS, addMinutesToTime(), POST(), timeToMinutes(), GET(), GET(), bookingAddons, bookingCustomizations (+7 more)

### Community 19 - "GlassCard.tsx"
Cohesion: 0.15
Nodes (14): Key UI Patterns, framer-motion, dynamic, BookButton(), BookingDialogProvider(), ConfirmCheckmark(), BookingCtaSection(), fadeUp (+6 more)

### Community 20 - "BookingWizard.tsx"
Cohesion: 0.13
Nodes (15): BookingWizard(), goBack(), goNext(), emptyPerson(), variants, GenderWindows, Props, StepGender() (+7 more)

### Community 21 - "CustomerBookingsDrawer.tsx"
Cohesion: 0.09
Nodes (20): BookingHistoryList(), FullBooking, STATUS_COLOR, STATUS_LABEL, CustomerBookingsDrawer(), handleOpenChange(), loadBookings(), DrawerBookings (+12 more)

### Community 22 - "Step3Details.tsx"
Cohesion: 0.24
Nodes (13): Task 2: Add the required per-person questionnaire to the details step, isValidIranPhone(), Props, Step3Details(), handlePhoneChange(), setPerson(), toEnDigits(), toFaOrdinal() (+5 more)

### Community 23 - "package.json"
Cohesion: 0.08
Nodes (22): name, private, version, @better-auth/drizzle-adapter, clsx, cn, date-fns, drizzle-kit (+14 more)

### Community 24 - "Architecture"
Cohesion: 0.17
Nodes (10): Admin Area (`/admin/*`), Architecture, Commands, Customer Portal (`/my/*`), Environment Files, Path Alias, Slot Availability (`src/lib/slots.ts`), Stack (+2 more)

### Community 25 - "0000_baseline.sql"
Cohesion: 0.16
Nodes (21): "account", "addons", "blocked_slots", "booking_addons", booking_addons_addonId_idx, booking_addons_bookingId_idx, "bookings", bookings_date_idx (+13 more)

### Community 26 - "index.ts"
Cohesion: 0.22
Nodes (8): BookingSummary, CustomerBookingDTO, CustomizationKey, Loofah, MusicGenre, Poultice, PressureLevel, Soap

### Community 27 - "Health Intake Form Design"
Cohesion: 0.15
Nodes (12): Admin print view, Booking flow, Goal, Health Intake Form Design, Privacy and access, Question groups, Stored data, Verification (+4 more)

### Community 28 - "health-intake.ts"
Cohesion: 0.19
Nodes (12): Task 1: Add the health-intake data contract and migration, FEMALE_ONLY_CONDITIONS, HEALTH_CONDITION_KEY_SET, HEALTH_CONDITION_KEYS, HEALTH_INTAKE_SECTIONS, HealthCondition, HealthIntake, HealthIntakeSection (+4 more)

### Community 29 - "BookingDetailDialog.tsx"
Cohesion: 0.19
Nodes (11): statusLabel, statusStyle, Props, Dialog(), DialogContent(), DialogDescription(), DialogFooter(), DialogHeader() (+3 more)

### Community 30 - "discounts/page.tsx"
Cohesion: 0.32
Nodes (3): dynamic, DiscountManager(), DiscountCodeDTO

### Community 31 - "Sidebar"
Cohesion: 0.24
Nodes (11): SheetContent(), Sidebar(), SidebarRail(), SidebarTrigger(), useSidebar(), Changelog, Composition, RTL Support (+3 more)

### Community 32 - "Person"
Cohesion: 0.24
Nodes (10): Booking Customization Implementation Plan, File Map, Task 2: Add persistence and migration, Task 4: Send and validate customizations in booking creation, Task 5: Display choices in customer review and staff views, Task 6: Final verification and migration readiness, Task 3: Validate and persist health intake through booking creation, BookingCreateInput (+2 more)

### Community 33 - "Step1Service.tsx"
Cohesion: 0.18
Nodes (18): Task 1: Define the shared customization contract, emptyPerson(), Props, Step1Service(), addPerson(), selectService(), setPerson(), toggleAddon() (+10 more)

### Community 34 - "Step2DateTime.tsx"
Cohesion: 0.33
Nodes (8): getDates(), iranianDayOfWeek(), JS_TO_IR, Props, Step2DateTime(), toFaNum(), toFaTime(), SlotDTO

### Community 35 - "booking-create-customization.test.ts"
Cohesion: 0.15
Nodes (10): getDefaultHealthIntake(), addonRows, booking(), calls, db, persistedBookings, QueryValue, requestedServiceIds (+2 more)

### Community 36 - "columns.tsx"
Cohesion: 0.18
Nodes (11): @tanstack/react-table, BookingDetailDialog(), BookingAddonRow, BookingRow, columns, statusLabel, statusStyle, BookingsDataTable() (+3 more)

### Community 37 - "dependencies"
Cohesion: 0.07
Nodes (29): dependencies, axios, @base-ui/react, better-auth, @better-auth/drizzle-adapter, bullmq, class-variance-authority, clsx (+21 more)

### Community 38 - "app/layout.tsx"
Cohesion: 0.29
Nodes (5): src_app_globals, metadata, vazir, viewport, Toaster()

### Community 39 - "booking-create-health-intake.test.ts"
Cohesion: 0.07
Nodes (20): ref_bun_test, ref_node_fs, ref_node_path, react-dom, SmsJobData, addonRows, calls, db (+12 more)

### Community 40 - "Booking Customization Design"
Cohesion: 0.25
Nodes (7): Alternatives considered, API and persistence, Booking Customization Design, Data model, Goal, Scope, Testing

### Community 42 - "Booking Customization Disclosure Design"
Cohesion: 0.29
Nodes (6): Booking Customization Disclosure Design, Data and behavior, Goal, Loofah explanations, User experience, Verification

### Community 43 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, db:generate, db:migrate, db:seed, dev, start, worker:sms

### Community 44 - "utils.ts"
Cohesion: 0.35
Nodes (5): @base-ui/react, class-variance-authority, ToggleGroupContext, Toggle(), toggleVariants

### Community 45 - "Global Constraints"
Cohesion: 0.38
Nodes (6): Global Constraints, Health Intake Form Implementation Plan, Task 4: Add authenticated admin print forms, Questionnaire interaction, Checkbox(), Questionnaire()

### Community 46 - "booking-customization.ts"
Cohesion: 0.13
Nodes (15): BookingDetailPage(), statusLabel, statusStyle, Props, Step4Review(), toFaTime(), CUSTOMIZATION_CATALOG, CUSTOMIZATION_DEFAULTS (+7 more)

### Community 47 - "GoldButton.tsx"
Cohesion: 0.26
Nodes (6): Props, useBookingDialog(), GoldButton(), Props, Navbar(), NavBookButton()

### Community 48 - "ParticleCanvas"
Cohesion: 0.67
Nodes (3): ParticleCanvas(), draw(), isLightTheme()

### Community 51 - "AdminSidebar.tsx"
Cohesion: 0.22
Nodes (7): AdminLoginPage(), links, SidebarFooter(), SidebarHeader(), authClient, SidebarFooter, SidebarHeader

### Community 52 - "Global Constraints"
Cohesion: 0.20
Nodes (9): Database-Backed Customization Catalog Implementation Plan, Global Constraints, Task 1: Add failing catalog and snapshot tests, Task 2: Add database schema and migration, Task 3: Move customization catalog and validation to the database, Task 4: Seed the catalog, Task 5: Integrate booking creation snapshots, Task 6: Read snapshots in booking displays (+1 more)

### Community 53 - "(panel)/layout.tsx"
Cohesion: 0.25
Nodes (5): AdminSidebar(), PageTransition(), SidebarInset(), Props, Sidebar

### Community 54 - "Database-Backed Booking Customizations"
Cohesion: 0.25
Nodes (7): Architecture, Data flow, Database-Backed Booking Customizations, Goal, Migration, Price and compatibility rules, Testing

### Community 55 - "health-form/page.tsx"
Cohesion: 0.36
Nodes (5): formatDate(), HealthFormPage(), persianDigits(), PrintableBooking, PrintHealthFormButton()

### Community 56 - "SidebarGroup"
Cohesion: 0.25
Nodes (8): SidebarContent(), SidebarGroup(), SidebarGroupAction(), SidebarGroupContent(), SidebarGroupLabel(), SidebarContent, SidebarGroup, SidebarMenu

### Community 57 - "ThemeToggle.tsx"
Cohesion: 0.32
Nodes (6): applyTheme(), CYCLE, LABEL, Theme, ThemeToggle(), cycle()

### Community 58 - "booking-customization.test.tsx"
Cohesion: 0.25
Nodes (3): CUSTOMIZATION_OPTIONS, person(), services

### Community 59 - "ScheduleManager"
Cohesion: 0.29
Nodes (3): ScheduleManager(), toFaDate(), toFaTime()

### Community 60 - "BookingDialogProvider.tsx"
Cohesion: 0.33
Nodes (5): Booking Flow, BookingDialog(), Ctx, CtxValue, ServiceDTO

### Community 61 - "Global Constraints"
Cohesion: 0.33
Nodes (5): Global Constraints, Gradient Waves Landing Background Implementation Plan, Task 1: Add the OGL dependency and GradientWaves component, Task 2: Integrate waves into the landing page only, Task 3: Verify visual quality and regression safety

### Community 62 - "Gradient Waves Landing Background"
Cohesion: 0.33
Nodes (5): Accessibility and performance, Design, Goal, Gradient Waves Landing Background, Verification

### Community 63 - ""booking_customizations""
Cohesion: 0.40
Nodes (5): "booking_customizations", booking_customizations_bookingId_idx, "customization_options", "public"."bookings", "public"."customization_options"

### Community 64 - "SidebarMenu"
Cohesion: 0.40
Nodes (5): SidebarMenu(), SidebarMenuSkeleton(), SidebarMenuSub(), SidebarMenuSkeleton, SidebarMenuSub

### Community 65 - "[...all]/route.ts"
Cohesion: 0.50
Nodes (3): better-auth, GET, POST

### Community 68 - "SidebarProvider"
Cohesion: 0.50
Nodes (4): Keyboard Shortcut, Props, SidebarProvider, Width

### Community 75 - "StepCustomization.tsx"
Cohesion: 0.13
Nodes (26): Global Constraints, Task 3: Add the customer customization step, Booking Customization Disclosure Implementation Plan, Global Constraints, Task 1: Specify the disclosure and visual contracts with failing tests, Task 2: Implement the optional customization panel and visual refinements, Booking flow and UI, Layout and visual treatment (+18 more)

### Community 79 - "dashboard/page.tsx"
Cohesion: 0.40
Nodes (5): DashboardPage(), dynamic, statusLabel, statusStyle, toFaDate()

### Community 87 - "queue.ts"
Cohesion: 0.18
Nodes (11): bullmq, smsReminders, SmsReminderStatus, SmsReminderStatusValue, connectionOpts, processSmsJob(), smsQueue, startSmsWorker() (+3 more)

## Knowledge Gaps
- **363 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+358 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 472 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `react`, `DatePicker.tsx`, `ui.shadcn-components-radix-sidebar.md`, `sidebar.tsx`, `GlassCard.tsx`, `BookingWizard.tsx`, `CustomerBookingsDrawer.tsx`, `Step3Details.tsx`, `BookingDetailDialog.tsx`, `Sidebar`, `Step1Service.tsx`, `utils.ts`, `Global Constraints`, `GoldButton.tsx`, `AdminSidebar.tsx`, `(panel)/layout.tsx`, `SidebarGroup`, `SidebarMenu`, `HealthQuestionnaire`, `StepCustomization.tsx`?**
  _High betweenness centrality (0.157) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `OtpLoginForm.tsx`, `drizzle-orm`, `DatePicker.tsx`, `sidebar.tsx`, `cn`, `GlassCard.tsx`, `BookingWizard.tsx`, `CustomerBookingsDrawer.tsx`, `Step3Details.tsx`, `package.json`, `BookingDetailDialog.tsx`, `discounts/page.tsx`, `Step2DateTime.tsx`, `booking-create-health-intake.test.ts`, `utils.ts`, `booking-customization.ts`, `AdminSidebar.tsx`, `(panel)/layout.tsx`, `ThemeToggle.tsx`, `booking-customization.test.tsx`, `BookingDialogProvider.tsx`, `health-intake.test.tsx`, `StepCustomization.tsx`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Why does `next` connect `next` to `react`, `ServicesSection.tsx`, `OtpLoginForm.tsx`, `drizzle-orm`, `app/layout.tsx`, `seed.ts`, `booking-customization.ts`, `dashboard/page.tsx`, `slots.ts`, `GoldButton.tsx`, `create/route.ts`, `AdminSidebar.tsx`, `package.json`, `(panel)/layout.tsx`, `queue.ts`, `health-form/page.tsx`, `CustomerBookingsDrawer.tsx`, `BookingDetailDialog.tsx`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `cn()` (e.g. with `Global Constraints` and `Task 3: Add the customer customization step`) actually correct?**
  _`cn()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _363 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.08780487804878048 - nodes in this community are weakly interconnected._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.14492753623188406 - nodes in this community are weakly interconnected._