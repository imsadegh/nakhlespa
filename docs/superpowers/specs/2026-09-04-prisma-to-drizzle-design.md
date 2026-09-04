# Prisma to Drizzle Migration Design

**Date:** 2026-09-04

## Goal

Replace Prisma completely with Drizzle ORM while preserving the existing PostgreSQL schema, data, booking behavior, Better Auth behavior, seed data, and deployment workflow.

## Scope

This is a full database-layer migration. It includes application queries, transactions, generated enum/type usage, Better Auth storage, seed scripts, migration tooling, Docker/Compose commands, documentation, tests, and package dependencies. The migration does not change product behavior or replace Better Auth, BullMQ, Redis, SMS.ir, Zarinpal, or PostgreSQL.

## Architecture

Drizzle schema definitions will live in `src/db/schema.ts`. They will represent every existing application and Better Auth table, including PostgreSQL enums, relations, indexes, defaults, nullable fields, and explicit existing table names. A shared Drizzle client will live in `src/lib/db.ts` and will use the existing `DATABASE_URL` with the current `pg` pool approach.

Drizzle Kit will use `drizzle.config.ts` and a new `drizzle/` migration directory. Existing database tables and data are authoritative: the migration must not drop or recreate them. The migration history must be carried forward or represented in a way that allows deployment against the current database without destructive reset operations.

## Query and transaction migration

All Prisma calls will be rewritten using Drizzle:

- `findUnique` and `findFirst` become typed `select` queries with equivalent predicates and limits.
- `findMany` becomes typed `select` queries with equivalent filters, ordering, joins, and projections.
- `create`, `update`, `updateMany`, `delete`, `deleteMany`, and `count` become Drizzle insert, update, delete, and SQL count operations.
- Prisma transactions become `db.transaction(...)` or equivalent Drizzle transaction usage.
- Prisma-generated enums and model types become shared Drizzle enum constants and inferred TypeScript types.

Existing callers must retain their current return shapes and externally observable behavior. Booking creation, payment verification, discount usage, schedule/slot calculation, SMS reminders, admin operations, customer sessions, and seed upserts are all included.

## Authentication

Better Auth remains the authentication system and its public application API remains unchanged. `prismaAdapter` will be replaced with `drizzleAdapter`, configured with the shared Drizzle client and PostgreSQL provider. The existing `user`, `session`, `account`, and `verification` tables will be preserved and used by the adapter. Customer OTP sessions remain in the existing `customer_sessions` table.

## Seed and deployment

`prisma/seed.ts` will be replaced by `src/db/seed.ts` or an equivalent Drizzle-owned seed entry point, preserving all current service, working-hours, add-on, discount, booking, and admin setup behavior. Package scripts will expose explicit Drizzle migration and seed commands.

Docker and Compose startup commands will run Drizzle migrations before starting the web service. README and CLAUDE.md will document the new local and production commands and remove Prisma-specific instructions. Prisma packages, Prisma configuration, Prisma schema/migrations, and runtime Prisma imports will be removed after the application is fully converted.

## Verification and acceptance criteria

The migration is accepted when:

1. No runtime or build-time source file imports Prisma, and no deployment script invokes Prisma.
2. Drizzle schema definitions cover every table and enum currently represented by Prisma, including Better Auth tables.
3. Existing PostgreSQL data remains usable without destructive reset or table recreation.
4. Better Auth login/session behavior and customer OTP sessions retain their existing semantics.
5. Booking, payment, discount, scheduling, reminder, admin, and seed workflows retain their current behavior.
6. Typechecking completes successfully.
7. The existing test suite completes successfully, with Prisma-specific assertions updated to Drizzle behavior.
8. The production build completes successfully.
9. Documentation and deployment configuration consistently describe Drizzle.

## Out of scope

No product feature changes, database redesign, provider change, authentication redesign, UI redesign, or unrelated refactoring is included.
