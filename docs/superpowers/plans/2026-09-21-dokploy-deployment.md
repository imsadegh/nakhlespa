# Dokploy Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure Nakhlespa for GitHub Actions image publishing and Dokploy-managed production Compose deployment.

**Architecture:** GitHub Actions will build and publish `ghcr.io/imsadegh/nakhlespa` after the available project build succeeds. Dokploy will run one Compose resource using that image for the web and SMS worker services, with PostgreSQL and Redis on private named volumes; the workflow will trigger Dokploy’s Compose deployment API after the image is available.

**Tech Stack:** GitHub Actions, Docker Buildx, GHCR, Dokploy Docker Compose, Next.js 16, Bun, Drizzle, PostgreSQL, Redis.

**Spec:** `docs/superpowers/specs/2026-09-21-dokploy-deployment-design.md`

## Global Constraints

- Keep application behavior unchanged.
- Do not touch the separate Bonyad checkout.
- Do not commit production secrets or a production `.env` file.
- Use `postgres` and `redis` as production service hostnames; never `localhost` between containers.
- Keep PostgreSQL and Redis private; expose only the web service through Dokploy.
- Use the existing `bun.lock` and Bun `1.4.0` image/toolchain.
- Do not add a second reverse proxy, PM2, or a second production Compose stack.

### Task 1: Make the production image Compose-compatible

**Files:**
- Modify: `compose.production.yml`

**Interfaces:**
- Consumes: Dokploy environment variables and the GHCR image tag published by the CI workflow.
- Produces: A single production Compose stack with `web`, `postgres`, `redis`, and `worker-sms` services.

- [x] **Step 1: Replace the build-only app image reference**

Change `web` and `worker-sms` to use `${NAKHLESPA_IMAGE:-nakhlespa-app:production}` and remove the production `build` block so Dokploy pulls the CI-published image.

- [x] **Step 2: Preserve startup and service isolation**

Keep the web migration command, health-gated dependencies, restart policies, named volumes, internal service URLs, and port exposure. Ensure every service has `restart: unless-stopped` and no database/Redis `ports` mapping.

- [x] **Step 3: Render the Compose file with representative values**

Run:

```bash
docker compose --env-file /tmp/nakhlespa-dokploy.env -f compose.production.yml config
```

Expected: the command succeeds and the rendered services use `ghcr.io/imsadegh/nakhlespa:latest`, `postgres:5432`, and `redis:6379`.

### Task 2: Add the GitHub Actions Dokploy pipeline

**Files:**
- Create: `.github/workflows/build-and-deploy.yml`

**Interfaces:**
- Consumes: GitHub `GITHUB_TOKEN`, repository contents, and `DOKPLOY_URL`, `DOKPLOY_API_KEY`, `DOKPLOY_COMPOSE_ID` secrets.
- Produces: GHCR tags `latest` and `${{ github.sha }}` plus a Dokploy Compose deployment request.

- [x] **Step 1: Add the validation job**

Check out the repository, install Bun `1.4.0`, install dependencies with `bun install --frozen-lockfile`, and run `bun run build`, the project’s available validation script.

- [x] **Step 2: Add the image build job**

Make the image job depend on validation, grant `contents: read` and `packages: write`, log into GHCR with `docker/login-action@v3`, and build/push `linux/amd64` tags:

```text
ghcr.io/imsadegh/nakhlespa:latest
ghcr.io/imsadegh/nakhlespa:${{ github.sha }}
```

Use Buildx cache metadata as in the Bonyad workflow.

- [x] **Step 3: Trigger Dokploy after the image push**

Call Dokploy’s Compose deployment endpoint with `POST`, JSON `{ "composeId": "..." }`, and the `x-api-key` header. Construct the endpoint from `DOKPLOY_URL` and trim a trailing slash so both `https://dokploy.example.com` and a URL ending in `/` work. Fail on non-2xx responses.

- [x] **Step 4: Add push/manual triggers and concurrency**

Run on pushes to `master` and `workflow_dispatch`, with one cancellable `production-deployment` concurrency group. Do not add a second automatic Dokploy Git deployment trigger in the documentation.

### Task 3: Replace Coolify deployment documentation with Dokploy guidance

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: The Compose variables and GitHub/Dokploy secrets from Tasks 1–2.
- Produces: A complete operator runbook for setup, deployment, initialization, verification, maintenance, backup, and rollback.

- [x] **Step 1: Rename the production platform sections**

Replace Coolify-specific instructions with Dokploy installation and Docker Compose resource instructions. Keep local setup and SMS template content intact, updating platform references where they describe production configuration.

- [x] **Step 2: Document the Dokploy Compose resource**

Explain selecting the repository/branch, setting Compose path to `compose.production.yml`, setting `NAKHLESPA_IMAGE=ghcr.io/imsadegh/nakhlespa:latest`, configuring the web domain on port 3000, and keeping Postgres/Redis/worker private.

- [x] **Step 3: Document variables and secrets**

List the Dokploy variables required by Compose and the GitHub secrets `DOKPLOY_URL`, `DOKPLOY_API_KEY`, and `DOKPLOY_COMPOSE_ID`. Explain GHCR package visibility or Dokploy registry credentials without including real credentials.

- [x] **Step 4: Document the operational lifecycle**

Document first deploy and one-time seed, migration behavior, health checks, release flow, manual redeploy/rollback, volume backups, and troubleshooting for service names and database password changes. State that deployment auto-triggering must be configured in one place only.

### Task 4: Verify the deployment change

**Files:**
- Review: `compose.production.yml`, `.github/workflows/build-and-deploy.yml`, `Dockerfile`, `README.md`
- Update: `tests/deployment-docs.test.ts`

- [x] **Step 1: Check workflow syntax and references**

Parse the workflow YAML with an available YAML parser or Ruby/Python standard-library fallback, and confirm the trigger, job dependency, image tags, and Dokploy secret names.

- [x] **Step 2: Build and run project checks**

Run `bun run build` and, if Docker is available, `docker build --platform linux/amd64 -f Dockerfile -t nakhlespa-app:verification .`.

Verification result: `bun run build` passed. Docker build could not pull `oven/bun:1.4.0` because the local Docker registry connection presented an invalid intercepted TLS certificate; no Dockerfile error was reached.

- [x] **Step 3: Review the final diff**

Confirm only deployment-related files plus the approved plan/spec are changed in this worktree, and confirm no secret values are present.

- [x] **Step 4: Commit the implementation**

```bash
git add compose.production.yml .github/workflows/build-and-deploy.yml README.md docs/superpowers/specs/2026-09-21-dokploy-deployment-design.md docs/superpowers/plans/2026-09-21-dokploy-deployment.md
git commit -m "feat: configure Dokploy deployment" -m "- Publish the production image through GitHub Actions\n- Run the Compose stack from Dokploy with persistent services\n- Document the Dokploy production runbook"
```
