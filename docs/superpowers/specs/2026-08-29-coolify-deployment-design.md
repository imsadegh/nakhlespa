# Nakhlespa Coolify Deployment Design

## Goal

Deploy Nakhlespa to the same Coolify-managed Ubuntu VPS pattern used for Bonyad: a single Docker Compose resource with one public Next.js service and private infrastructure services. The deployment must support Prisma migrations, seed data, Better Auth, Zarinpal callbacks, SMS.ir notifications, and BullMQ reminder jobs.

## Scope

The change covers production containerization and Coolify documentation. It includes:

- a production Dockerfile and Docker build context exclusions;
- a production Compose file for the web app, PostgreSQL, Redis, and SMS worker;
- a standalone SMS worker entrypoint;
- production-safe worker lifecycle behavior in Next.js;
- an environment variable example and Coolify deployment instructions;
- verification of the production build and container configuration.

It does not change booking behavior, payment behavior, database schema, SMS templates, or application UI. MinIO and PgBouncer are excluded because the current application does not use object storage and has no demonstrated need for a connection pooler.

## Architecture

```text
Visitor → Coolify-managed Traefik → web:3000
                                      ├─ PostgreSQL:5432
                                      └─ Redis:6379 ← worker-sms
```

The Compose resource contains four services:

- `web`: builds and serves the Next.js production application on port 3000. Only this service receives the Coolify public domain.
- `postgres`: PostgreSQL 17 with a persistent named volume and healthcheck. It has no public port mapping.
- `redis`: Redis 7 with a persistent named volume. It has no public port mapping.
- `worker-sms`: runs the BullMQ SMS reminder worker from the same built application image. It has no public port mapping.

Coolify supplies the private network and Traefik routing. The Compose file must not add a custom network or a second reverse proxy. Internal application URLs use service names (`postgres` and `redis`), never `localhost`.

## Worker lifecycle

The worker is moved from implicit Next.js instrumentation into an explicit `src/workers/sms.worker.ts` entrypoint. The entrypoint starts the existing worker and closes it on SIGTERM/SIGINT so Coolify can stop and redeploy it cleanly.

`instrumentation.ts` must not start a second worker in production. The web service remains responsible only for HTTP requests; the `worker-sms` service is the sole production BullMQ consumer. Development may retain the current instrumentation behavior for a simple local workflow, or use an explicit worker command if needed, but production behavior must be deterministic.

## Environment contract

Coolify injects the following values; production secrets are never committed. `DB_USER`, `DB_PASSWORD`, and `DB_NAME` are the Compose interpolation inputs. The Compose file constructs the container-local `DATABASE_URL` and `REDIS_URL` values from those inputs and the service names; operators do not need to inject separate localhost-based URLs.

- `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `BETTER_AUTH_SECRET`
- `ZARINPAL_MERCHANT_ID`
- `ZARINPAL_CALLBACK_URL`
- `SMSIR_API_KEY`
- `SMSIR_TEMPLATE_CONFIRM`
- `SMSIR_TEMPLATE_ADMIN`
- `SMSIR_TEMPLATE_REMINDER_24H`
- `SMSIR_TEMPLATE_REMINDER_2H`
- `SMSIR_TEMPLATE_OTP`
- `NEXT_PUBLIC_SITE_URL`
- `ADMIN_PHONE`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`

The example file documents local values and the production variable names. Database passwords should be URL-safe because they are embedded in a connection string. The application listens on `0.0.0.0:3000`.

## First deployment

1. Create a Coolify Docker Compose resource from the repository and select the production Compose file.
2. Configure the public HTTPS domain on `web` only.
3. Add all required environment variables and secrets in Coolify.
4. Deploy and wait for PostgreSQL health plus web and worker startup.
5. Run `bunx prisma migrate deploy` from the running web container.
6. Run the idempotent seed with the production admin credentials.
7. Verify the public site, Zarinpal callback route, admin login, customer OTP, booking creation, and delayed SMS job processing.

PostgreSQL and Redis must remain private. Database administration uses an SSH tunnel or an approved private access path; their ports must not be published publicly.

## Local development

The existing local `compose.yaml` remains the source of truth for host-mapped PostgreSQL and Redis. The new production Compose file must not replace or break the local ports documented by the project README.

## Verification

Before claiming completion:

- run the project’s available type/build checks;
- confirm the production Dockerfile builds the image and includes the standalone worker entrypoint;
- validate Compose interpolation and service commands;
- inspect the final diff for accidental secrets, public infrastructure ports, duplicate worker startup, or unrelated application changes.
