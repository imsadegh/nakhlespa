# Task 2 Report: Add production image and Compose resource

## Status

Complete. Task 2 was implemented and committed.

- Commit: 47b7f75 feat: add Coolify production Compose stack
- Task 1 commit preserved: 655bb2c
- Scope preserved: unrelated existing untracked files were not staged or modified.

## Changed files

- .dockerignore — excludes dependency/build, VCS, environment, graphify, and coverage files.
- Dockerfile — multi-stage oven/bun:1.4.0 production image; installs frozen dependencies, builds Next.js, installs production dependencies, copies .next, public, src, prisma, package.json, bun.lock, and tsconfig.json, runs as bun, exposes 3000, and starts with bun run start.
- compose.production.yml — defines web, postgres, redis, and worker-sms; only web exposes port 3000; service DNS, health dependency, and persistent volumes are configured per brief.
- package.json — adds worker:sms script. prisma was already present in dependencies, so it remains available in the production image for migrations.
- tests/production-compose.test.ts — static Compose contract tests.

The lockfile update command was run; bun install --lockfile-only reported no changes.

## Tests and commands

### TDD RED

Command: bun test tests/production-compose.test.ts

Output: failed as expected because compose.production.yml did not exist:

    ENOENT: no such file or directory, open 'compose.production.yml'
    0 pass
    1 fail
    1 error

### TDD GREEN

Command: bun test tests/production-compose.test.ts

Output:

    3 pass
    0 fail
    12 expect() calls

### Focused and regression tests

    bun test tests/sms-worker-entrypoint.test.ts
    2 pass
    0 fail

    bun test
    11 pass
    0 fail
    17 expect() calls

### Compose validation

    docker compose --env-file .env.example -f compose.production.yml config

Exit code: 0; rendered configuration contained all four services and both named volumes.

Post-commit quiet validation:

    docker compose --env-file .env.example -f compose.production.yml config --quiet

Exit code: 0. Docker emitted a warning that SMSIR_TEMPLATE_OTP is unset in .env.example and defaulted it to an empty string.

### Other validation

    git diff --check

Exit code: 0.

    bun install --lockfile-only

Output: Done! Checked 556 packages (no changes).

    bun run build

Next.js compilation and TypeScript compilation completed successfully, then the build failed during prerendering because local services were unavailable:

    Error: connect ECONNREFUSED 127.0.0.1:6380
    Can't reach database server at 127.0.0.1:5434
    Error occurred prerendering page "/admin/dashboard"

    bunx tsc --noEmit

Failed because the repository does not provide Bun test type declarations:

    Cannot find module 'bun:test' or its corresponding type declarations.

## TDD evidence

The production Compose contract test was created first and run before any Dockerfile, Compose file, or package implementation existed. It failed with the expected missing-file error. The minimal implementation was then added, and the same test passed with all three assertions green. The full test suite and Task 1 worker regression test also pass.

## Concerns

1. A full Next.js production build could not finish in this workspace because the locally configured Postgres and Redis endpoints were not running. Compilation itself succeeded; deployment should run the build/migration flow in the Coolify environment with the configured services.
2. bunx tsc --noEmit is not clean because the existing test setup lacks Bun test typings. This is unrelated to the Task 2 deployment files; bun test passes all 11 tests.
3. Compose validation uses .env.example, so its placeholder/missing SMSIR_TEMPLATE_OTP value produces a warning. Production values must be supplied through Coolify environment variables.

## Corrective Review Report

The reviewed commit was rechecked for the required lockfile consistency after package edits.

Command: `bun install --lockfile-only`

Output:

    bun install v1.4.0 (34cbb9a40)
    Done! Checked 556 packages (no changes) [4.00ms]

Exit code: 0. `git diff` remained empty after the command, confirming that `bun.lock` is already consistent and does not require a change for Task 2. The unrelated `SMSIR_TEMPLATE_OTP` note remains deferred to Task 3.

Focused review test:

Command: `bun test tests/production-compose.test.ts`

Output:

    bun test v1.4.0 (34cbb9a40)
    tests/production-compose.test.ts:
    (pass) production Compose contract > defines the four required services [0.03ms]
    (pass) production Compose contract > publishes only the web service [0.09ms]
    (pass) production Compose contract > uses private service DNS and persistent volumes [0.01ms]

      3 pass
      0 fail
      12 expect() calls
    Ran 3 tests across 1 file. [8.00ms]

Exit code: 0.
