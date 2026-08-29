import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'bun:test'

const compose = readFileSync('compose.production.yml', 'utf8')
const dockerfile = readFileSync('Dockerfile', 'utf8')
const envExample = readFileSync('.env.example', 'utf8')

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

  test('generates Prisma after config and schema are available in the image', () => {
    const generateIndex = dockerfile.indexOf('RUN bunx prisma generate')
    const buildIndex = dockerfile.indexOf('RUN bun run build')

    expect(dockerfile).toContain('COPY --from=builder /app/prisma.config.ts ./prisma.config.ts')
    expect(generateIndex).toBeGreaterThan(dockerfile.indexOf('COPY . .'))
    expect(buildIndex).toBeGreaterThan(generateIndex)
  })

  test('does not ship a predictable admin password in the example environment', () => {
    expect(envExample).not.toContain('ADMIN_PASSWORD=DevPassword123')
    expect(envExample).toMatch(/^ADMIN_PASSWORD=replace-with-/m)
  })
})
