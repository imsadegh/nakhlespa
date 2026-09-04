import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'bun:test'

const compose = readFileSync('compose.production.yml', 'utf8')
const dockerfile = readFileSync('Dockerfile', 'utf8')
const envExample = readFileSync('.env.example', 'utf8')
const legacyOrm = ['pris', 'ma'].join('')

describe('production Compose contract', () => {
  test('defines the four required services', () => {
    for (const service of ['web:', 'postgres:', 'redis:', 'worker-sms:']) {
      expect(compose).toContain(service)
    }
  })

  test('publishes only the web service', () => {
    expect(compose).toContain('expose:\n      - "3000"')
    expect(compose).not.toMatch(/postgres:[\s\S]*?ports:/)
    expect(compose).not.toMatch(/redis:[\s\S]*?ports:/)
    expect(compose).not.toMatch(/worker-sms:[\s\S]*?ports:/)
  })

  test('uses private service DNS and persistent volumes', () => {
    expect(compose).toContain('@postgres:5432')
    expect(compose).toContain('redis://redis:6379')
    expect(compose).toContain('postgres_data:')
    expect(compose).toContain('redis_data:')
  })

  test('waits for healthy PostgreSQL and Redis services', () => {
    expect(compose).toContain('test: ["CMD", "redis-cli", "ping"]')
    expect(compose).toMatch(/web:[\s\S]*?redis:\n        condition: service_healthy/)
    expect(compose).toMatch(/worker-sms:[\s\S]*?redis:\n        condition: service_healthy/)
  })

  test('keeps the worker command and required runtime environment explicit', () => {
    expect(compose).toContain('command: ["bun", "run", "worker:sms"]')
    expect(compose).toMatch(/worker-sms:[\s\S]*?REDIS_URL: redis:\/\/redis:6379/)
    expect(compose).toMatch(/worker-sms:[\s\S]*?SMSIR_API_KEY: \$\{SMSIR_API_KEY\}/)
  })

  test('gates web startup on production migrations', () => {
    expect(compose).toContain('command: ["sh", "-c", "bun run db:migrate && exec bun run start"]')
  })

  test('marks the DB-backed schedule page for runtime rendering', () => {
    const schedulePage = readFileSync('src/app/admin/(panel)/schedule/page.tsx', 'utf8')
    expect(schedulePage).toContain("export const dynamic = 'force-dynamic'")
  })

  test('marks the DB-backed dashboard page for runtime rendering', () => {
    const dashboardPage = readFileSync('src/app/admin/(panel)/dashboard/page.tsx', 'utf8')
    expect(dashboardPage).toContain("export const dynamic = 'force-dynamic'")
  })

  test('marks the public DB-backed pages for runtime rendering', () => {
    const homePage = readFileSync('src/app/page.tsx', 'utf8')
    const bookPage = readFileSync('src/app/book/page.tsx', 'utf8')

    expect(homePage).toContain("export const dynamic = 'force-dynamic'")
    expect(bookPage).toContain("export const dynamic = 'force-dynamic'")
  })

  test('includes Drizzle migration assets without Prisma build steps', () => {
    expect(dockerfile).not.toContain(legacyOrm)
    expect(dockerfile).toContain('COPY --from=builder /app/drizzle ./drizzle')
    expect(dockerfile).toContain('COPY --from=builder /app/src/db ./src/db')
    expect(dockerfile).toContain('COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts')
    expect(dockerfile).not.toContain(`bunx ${legacyOrm} generate`)
  })

  test('ships Drizzle Kit for runtime migrations', () => {
    expect(dockerfile).toContain('RUN bun install --frozen-lockfile')
    expect(dockerfile).not.toContain('--production')
  })

  test('does not ship a predictable admin password in the example environment', () => {
    expect(envExample).not.toContain('ADMIN_PASSWORD=DevPassword123')
    expect(envExample).toMatch(/^ADMIN_PASSWORD=replace-with-/m)
  })
})
