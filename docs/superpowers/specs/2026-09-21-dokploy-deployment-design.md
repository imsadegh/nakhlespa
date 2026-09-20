# Dokploy Deployment Design

**Date:** 2026-09-21  
**Project:** Nakhlespa  
**Status:** Approved in chat; implementation pending

## Goal

Deploy Nakhlespa to a single Dokploy-managed VPS using the same operational model as Bonyad: GitHub Actions validates the repository, builds and publishes an immutable production image to GHCR, and triggers Dokploy to deploy one production Docker Compose stack.

## Scope

In scope:

- GitHub Actions validation, image build/publish, and Dokploy deployment trigger.
- Production Compose configuration for the Next.js web service, SMS worker, PostgreSQL, and Redis.
- Dokploy environment variables, domain/proxy configuration, first deployment, migrations, backups, rollback, and troubleshooting documentation.
- Local static validation of Compose interpolation, Dockerfile/build configuration, and workflow syntax.

Out of scope:

- Application features or runtime behavior unrelated to deployment.
- Changes to the separate Bonyad project.
- Provisioning or mutating the VPS, Dokploy instance, DNS provider, or GitHub repository secrets from this workspace.

## Architecture

The production topology is:

```text
Visitor → DNS/CDN → Dokploy proxy → web:3000
                                  ├─ PostgreSQL
                                  ├─ Redis
                                  └─ worker-sms

Git push → GitHub Actions → GHCR image → Dokploy deploy API/webhook → Compose redeploy
```

Dokploy will manage a single Docker Compose resource sourced from `compose.production.yml`. The Compose file will reference the GHCR image through `NAKHLESPA_IMAGE`, with a local-image fallback for manual/local use. The web and worker services share the same image; PostgreSQL and Redis retain named persistent volumes.

Dokploy’s Compose environment editor will hold production variables. The Compose file will explicitly pass only the variables each service needs, because Dokploy’s environment values are written to `.env` but are not automatically injected into containers unless referenced by Compose.

## CI/CD

Create `.github/workflows/build-and-deploy.yml` with two jobs:

1. `validate`: install the pinned Bun version from the project’s lockfile and run the project’s available checks.
2. `build-and-deploy`: build `Dockerfile` for `linux/amd64`, publish both `ghcr.io/<owner>/nakhlespa:latest` and the commit SHA tag, then call Dokploy’s authenticated deployment API using `DOKPLOY_URL`, `DOKPLOY_API_KEY`, and `DOKPLOY_COMPOSE_ID` GitHub secrets.

The workflow runs on pushes to `master` and on manual dispatch. The deployment job must depend on validation, and the API call must fail the workflow on non-2xx responses. Dokploy auto-deploy from the Git provider should be disabled when the workflow is the deployment trigger, preventing duplicate deployments.

## Production Compose

Change `compose.production.yml` so that:

- `web` uses `${NAKHLESPA_IMAGE:-nakhlespa-app:production}` and exposes port 3000 without publishing it directly.
- `web` runs migrations before starting the Next.js server, preserving the existing startup behavior.
- `worker-sms` uses the same image and receives only database, Redis, SMS, and runtime variables it needs.
- PostgreSQL and Redis remain internal services with health checks and named volumes.
- Container-to-container URLs use `postgres` and `redis`, never `localhost`.
- No production service publishes database or Redis ports to the public host.
- Every production service has `restart: unless-stopped`.

## Documentation

Update `README.md` with a Dokploy-specific production section covering:

- GHCR package visibility/authentication and the required GitHub secrets.
- Creating a Dokploy Docker Compose resource from the repository and selecting `compose.production.yml`.
- Setting `NAKHLESPA_IMAGE`, application secrets, database variables, and public URLs in Dokploy.
- Connecting the Dokploy domain to `web` port 3000 and using Dokploy’s managed HTTPS proxy.
- First deployment, migration/seed behavior, worker verification, backups, rollback, and common service-name/password issues.
- The normal release flow and the distinction between GitHub Actions validation/image publishing and Dokploy deployment.

The documentation must never include actual production secrets or recommend committing a production `.env` file.

## Verification

Before considering the change complete:

- Parse the workflow YAML and verify the expected triggers, job dependency, image tags, and Dokploy secrets.
- Render the production Compose configuration with representative non-secret values and confirm all variables resolve.
- Build the production Docker image if the local environment supports it.
- Run the project’s available typecheck/lint/build checks without changing application code.
- Review the final diff to ensure only deployment-related files and the approved design/plan documentation changed.

## Operational references

- Dokploy Docker Compose: https://docs.dokploy.com/docs/core/docker-compose
- Dokploy auto deploy/API: https://docs.dokploy.com/docs/core/auto-deploy
- Next.js standalone/Docker deployment guidance is available in `node_modules/next/dist/docs/` for this installed Next.js version.

