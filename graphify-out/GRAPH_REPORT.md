# Graph Report - nakhlespa  (2026-10-09)

## Corpus Check
- 178 files · ~109,334 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 14 file(s) not represented in the graph (top: (none) 4, .css 2, .hm 1)

## Summary
- 1096 nodes · 2555 edges · 65 communities (55 shown, 10 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 140 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2f5871db`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- db.ts
- ScheduleManager.tsx
- otp/verify/route.ts
- queue.ts
- next
- react
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
- Dokploy Deployment
- cn
- create/route.ts
- GoldButton
- index.ts
- Button
- Step3Details.tsx
- package.json
- OtpLoginForm.tsx
- 0000_baseline.sql
- Navbar.tsx
- Health Intake Form Design
- columns.tsx
- BookingDetailDialog.tsx
- Dokploy Deployment Design
- sheet.tsx
- Person
- BookingDialogProvider.tsx
- Step2DateTime.tsx
- progress.tsx
- Global Constraints
- dependencies
- lucide-react
- booking-create-health-intake.test.ts
- Booking Customization Design
- AGENTS.md
- admin/customizations/route.ts
- scripts
- utils.ts
- Q: does all component of the homepage use shadcn/ui? my laptop will got hot in homepage what optimization can we apply to its animation?
- booking-customization.ts
- GlassCard
- Global Constraints
- (panel)/layout.tsx
- Database-Backed Booking Customizations
- booking-customization.test.tsx
- AmbientBackground
- Gradient Waves Landing Background
- "booking_customizations"
- postcss.config.mjs
- tailwindcss
- StepCustomization.tsx
- dashboard/page.tsx

## God Nodes (most connected - your core abstractions)
1. `cn()` - 145 edges
2. `next` - 47 edges
3. `react` - 41 edges
4. `drizzle-orm` - 38 edges
5. `GlassCard()` - 38 edges
6. `db` - 38 edges
7. `GoldButton()` - 29 edges
8. `Button()` - 29 edges
9. `AmbientBackground()` - 24 edges
10. `StepCustomizationContent()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `Booking Flow` --references--> `BookingDialog()`  [INFERRED]
  CLAUDE.md → src/components/booking/BookingDialog.tsx
- `Task 1: Specify the disclosure and visual contracts with failing tests` --references--> `goNext()`  [INFERRED]
  docs/superpowers/plans/2026-09-08-booking-customization-disclosure.md → src/components/booking/BookingWizard.tsx
- `Task 1: Specify the disclosure and visual contracts with failing tests` --references--> `goBack()`  [INFERRED]
  docs/superpowers/plans/2026-09-08-booking-customization-disclosure.md → src/components/booking/BookingWizard.tsx
- `Design` --references--> `AmbientBackground()`  [INFERRED]
  docs/superpowers/specs/2026-09-14-gradient-waves-landing-background-design.md → src/components/ui/AmbientBackground.tsx
- `SidebarTrigger` --references--> `SidebarTrigger()`  [INFERRED]
  ui.shadcn-components-radix-sidebar.md → src/components/ui/sidebar.tsx

## Import Cycles
- None detected.

## Communities (65 total, 10 thin omitted)

### Community 0 - "db.ts"
Cohesion: 0.10
Nodes (10): drizzle-orm, dynamic, dynamic, dynamic, dynamic, blockedSlots, discountCodes, DiscountType (+2 more)

### Community 1 - "ScheduleManager.tsx"
Cohesion: 0.18
Nodes (17): BookingsDataTable(), DataTableProps, SchedulePage(), Block, DAY_NAMES, Hour, ScheduleManager(), toFaDate() (+9 more)

### Community 2 - "otp/verify/route.ts"
Cohesion: 0.19
Nodes (10): Task 1: Add Drizzle dependencies and database primitives, Authentication, hashCode(), POST(), safeEqual(), Account, customerSessions, Session (+2 more)

### Community 3 - "queue.ts"
Cohesion: 0.06
Nodes (38): Admin Area (`/admin/*`), Architecture, Booking Flow, Commands, Customer Portal (`/my/*`), Environment Files, Path Alias, Payments & SMS (+30 more)

### Community 4 - "next"
Cohesion: 0.13
Nodes (18): config, next, BookingDetailPage(), Row(), statusLabel, statusStyle, GET(), MyBookingsPage() (+10 more)

### Community 5 - "react"
Cohesion: 0.14
Nodes (19): react, react-day-picker, Calendar(), CalendarDayButton(), DatePicker(), DatePickerProps, jalaliLocale, toFaDate() (+11 more)

### Community 6 - "ui.shadcn-components-radix-data-table.md"
Cohesion: 0.06
Nodes (32): Add pagination controls, Basic Table, Cell Formatting, Column Definitions, Column header, Column toggle, `<DataTable />` component, Filtering (+24 more)

### Community 7 - "ui.shadcn-components-radix-sidebar.md"
Cohesion: 0.09
Nodes (30): AdminSidebar(), links, SidebarContent(), SidebarFooter(), SidebarGroup(), SidebarGroupAction(), SidebarGroupContent(), SidebarGroupLabel() (+22 more)

### Community 8 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 9 - "sidebar.tsx"
Cohesion: 0.13
Nodes (18): Input(), Separator(), SidebarContext, SidebarContextProps, SidebarInput(), SidebarMenuButton(), sidebarMenuButtonVariants, SidebarMenuSkeleton() (+10 more)

### Community 10 - "schema.ts"
Cohesion: 0.05
Nodes (40): Database Models, accountRelations, Addon, addonsRelations, BlockedSlot, Booking, BookingAddon, bookingAddonsRelations (+32 more)

### Community 11 - "Prisma to Drizzle Migration Design"
Cohesion: 0.22
Nodes (8): Architecture, Goal, Out of scope, Prisma to Drizzle Migration Design, Query and transaction migration, Scope, Seed and deployment, Verification and acceptance criteria

### Community 12 - "seed.ts"
Cohesion: 0.13
Nodes (15): Task 5: Convert admin and customer pages/routes and shared types, better-auth, dynamic, GET, POST, addons, Gender, daysFromNow() (+7 more)

### Community 13 - "devDependencies"
Cohesion: 0.25
Nodes (8): devDependencies, drizzle-kit, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom, typescript

### Community 14 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 15 - "slots.ts"
Cohesion: 0.47
Nodes (9): GET(), services, getAvailableSlots(), getBlockedRanges(), getSlotsForServices(), getWorkingDay(), minutesToTime(), parseDateUTC() (+1 more)

### Community 16 - "Dokploy Deployment"
Cohesion: 0.11
Nodes (18): 1. Install dependencies, 1. Install Dokploy and prepare the VPS, 2. Create one Docker Compose resource, 2. Start Postgres and Redis locally, 3. Configure Dokploy variables and GitHub secrets, 3. Configure environment, 4. First deployment and initialization, 4. Migrate and seed the database (+10 more)

### Community 17 - "cn"
Cohesion: 0.17
Nodes (23): @shadcn/react, buttonVariants, QuestionnaireActions(), QuestionnaireChoice(), QuestionnaireChoiceDescription(), QuestionnaireError(), QuestionnaireInput(), QuestionnaireItem() (+15 more)

### Community 18 - "create/route.ts"
Cohesion: 0.25
Nodes (9): addMinutesToTime(), POST(), timeToMinutes(), GET(), GET(), bookingAddons, bookingCustomizations, checkLoyaltyDiscount() (+1 more)

### Community 19 - "GoldButton"
Cohesion: 0.15
Nodes (11): framer-motion, AdminDiscountsPage(), ConfirmPage(), toFaTime(), FailedPage(), DiscountManager(), ConfirmCheckmark(), Props (+3 more)

### Community 20 - "index.ts"
Cohesion: 0.11
Nodes (24): variants, Props, SERVICE_ICONS, updatePerson(), Props, GenderWindows, Props, StepGender() (+16 more)

### Community 21 - "Button"
Cohesion: 0.11
Nodes (25): BookingHistoryList(), FullBooking, STATUS_COLOR, STATUS_LABEL, BookingDetail(), CustomerBookingsDrawer(), handleOpenChange(), loadBookings() (+17 more)

### Community 22 - "Step3Details.tsx"
Cohesion: 0.06
Nodes (50): Global Constraints, Health Intake Form Implementation Plan, Task 1: Add the health-intake data contract and migration, Task 2: Add the required per-person questionnaire to the details step, Task 3: Validate and persist health intake through booking creation, Task 4: Add authenticated admin print forms, Questionnaire interaction, formatDate() (+42 more)

### Community 23 - "package.json"
Cohesion: 0.08
Nodes (22): name, private, version, @better-auth/drizzle-adapter, clsx, cn, date-fns, date-fns-jalali (+14 more)

### Community 24 - "OtpLoginForm.tsx"
Cohesion: 0.35
Nodes (7): OtpLoginForm(), handleVerify(), createOtpRequestGate(), getOtpErrorMessage(), isOtpCode(), normalizeOtpDigits(), OTP_ERROR_MESSAGES

### Community 25 - "0000_baseline.sql"
Cohesion: 0.16
Nodes (21): "account", "addons", "blocked_slots", "booking_addons", booking_addons_addonId_idx, booking_addons_bookingId_idx, "bookings", bookings_date_idx (+13 more)

### Community 26 - "Navbar.tsx"
Cohesion: 0.27
Nodes (9): Navbar(), NavBookButton(), applyTheme(), CYCLE, LABEL, Theme, ThemeIcon(), ThemeToggle() (+1 more)

### Community 27 - "Health Intake Form Design"
Cohesion: 0.15
Nodes (12): Admin print view, Booking flow, Goal, Health Intake Form Design, Privacy and access, Question groups, Stored data, Verification (+4 more)

### Community 28 - "columns.tsx"
Cohesion: 0.24
Nodes (9): @tanstack/react-table, BookingAddonRow, BookingRow, columns, statusLabel, statusStyle, BookingsPage(), dynamic (+1 more)

### Community 29 - "BookingDetailDialog.tsx"
Cohesion: 0.22
Nodes (14): BookingDetailDialog(), statusLabel, statusStyle, BookingDialog(), Props, Dialog(), DialogContent(), DialogDescription() (+6 more)

### Community 30 - "Dokploy Deployment Design"
Cohesion: 0.20
Nodes (9): Architecture, CI/CD, Documentation, Dokploy Deployment Design, Goal, Operational references, Production Compose, Scope (+1 more)

### Community 31 - "sheet.tsx"
Cohesion: 0.16
Nodes (16): Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetPortal(), SheetTitle() (+8 more)

### Community 32 - "Person"
Cohesion: 0.27
Nodes (9): Booking Customization Implementation Plan, File Map, Task 2: Add persistence and migration, Task 4: Send and validate customizations in booking creation, Task 5: Display choices in customer review and staff views, Task 6: Final verification and migration readiness, BookingCreateInput, BookingCustomization (+1 more)

### Community 33 - "BookingDialogProvider.tsx"
Cohesion: 0.21
Nodes (10): Ctx, CtxValue, useBookingDialog(), PRODUCT_STEPS, PRODUCTS, ServicesSection(), Props, SYMBOL_ICONS (+2 more)

### Community 34 - "Step2DateTime.tsx"
Cohesion: 0.15
Nodes (15): BookPage(), BookingWizard(), goBack(), goNext(), emptyPerson(), getDates(), iranianDayOfWeek(), JS_TO_IR (+7 more)

### Community 35 - "progress.tsx"
Cohesion: 0.39
Nodes (6): StepProgress(), Progress(), ProgressIndicator(), ProgressLabel(), ProgressTrack(), ProgressValue()

### Community 36 - "Global Constraints"
Cohesion: 0.29
Nodes (6): Dokploy Deployment Implementation Plan, Global Constraints, Task 1: Make the production image Compose-compatible, Task 2: Add the GitHub Actions Dokploy pipeline, Task 3: Replace Coolify deployment documentation with Dokploy guidance, Task 4: Verify the deployment change

### Community 37 - "dependencies"
Cohesion: 0.07
Nodes (29): dependencies, axios, @base-ui/react, better-auth, @better-auth/drizzle-adapter, bullmq, class-variance-authority, clsx (+21 more)

### Community 38 - "lucide-react"
Cohesion: 0.24
Nodes (7): lucide-react, sonner, metadata, RootLayout(), vazir, viewport, Toaster()

### Community 39 - "booking-create-health-intake.test.ts"
Cohesion: 0.05
Nodes (26): File map, Global Constraints, Prisma to Drizzle Migration Implementation Plan, Task 2: Establish a non-destructive Drizzle migration baseline, Task 3: Migrate Better Auth and seed behavior, Task 4: Convert shared server libraries and booking/payment workflows, Task 6: Remove Prisma tooling and update deployment/documentation, Task 7: Final verification and migration handoff (+18 more)

### Community 40 - "Booking Customization Design"
Cohesion: 0.12
Nodes (13): Alternatives considered, API and persistence, Booking Customization Design, Data model, Goal, Scope, Testing, Booking Customization Disclosure Design (+5 more)

### Community 43 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, build, db:generate, db:migrate, db:seed, dev, start, worker:sms

### Community 44 - "utils.ts"
Cohesion: 0.35
Nodes (5): @base-ui/react, class-variance-authority, ToggleGroupContext, Toggle(), toggleVariants

### Community 45 - "Q: does all component of the homepage use shadcn/ui? my laptop will got hot in homepage what optimization can we apply to its animation?"
Cohesion: 0.40
Nodes (4): Answer, Outcome, Q: does all component of the homepage use shadcn/ui? my laptop will got hot in homepage what optimization can we apply to its animation?, Source Nodes

### Community 46 - "booking-customization.ts"
Cohesion: 0.14
Nodes (22): Task 1: Define the shared customization contract, emptyPerson(), Step1Service(), addPerson(), selectService(), setPerson(), toggleAddon(), setCustomization() (+14 more)

### Community 47 - "GlassCard"
Cohesion: 0.22
Nodes (13): dynamic, HomePage(), BookButton(), Props, BookingDialogProvider(), BookingCtaSection(), fadeUp, HeroSection() (+5 more)

### Community 52 - "Global Constraints"
Cohesion: 0.20
Nodes (9): Database-Backed Customization Catalog Implementation Plan, Global Constraints, Task 1: Add failing catalog and snapshot tests, Task 2: Add database schema and migration, Task 3: Move customization catalog and validation to the database, Task 4: Seed the catalog, Task 5: Integrate booking creation snapshots, Task 6: Read snapshots in booking displays (+1 more)

### Community 53 - "(panel)/layout.tsx"
Cohesion: 0.22
Nodes (11): PanelLayout(), PageTransition(), SidebarInset(), SidebarProvider(), SidebarTrigger(), Keyboard Shortcut, Props, Props (+3 more)

### Community 54 - "Database-Backed Booking Customizations"
Cohesion: 0.25
Nodes (7): Architecture, Data flow, Database-Backed Booking Customizations, Goal, Migration, Price and compatibility rules, Testing

### Community 58 - "booking-customization.test.tsx"
Cohesion: 0.25
Nodes (3): CUSTOMIZATION_OPTIONS, person(), services

### Community 61 - "AmbientBackground"
Cohesion: 0.14
Nodes (14): Key UI Patterns, Global Constraints, Gradient Waves Landing Background Implementation Plan, Task 1: Add the OGL dependency and GradientWaves component, Task 2: Integrate waves into the landing page only, Task 3: Verify visual quality and regression safety, AdminLoginPage(), LoginPage() (+6 more)

### Community 62 - "Gradient Waves Landing Background"
Cohesion: 0.33
Nodes (5): Accessibility and performance, Design, Goal, Gradient Waves Landing Background, Verification

### Community 63 - ""booking_customizations""
Cohesion: 0.40
Nodes (3): "booking_customizations", booking_customizations_bookingId_idx, "customization_options"

### Community 75 - "StepCustomization.tsx"
Cohesion: 0.17
Nodes (25): Global Constraints, Task 3: Add the customer customization step, Booking Customization Disclosure Implementation Plan, Global Constraints, Task 1: Specify the disclosure and visual contracts with failing tests, Task 2: Implement the optional customization panel and visual refinements, Booking flow and UI, Layout and visual treatment (+17 more)

### Community 79 - "dashboard/page.tsx"
Cohesion: 0.40
Nodes (5): DashboardPage(), dynamic, statusLabel, statusStyle, toFaDate()

## Knowledge Gaps
- **14 isolated node(s):** `@better-auth/drizzle-adapter`, `@fontsource-variable/vazirmatn`, `@types/pg`, `cn`, `date-fns` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 474 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `ScheduleManager.tsx`, `Step2DateTime.tsx`, `progress.tsx`, `react`, `ui.shadcn-components-radix-sidebar.md`, `sidebar.tsx`, `StepCustomization.tsx`, `utils.ts`, `GlassCard`, `GoldButton`, `Button`, `Step3Details.tsx`, `(panel)/layout.tsx`, `BookingDetailDialog.tsx`, `sheet.tsx`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `cn()` (e.g. with `Global Constraints` and `Task 3: Add the customer customization step`) actually correct?**
  _`cn()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `@better-auth/drizzle-adapter`, `@fontsource-variable/vazirmatn`, `@types/pg` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `db.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09879032258064516 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `db.ts`, `ScheduleManager.tsx`, `otp/verify/route.ts`, `ui.shadcn-components-radix-sidebar.md`, `seed.ts`, `slots.ts`, `create/route.ts`, `GoldButton`, `Button`, `Step3Details.tsx`, `package.json`, `OtpLoginForm.tsx`, `Navbar.tsx`, `BookingDetailDialog.tsx`, `BookingDialogProvider.tsx`, `lucide-react`, `admin/customizations/route.ts`, `GlassCard`, `(panel)/layout.tsx`, `AmbientBackground`, `dashboard/page.tsx`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Should `queue.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.057004830917874394 - nodes in this community are weakly interconnected._
- **Why does `react` connect `react` to `ScheduleManager.tsx`, `next`, `sidebar.tsx`, `cn`, `GoldButton`, `index.ts`, `Button`, `Step3Details.tsx`, `package.json`, `OtpLoginForm.tsx`, `Navbar.tsx`, `BookingDetailDialog.tsx`, `sheet.tsx`, `BookingDialogProvider.tsx`, `Step2DateTime.tsx`, `booking-create-health-intake.test.ts`, `utils.ts`, `GlassCard`, `(panel)/layout.tsx`, `booking-customization.test.tsx`, `AmbientBackground`, `StepCustomization.tsx`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._