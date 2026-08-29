# Task 3 Report: Deployment Variables and Coolify Runbook

## Status

**DONE**

## Commit

`714b796 docs: document Nakhlespa Coolify deployment`

## Changes

- Added `.env.example` with safe placeholders for the Compose interpolation variables and application variables, including local `DATABASE_URL`, `REDIS_URL`, and `SMSIR_TEMPLATE_OTP`.
- Removed the obsolete VPS/PM2/Nginx/ArvanCloud deployment instructions from `README.md`.
- Added a Coolify production runbook covering installation, one Compose resource, Traefik-only public routing, private PostgreSQL/Redis/worker services, environment configuration, first deployment, Prisma migration and seed, SMS templates, verification before webhooks, maintenance, and SSH-tunneled database access.
- Preserved the local setup and application route documentation.
- Added `tests/deployment-docs.test.ts` as the documentation contract test.
- Removed a previously exposed SMS.ir API key from the tracked example configuration.

## Verification

- Red phase: `bun test tests/deployment-docs.test.ts` — 1 pass, 1 expected failure because the Coolify runbook was absent.
- Green phase: `bun test tests/deployment-docs.test.ts` — 2 pass, 0 fail, 12 assertions.
- Final checks: `git diff --cached --check` passed; only `.env.example`, `README.md`, and `tests/deployment-docs.test.ts` were staged and committed.

## Concerns

- No implementation concerns. The SSH tunnel example assumes PostgreSQL is reachable on the Coolify host; the runbook directs operators to use Coolify's terminal/private-network access when it is not.
- Unrelated pre-existing untracked files were left untouched.

## Corrective Report: Task 3 Review Findings

### Scope

Reviewed commit `714b796` and corrected the three findings requested together:

- Added `ZARINPAL_SANDBOX: ${ZARINPAL_SANDBOX}` to the production `web` environment and documented `ZARINPAL_SANDBOX=false` as the normal production value.
- Reworked the Coolify environment instructions to list only Compose interpolation/application variables. The runbook explicitly tells operators not to add the localhost `DATABASE_URL` or `REDIS_URL` values from `.env.example`; Compose constructs the internal `postgresql://...@postgres:5432/...` and `redis://redis:6379` values.
- Removed the stale `podman ps` useful command from the local commands list.
- Added focused documentation-contract assertions for the production sandbox setting and Coolify URL guidance.

Local setup, routes, and unrelated application files were left unchanged.

### Verification commands and output

```text
$ bun test tests/deployment-docs.test.ts
bun test v1.4.0 (34cbb9a40)

tests/deployment-docs.test.ts:
(pass) deployment documentation contract > documents required production variables [0.12ms]
(pass) deployment documentation contract > documents Coolify Compose deployment and initialization [0.06ms]
(pass) deployment documentation contract > documents safe production Zarinpal mode and Coolify URL handling [0.06ms]

 3 pass
 0 fail
 17 expect() calls
Ran 3 tests across 1 file. [9.00ms]
```

```text
$ bun test tests/production-compose.test.ts
bun test v1.4.0 (34cbb9a40)

tests/production-compose.test.ts:
(pass) production Compose contract > defines the four required services [0.05ms]
(pass) production Compose contract > publishes only the web service [0.11ms]
(pass) production Compose contract > uses private service DNS and persistent volumes [0.01ms]

 3 pass
 0 fail
 12 expect() calls
Ran 3 tests across 1 file. [10.00ms]
```

```text
$ docker compose --env-file .env.example -f compose.production.yml config --quiet
(no output; exit 0)

$ git diff --check
(no output; exit 0)
```

### Corrective concerns

No known corrective concerns. Existing unrelated untracked files remain untouched.
