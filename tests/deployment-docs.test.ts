import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'bun:test'

describe('deployment documentation contract', () => {
  test('documents required production variables', () => {
    const env = readFileSync('.env.example', 'utf8')
    for (const key of ['DB_USER', 'DB_PASSWORD', 'DB_NAME', 'BETTER_AUTH_SECRET', 'ZARINPAL_MERCHANT_ID', 'SMSIR_API_KEY', 'NEXT_PUBLIC_SITE_URL']) {
      expect(env).toContain(`${key}=`)
    }
  })

  test('documents Coolify Compose deployment and initialization', () => {
    const readme = readFileSync('README.md', 'utf8')
    expect(readme).toContain('Coolify')
    expect(readme).toContain('compose.production.yml')
    expect(readme).toContain('prisma migrate deploy')
    expect(readme).toContain('worker-sms')
    expect(readme).toContain('Do not open')
  })

  test('documents automatic startup migrations and one-time manual seed', () => {
    const readme = readFileSync('README.md', 'utf8')
    expect(readme).toContain('automatically runs `prisma migrate deploy` before `next start`')
    expect(readme).toContain('one-time manual seed')
    expect(readme).toContain('Do not run the seed on every restart')
    expect(readme).not.toContain('Repeat the migration command after each release before enabling new application traffic')
  })

  test('documents safe production Zarinpal mode and Coolify URL handling', () => {
    const compose = readFileSync('compose.production.yml', 'utf8')
    const readme = readFileSync('README.md', 'utf8')

    expect(compose).toContain('ZARINPAL_SANDBOX: ${ZARINPAL_SANDBOX}')
    expect(readme).toContain('ZARINPAL_SANDBOX=false')
    expect(readme).toContain('Do not add `DATABASE_URL` or `REDIS_URL`')
    expect(readme).toContain('Compose interpolation and application variables')
    expect(readme).not.toContain('Add every variable from `.env.example`')
  })
})
