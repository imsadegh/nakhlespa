# Graph Report - nakhlespa  (2026-08-25)

## Corpus Check
- 139 files · ~86,577 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 908 nodes · 1412 edges · 73 communities (45 shown, 28 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `02e45ec6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- prisma.ts
- ScheduleManager.tsx
- app/page.tsx
- OtpLoginForm.tsx
- AmbientBackground.tsx
- BookingDetailDialog.tsx
- ui.shadcn-components-radix-data-table.md
- ui.shadcn-components-radix-sidebar.md
- compilerOptions
- sidebar.tsx
- نخلسپا — Spa Booking Website Design Spec
- Customer Portal & Discount System — Design Spec
- Gender-Separated Booking Design
- package.json
- components.json
- Multi-Room Simultaneous Booking
- VPS Deployment (Ubuntu)
- cn
- Room Tiers & Add-ons Design
- GlassCard.tsx
- index.ts
- Supabase → Postgres + Better Auth + BullMQ Migration Plan
- File Map
- نخلسپا Spa Booking Website Implementation Plan
- Architecture
- Multi-Room Simultaneous Booking — Implementation Plan
- Gender-Separated Booking Implementation Plan
- utils.ts
- shadcn/ui Migration Implementation Plan
- Room Tiers & Add-ons Implementation Plan
- DiscountManager.tsx
- sheet.tsx
- (panel)/layout.tsx
- Step1Service
- Step2DateTime.tsx
- Step3Details.tsx
- progress.tsx
- dependencies
- app/layout.tsx
- StepGender.tsx
- tooltip.tsx
- AGENTS.md
- axios
- @base-ui/react
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
- prisma
- @prisma/adapter-pg
- @prisma/client
- react
- react-day-picker
- react-dom
- shadcn
- sonner
- tailwind-merge
- @tanstack/react-table
- tw-animate-css
- @types/pg
- postcss.config.mjs
- tailwind.config.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 104 edges
2. `prisma` - 33 edges
3. `GlassCard()` - 18 edges
4. `compilerOptions` - 16 edges
5. `نخلسپا Spa Booking Website Implementation Plan` - 15 edges
6. `نخلسپا — Spa Booking Website Design Spec` - 15 edges
7. `GoldButton()` - 14 edges
8. `File Map` - 14 edges
9. `Multi-Room Simultaneous Booking — Implementation Plan` - 13 edges
10. `Gender-Separated Booking Implementation Plan` - 13 edges

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

## Communities (73 total, 28 thin omitted)

### Community 0 - "prisma.ts"
Cohesion: 0.05
Nodes (28): statusLabel, statusStyle, DashboardPage(), statusLabel, statusStyle, toFaDate(), dynamic, addMinutesToTime() (+20 more)

### Community 1 - "ScheduleManager.tsx"
Cohesion: 0.08
Nodes (30): DataTableProps, Block, DAY_NAMES, Hour, ScheduleManager(), toFaDate(), toFaTime(), DatePicker() (+22 more)

### Community 2 - "app/page.tsx"
Cohesion: 0.08
Nodes (27): BookButton(), Props, BookingDialog(), BookingDialogProvider(), Ctx, CtxValue, useBookingDialog(), BookingCtaSection() (+19 more)

### Community 3 - "OtpLoginForm.tsx"
Cohesion: 0.12
Nodes (26): GET(), hashCode(), POST(), hashCode(), POST(), safeEqual(), OtpLoginForm(), handleVerify() (+18 more)

### Community 4 - "AmbientBackground.tsx"
Cohesion: 0.09
Nodes (23): adapter, daysFromNow(), main(), prisma, { GET, POST }, MyBookingsPage(), BookingDetailPage(), STATUS_LABEL (+15 more)

### Community 5 - "BookingDetailDialog.tsx"
Cohesion: 0.09
Nodes (23): BookingDetailDialog(), statusLabel, statusStyle, BookingAddonRow, BookingRow, columns, statusLabel, statusStyle (+15 more)

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
Cohesion: 0.11
Nodes (26): links, Sidebar(), SidebarContent(), SidebarContext, SidebarContextProps, SidebarFooter(), SidebarGroup(), SidebarGroupAction() (+18 more)

### Community 10 - "نخلسپا — Spa Booking Website Design Spec"
Cohesion: 0.07
Nodes (26): 10. SMS Reminders Cron Job, 11. Animations (Framer Motion), 12. Infrastructure (VPS), 13. Environment Variables, 14. Out of Scope (v1), 1. Project Overview, 2. Tech Stack, 3. Color Palette (+18 more)

### Community 11 - "Customer Portal & Discount System — Design Spec"
Cohesion: 0.08
Nodes (25): `/admin/discounts` (new page), Admin UI, `AdminSidebar.tsx`, Changes to `Booking`, Checkout flow changes, Confirmation page link, Customer Portal & Discount System — Design Spec, Customer Portal Pages (+17 more)

### Community 12 - "Gender-Separated Booking Design"
Cohesion: 0.08
Nodes (23): Admin bookings API (`GET /api/admin/bookings`), Admin Dashboard, API — `POST /api/bookings/create`, API — `PUT /api/admin/schedule/hours`, `Booking` — add `gender` column, Booking detail dialog (`BookingDetailDialog.tsx`), Booking Wizard (Customer-facing), Bookings table (`columns.tsx`) (+15 more)

### Community 13 - "package.json"
Cohesion: 0.09
Nodes (22): devDependencies, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom, typescript, name (+14 more)

### Community 14 - "components.json"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 15 - "Multi-Room Simultaneous Booking"
Cohesion: 0.09
Nodes (21): 1. Slot Availability Logic (Backend), 2. Step 2 (Date/Time) UI, 3. Multi-Person Wizard Flow, 4. Backend: `/api/bookings/create`, 5. Schema Change, 6. Confirm Page (`/booking/confirm/[token]`), 7. Out of Scope, `/api/bookings/verify` (+13 more)

### Community 16 - "VPS Deployment (Ubuntu)"
Cohesion: 0.09
Nodes (21): 1. Install dependencies, 1. Install system dependencies, 2. Clone and install, 2. Start Postgres and Redis locally, 3. Configure environment, 3. Start Postgres and Redis, 4. Configure environment, 4. Migrate and seed the database (+13 more)

### Community 17 - "cn"
Cohesion: 0.18
Nodes (18): Card(), CardAction(), CardContent(), CardDescription(), CardFooter(), CardHeader(), CardTitle(), SelectContent() (+10 more)

### Community 18 - "Room Tiers & Add-ons Design"
Cohesion: 0.10
Nodes (19): Add-ons, Admin Booking Detail, API Changes, `Booking` model — new fields, Data Model Changes, `GET /api/addons` — new route, `GET /api/services` — no route change, Migration (+11 more)

### Community 19 - "GlassCard.tsx"
Cohesion: 0.16
Nodes (10): AdminLoginPage(), ConfirmPage(), toFaTime(), ConfirmCheckmark(), steps, GlassCard(), Props, GoldButton() (+2 more)

### Community 20 - "index.ts"
Cohesion: 0.17
Nodes (14): variants, Props, TIER_COLORS, Props, Step4Review(), toFaTime(), AddonDTO, BookingSummary (+6 more)

### Community 21 - "Supabase → Postgres + Better Auth + BullMQ Migration Plan"
Cohesion: 0.11
Nodes (17): File Map, Global Constraints, Path A — Coolify already installed, Path B — No Coolify yet (manual Podman container), Placeholder scan, Self-Review, Spec coverage, Supabase → Postgres + Better Auth + BullMQ Migration Plan (+9 more)

### Community 22 - "File Map"
Cohesion: 0.12
Nodes (16): Customer Portal & Discount System Implementation Plan, File Map, Global Constraints, Task 10: Customer booking history pages, Task 11: Confirmation page link + AdminSidebar update, Task 12: Admin discounts page, Task 13: Add SMSIR_TEMPLATE_OTP to env documentation, Task 1: Schema migration — add CustomerSession, DiscountCode, update Booking (+8 more)

### Community 23 - "نخلسپا Spa Booking Website Implementation Plan"
Cohesion: 0.12
Nodes (15): File Map, Self-Review Checklist, Task 10: SMS Reminder Cron Job, Task 11: Admin Panel, Task 12: Infrastructure — VPS Deployment, Task 1: Project Scaffold, Task 2: Database Schema + Prisma, Task 3: Shared Types + Lib Helpers (+7 more)

### Community 24 - "Architecture"
Cohesion: 0.13
Nodes (13): Admin Area (`/admin/*`), Architecture, Booking Flow, Commands, Customer Portal (`/my/*`), Database Models, Environment Files, Key UI Patterns (+5 more)

### Community 25 - "Multi-Room Simultaneous Booking — Implementation Plan"
Cohesion: 0.14
Nodes (13): File Map, Global Constraints, Multi-Room Simultaneous Booking — Implementation Plan, Self-Review, Task 1: Schema — Add `groupToken` to Booking, Task 2: Types — Update shared type definitions, Task 3: Slot Logic — Per-room availability count, Task 4: Wizard State + Step 2 (Date/Time) UI (+5 more)

### Community 26 - "Gender-Separated Booking Implementation Plan"
Cohesion: 0.14
Nodes (13): File Map, Gender-Separated Booking Implementation Plan, Global Constraints, Self-Review Checklist, Task 1: Schema Migration — Add Gender Enum and Columns, Task 2: Seed — 14 WorkingHours Rows and Booking Backfill, Task 3: Types — Add Gender to WizardState and BookingCreateInput, Task 4: Slots Library — Add Gender Param (+5 more)

### Community 27 - "utils.ts"
Cohesion: 0.21
Nodes (7): Button(), buttonVariants, Calendar(), CalendarDayButton(), Input(), Separator(), Skeleton()

### Community 28 - "shadcn/ui Migration Implementation Plan"
Cohesion: 0.15
Nodes (12): File Map, shadcn/ui Migration Implementation Plan, Task 10: Final Verification, Task 1: Run shadcn init, Task 2: Merge CSS Variables, Task 3: Update ThemeToggle to Manage `.dark` Class, Task 4: Install shadcn Button and Create Gold/Ghost Variants, Task 5: Install shadcn Card and Update GlassCard (+4 more)

### Community 29 - "Room Tiers & Add-ons Implementation Plan"
Cohesion: 0.15
Nodes (12): File Map, Room Tiers & Add-ons Implementation Plan, Self-Review, Task 1: Schema — add fields and models, Task 2: Seed — populate tiers, مشاوره, and add-ons, Task 3: Types — extend DTOs, Task 4: API — GET /api/addons, Task 5: API — update POST /api/bookings/create (+4 more)

### Community 30 - "DiscountManager.tsx"
Cohesion: 0.24
Nodes (5): dynamic, DiscountManager(), GhostButton(), Props, DiscountCodeDTO

### Community 31 - "sheet.tsx"
Cohesion: 0.18
Nodes (7): Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetTitle()

### Community 32 - "(panel)/layout.tsx"
Cohesion: 0.22
Nodes (5): AdminSidebar(), PageTransition(), SidebarInset(), SidebarProvider(), useIsMobile()

### Community 33 - "Step1Service"
Cohesion: 0.32
Nodes (7): emptyPerson(), Step1Service(), addPerson(), selectService(), setPerson(), toggleAddon(), updatePerson()

### Community 34 - "Step2DateTime.tsx"
Cohesion: 0.39
Nodes (7): getDates(), iranianDayOfWeek(), JS_TO_IR, Props, Step2DateTime(), toFaNum(), toFaTime()

### Community 35 - "Step3Details.tsx"
Cohesion: 0.39
Nodes (7): isValidIranPhone(), Props, Step3Details(), handlePhoneChange(), setPerson(), toEnDigits(), toFaOrdinal()

### Community 36 - "progress.tsx"
Cohesion: 0.29
Nodes (6): StepProgress(), Progress(), ProgressIndicator(), ProgressLabel(), ProgressTrack(), ProgressValue()

### Community 37 - "dependencies"
Cohesion: 0.29
Nodes (7): date-fns, framer-motion, next, dependencies, date-fns, framer-motion, next

### Community 38 - "app/layout.tsx"
Cohesion: 0.33
Nodes (4): metadata, vazir, viewport, Toaster()

### Community 39 - "StepGender.tsx"
Cohesion: 0.33
Nodes (5): GenderWindows, Props, StepGender(), toFaTime(), Gender

### Community 40 - "tooltip.tsx"
Cohesion: 0.40
Nodes (3): Tooltip(), TooltipContent(), TooltipTrigger()

## Knowledge Gaps
- **415 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+410 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `(panel)/layout.tsx`, `ScheduleManager.tsx`, `app/page.tsx`, `progress.tsx`, `BookingDetailDialog.tsx`, `tooltip.tsx`, `sidebar.tsx`, `GlassCard.tsx`, `utils.ts`, `DiscountManager.tsx`, `sheet.tsx`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Why does `prisma` connect `prisma.ts` to `ScheduleManager.tsx`, `app/page.tsx`, `OtpLoginForm.tsx`, `AmbientBackground.tsx`, `BookingDetailDialog.tsx`, `GlassCard.tsx`, `DiscountManager.tsx`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `GlassCard()` connect `GlassCard.tsx` to `prisma.ts`, `ScheduleManager.tsx`, `app/page.tsx`, `OtpLoginForm.tsx`, `AmbientBackground.tsx`, `cn`, `index.ts`, `DiscountManager.tsx`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _415 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `prisma.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.052464947987336044 - nodes in this community are weakly interconnected._
- **Should `ScheduleManager.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0753045404208195 - nodes in this community are weakly interconnected._
- **Should `app/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07665505226480836 - nodes in this community are weakly interconnected._