import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'bun:test'

describe('deployment documentation contract', () => {
  test('documents required production variables', () => {
    const env = readFileSync('.env.example', 'utf8')
    for (const key of ['DB_USER', 'DB_PASSWORD', 'DB_NAME', 'BETTER_AUTH_SECRET', 'ZARINPAL_MERCHANT_ID', 'SMSIR_API_KEY', 'NEXT_PUBLIC_SITE_URL']) {
      expect(env).toContain(`${key}=`)
    }
  })

  test('documents Dokploy Compose deployment and initialization', () => {
    const readme = readFileSync('README.md', 'utf8')
    expect(readme).toContain('Dokploy')
    expect(readme).toContain('compose.production.yml')
    expect(readme).toContain('bun run db:migrate')
    expect(readme).toContain('worker-sms')
    expect(readme).toContain('Do not attach domains or publish host ports')
    expect(readme).toContain('NAKHLESPA_IMAGE=ghcr.io/imsadegh/nakhlespa:latest')
  })

  test('documents automatic startup migrations and one-time manual seed', () => {
    const readme = readFileSync('README.md', 'utf8')
    expect(readme).toContain('runs `bun run db:migrate` before `next start`')
    expect(readme).toContain('one-time seed')
    expect(readme).toContain('must not run automatically on every restart')
    expect(readme).not.toContain('Repeat the migration command after each release before enabling new application traffic')
  })

  test('documents one root env file for local setup', () => {
    const readme = readFileSync('README.md', 'utf8')
    expect(readme).toContain('cp .env.example .env')
    expect(readme).toContain('Next.js and Drizzle read the same root `.env` file')
    expect(readme).not.toContain('Create `.env.local`')
  })

  test('documents safe production Zarinpal mode and Dokploy URL handling', () => {
    const compose = readFileSync('compose.production.yml', 'utf8')
    const readme = readFileSync('README.md', 'utf8')

    expect(compose).toContain('ZARINPAL_SANDBOX: ${ZARINPAL_SANDBOX}')
    expect(readme).toContain('ZARINPAL_SANDBOX=false')
    expect(readme).toContain('Do not add the local `DATABASE_URL` or `REDIS_URL`')
    expect(readme).toContain('Dokploy environment variables')
    expect(readme).toContain('DOKPLOY_URL')
    expect(readme).not.toContain('Add every variable from `.env.example`')
  })
})
