# Single `.env` Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make local Nakhlespa setup use one root `.env` file for Next.js, Prisma, and local Compose.

**Architecture:** Keep `.env.example` as the template and update the README to copy it once to `.env`. Do not change production Coolify injection or Compose-derived container URLs.

**Tech Stack:** Next.js 16, Prisma 7, Bun, Docker Compose, Bun test.

## Global Constraints

- Use one root `.env` for local Next.js runtime configuration, Prisma CLI commands, and local Docker Compose interpolation.
- Do not require `.env.local` or a second Prisma-specific `.env` file.
- Keep production Coolify environment injection separate and unchanged.
- Do not rename variables, change Compose behavior, alter application code, or commit secrets.

---

### Task 1: Document and test the single `.env` workflow

**Files:**
- Modify: `README.md`
- Modify: `tests/deployment-docs.test.ts`

**Interfaces:**
- Consumes: existing `.env.example`, `compose.yaml`, `prisma.config.ts`, and Coolify production documentation.
- Produces: one-command local setup using `.env`, with local and production environment responsibilities clearly separated.

- [ ] **Step 1: Write the failing test**

Add assertions to `tests/deployment-docs.test.ts`:

```ts
test('documents one root env file for local setup', () => {
  const readme = readFileSync('README.md', 'utf8')
  expect(readme).toContain('cp .env.example .env')
  expect(readme).toContain('Next.js and Prisma read the same root `.env` file')
  expect(readme).not.toContain('Create `.env.local`')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test tests/deployment-docs.test.ts`

Expected: FAIL because the README currently documents separate `.env.local` and Prisma `.env` files.

- [ ] **Step 3: Update the README**

Replace the local environment section with one root-file workflow:

```markdown
### 3. Configure environment

Create one root `.env` file from the example:

```bash
cp .env.example .env
```

Next.js and Prisma read the same root `.env` file. The local Compose file also reads it through `--env-file .env`; keep `DATABASE_URL` on port `5434` and `REDIS_URL` on port `6380`.
```

Remove the duplicate `.env.local` and second `.env` instructions, while retaining the existing migration/seed commands and Coolify production instructions. Clarify that Coolify injects production values separately and Compose derives `postgres:5432` and `redis:6379` internally.

- [ ] **Step 4: Run tests to verify the change**

Run: `bun test tests/deployment-docs.test.ts`

Expected: all documentation tests pass.

- [ ] **Step 5: Run final checks**

Run: `bun test && docker compose --env-file .env.example -f compose.production.yml config --quiet && git diff --check`

Expected: tests pass, Compose renders successfully, and diff check has no output.

- [ ] **Step 6: Commit**

```bash
git add README.md tests/deployment-docs.test.ts
git commit -m "docs: use one root env file locally"
```
