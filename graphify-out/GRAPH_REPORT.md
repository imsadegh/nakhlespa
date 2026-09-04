# Graph Report - nakhlespa  (2026-09-04)

## Corpus Check
- 130 files · ~48,381 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 777 nodes · 1408 edges · 72 communities (37 shown, 29 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c19a352d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- db.ts
- ScheduleManager.tsx
- app/page.tsx
- otp/verify/route.ts
- confirm/[token]/page.tsx
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
- GoldButton.tsx
- BookingWizard.tsx
- utils.ts
- drizzle-migration.test.ts
- @better-auth/drizzle-adapter
- Architecture
- date-fns
- drizzle-orm
- framer-motion
- index.ts
- sheet.tsx
- Step1Service.tsx
- Step2DateTime.tsx
- Step3Details.tsx
- progress.tsx
- dependencies
- app/layout.tsx
- create/route.ts
- AGENTS.md
- better-auth
- bullmq
- class-variance-authority
- clsx
- date-fns-jalali
- @fontsource-variable/vazirmatn
- ioredis
- lucide-react
- next.config.ts
- next-themes
- pg
- react
- react-day-picker
- shadcn
- sonner
- tailwind-merge
- @tanstack/react-table
- tw-animate-css
- @types/pg
- postcss.config.mjs
- tailwind.config.ts
- AdminSidebar.tsx
- Step4Review.tsx
- BookingStatus
- production-compose.test.ts
- addons/route.ts
- next
- queue.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 104 edges
2. `db` - 34 edges
3. `GlassCard()` - 18 edges
4. `BookingStatus` - 18 edges
5. `compilerOptions` - 16 edges
6. `GoldButton()` - 14 edges
7. `bookings` - 14 edges
8. `Button()` - 11 edges
9. `Architecture` - 11 edges
10. `AmbientBackground()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `CalendarDayButton()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/calendar.tsx → src/lib/utils.ts
- `DialogOverlay()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/dialog.tsx → src/lib/utils.ts
- `DialogFooter()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/dialog.tsx → src/lib/utils.ts
- `DialogDescription()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/dialog.tsx → src/lib/utils.ts
- `PopoverHeader()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/popover.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (72 total, 29 thin omitted)

### Community 0 - "db.ts"
Cohesion: 0.13
Nodes (6): dynamic, dynamic, blockedSlots, WorkingHours, db, globalForDb

### Community 1 - "ScheduleManager.tsx"
Cohesion: 0.15
Nodes (15): DataTableProps, Block, DAY_NAMES, Hour, ScheduleManager(), toFaDate(), toFaTime(), Table() (+7 more)

### Community 2 - "app/page.tsx"
Cohesion: 0.07
Nodes (31): dynamic, dynamic, BookButton(), BookingDialog(), BookingDialogProvider(), Ctx, CtxValue, useBookingDialog() (+23 more)

### Community 3 - "otp/verify/route.ts"
Cohesion: 0.23
Nodes (14): hashCode(), POST(), hashCode(), POST(), safeEqual(), OtpLoginForm(), handleVerify(), Verification (+6 more)

### Community 4 - "confirm/[token]/page.tsx"
Cohesion: 0.08
Nodes (24): AdminLoginPage(), { GET, POST }, ConfirmPage(), toFaTime(), MyBookingsPage(), BookingDetailPage(), STATUS_LABEL, ConfirmCheckmark() (+16 more)

### Community 5 - "BookingDetailDialog.tsx"
Cohesion: 0.06
Nodes (41): BookingDetailDialog(), statusLabel, statusStyle, BookingAddonRow, BookingRow, columns, statusLabel, statusStyle (+33 more)

### Community 6 - "ui.shadcn-components-radix-data-table.md"
Cohesion: 0.06
Nodes (32): Add pagination controls, Basic Table, Cell Formatting, Column Definitions, Column header, Column toggle, `<DataTable />` component, Filtering (+24 more)

### Community 7 - "ui.shadcn-components-radix-sidebar.md"
Cohesion: 0.07
Nodes (29): Changelog, Composition, Controlled Sidebar, Installation, Keyboard Shortcut, Props, Props, RTL (+21 more)

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 9 - "sidebar.tsx"
Cohesion: 0.10
Nodes (23): Sidebar(), SidebarContext, SidebarContextProps, SidebarGroupAction(), SidebarGroupLabel(), SidebarInput(), SidebarMenuAction(), SidebarMenuBadge() (+15 more)

### Community 10 - "schema.ts"
Cohesion: 0.05
Nodes (35): Account, accountRelations, Addon, addonsRelations, BlockedSlot, BookingAddon, bookingAddonsRelations, bookingsRelations (+27 more)

### Community 11 - "File map"
Cohesion: 0.18
Nodes (10): File map, Global Constraints, Prisma to Drizzle Migration Implementation Plan, Task 1: Add Drizzle dependencies and database primitives, Task 2: Establish a non-destructive Drizzle migration baseline, Task 3: Migrate Better Auth and seed behavior, Task 4: Convert shared server libraries and booking/payment workflows, Task 5: Convert admin and customer pages/routes and shared types (+2 more)

### Community 12 - "seed.ts"
Cohesion: 0.25
Nodes (7): discountCodes, DiscountType, User, daysFromNow(), main(), seedAdmin(), seedDatabase()

### Community 13 - "devDependencies"
Cohesion: 0.07
Nodes (26): drizzle-kit, devDependencies, drizzle-kit, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+18 more)

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
Cohesion: 0.18
Nodes (18): Card(), CardAction(), CardContent(), CardDescription(), CardFooter(), CardHeader(), CardTitle(), Props (+10 more)

### Community 18 - "Prisma to Drizzle Migration Design"
Cohesion: 0.20
Nodes (9): Architecture, Authentication, Goal, Out of scope, Prisma to Drizzle Migration Design, Query and transaction migration, Scope, Seed and deployment (+1 more)

### Community 19 - "GoldButton.tsx"
Cohesion: 0.38
Nodes (3): Props, GoldButton(), Props

### Community 20 - "BookingWizard.tsx"
Cohesion: 0.17
Nodes (10): BookingWizard(), emptyPerson(), variants, GenderWindows, Props, StepGender(), toFaTime(), StepProgress() (+2 more)

### Community 21 - "utils.ts"
Cohesion: 0.22
Nodes (4): Input(), Separator(), Skeleton(), Textarea()

### Community 24 - "Architecture"
Cohesion: 0.13
Nodes (13): Admin Area (`/admin/*`), Architecture, Booking Flow, Commands, Customer Portal (`/my/*`), Database Models, Environment Files, Key UI Patterns (+5 more)

### Community 30 - "index.ts"
Cohesion: 0.19
Nodes (8): dynamic, DiscountManager(), BookingCreateInput, BookingSummary, CustomerBookingDTO, DiscountCodeDTO, MultiBookingCreateInput, SlotDTO

### Community 31 - "sheet.tsx"
Cohesion: 0.18
Nodes (7): Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetTitle()

### Community 33 - "Step1Service.tsx"
Cohesion: 0.21
Nodes (11): emptyPerson(), Props, Step1Service(), addPerson(), selectService(), setPerson(), toggleAddon(), TIER_COLORS (+3 more)

### Community 34 - "Step2DateTime.tsx"
Cohesion: 0.39
Nodes (7): getDates(), iranianDayOfWeek(), JS_TO_IR, Props, Step2DateTime(), toFaNum(), toFaTime()

### Community 35 - "Step3Details.tsx"
Cohesion: 0.39
Nodes (7): isValidIranPhone(), Props, Step3Details(), handlePhoneChange(), setPerson(), toEnDigits(), toFaOrdinal()

### Community 36 - "progress.tsx"
Cohesion: 0.33
Nodes (5): Progress(), ProgressIndicator(), ProgressLabel(), ProgressTrack(), ProgressValue()

### Community 37 - "dependencies"
Cohesion: 0.29
Nodes (7): axios, @base-ui/react, dependencies, axios, @base-ui/react, react-dom, react-dom

### Community 38 - "app/layout.tsx"
Cohesion: 0.33
Nodes (4): metadata, vazir, viewport, Toaster()

### Community 39 - "create/route.ts"
Cohesion: 0.25
Nodes (10): addMinutesToTime(), POST(), timeToMinutes(), GET(), GET(), Booking, bookingAddons, checkLoyaltyDiscount() (+2 more)

### Community 74 - "AdminSidebar.tsx"
Cohesion: 0.14
Nodes (11): AdminSidebar(), links, PageTransition(), SidebarContent(), SidebarFooter(), SidebarGroup(), SidebarGroupContent(), SidebarHeader() (+3 more)

### Community 75 - "Step4Review.tsx"
Cohesion: 0.28
Nodes (5): Props, Step4Review(), toFaTime(), GhostButton(), Props

### Community 79 - "BookingStatus"
Cohesion: 0.15
Nodes (9): statusLabel, statusStyle, DashboardPage(), dynamic, statusLabel, statusStyle, toFaDate(), bookings (+1 more)

### Community 82 - "production-compose.test.ts"
Cohesion: 0.40
Nodes (4): compose, dockerfile, envExample, legacyOrm

### Community 87 - "queue.ts"
Cohesion: 0.13
Nodes (21): GET(), smsReminders, SmsReminderStatus, SmsReminderStatusValue, connectionOpts, processSmsJob(), SmsJobData, SmsJobDependencies (+13 more)

## Knowledge Gaps
- **295 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+290 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 363 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **29 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `ScheduleManager.tsx`, `app/page.tsx`, `progress.tsx`, `BookingDetailDialog.tsx`, `sidebar.tsx`, `AdminSidebar.tsx`, `Step4Review.tsx`, `GoldButton.tsx`, `utils.ts`, `sheet.tsx`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `db` connect `db.ts` to `app/page.tsx`, `otp/verify/route.ts`, `confirm/[token]/page.tsx`, `BookingDetailDialog.tsx`, `create/route.ts`, `schema.ts`, `seed.ts`, `BookingStatus`, `slots.ts`, `addons/route.ts`, `queue.ts`, `index.ts`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `GlassCard()` connect `app/page.tsx` to `ScheduleManager.tsx`, `Step1Service.tsx`, `otp/verify/route.ts`, `confirm/[token]/page.tsx`, `Step4Review.tsx`, `BookingStatus`, `cn`, `GoldButton.tsx`, `index.ts`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _295 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `db.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13405797101449277 - nodes in this community are weakly interconnected._
- **Should `app/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06859903381642513 - nodes in this community are weakly interconnected._
- **Should `confirm/[token]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._