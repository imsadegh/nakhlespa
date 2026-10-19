import { expect, mock, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'

mock.module('next/navigation', () => ({
  useRouter: () => ({ push() {} }),
  useSearchParams: () => new URLSearchParams(),
}))

const { OtpLoginForm } = await import('../src/components/customer/OtpLoginForm')

test('phone login uses a native form and submit button for Enter submission', () => {
  const html = renderToStaticMarkup(<OtpLoginForm />)
  expect(html).toContain('<form')
  expect(html).toContain('type="submit"')
})

test('OTP input enables native SMS autofill and receives focus', () => {
  const source = readFileSync(new URL('../src/components/customer/OtpLoginForm.tsx', import.meta.url), 'utf8')
  expect(source).toMatch(/autoComplete="one-time-code"/)
  expect(source).toMatch(/key="otp"[\s\S]*?autoFocus/)
})
