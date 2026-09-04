# Single `.env` Workflow Design

## Goal

Align Nakhlespa with Bonyad’s environment workflow by using one root `.env` file for local Next.js runtime configuration, Prisma CLI commands, and local Docker Compose interpolation.

## Design

The existing `.env.example` remains the template and is copied once:

```bash
cp .env.example .env
```

The README will no longer instruct developers to create `.env.local` or a second Prisma-specific `.env`. Next.js and Prisma will read the root `.env`, while local Compose continues to use it through `--env-file .env`. The production Coolify resource remains separate: Coolify injects production secrets and Compose derives container-local `DATABASE_URL` and `REDIS_URL` from service names.

## Scope

- Modify `README.md` to document one root `.env` setup.
- Add a documentation contract test proving `.env.local` is not required and the root `.env` workflow is documented.
- Do not rename environment variables, change Compose behavior, alter application code, or commit secrets.

## Verification

Run the focused documentation test, the full test suite, Compose configuration validation, and a whitespace diff check.
