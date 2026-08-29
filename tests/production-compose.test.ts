import { readFileSync } from 'node:fs'
import { describe, expect, test } from 'bun:test'

const compose = readFileSync('compose.production.yml', 'utf8')

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
})
