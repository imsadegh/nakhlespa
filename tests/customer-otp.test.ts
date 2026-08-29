import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { createOtpRequestGate, getOtpErrorMessage, isOtpCode, normalizeOtpDigits } from '../src/lib/customer-otp'

describe('customer OTP helpers', () => {
  test('shows the expired-code message for the API expired error', () => {
    assert.equal(getOtpErrorMessage('expired'), 'کد منقضی شده است. دوباره درخواست دهید.')
  })

  test('shows the expired-code message for the legacy Persian API error', () => {
    assert.equal(getOtpErrorMessage('کد منقضی شده است'), 'کد منقضی شده است. دوباره درخواست دهید.')
  })

  test('normalizes Persian and Arabic-Indic digits to ASCII digits', () => {
    assert.equal(normalizeOtpDigits('۰١۲٣۴۵۶۷۸۹'), '0123456789')
  })

  test('treats missing input as empty', () => {
    assert.equal(normalizeOtpDigits(undefined), '')
  })

  test('accepts a six-digit OTP pasted with Persian or Arabic-Indic digits', () => {
    assert.equal(isOtpCode('۱۲٣۴۵۶'), true)
    assert.equal(isOtpCode('۱۲۳۴۵'), false)
  })

  test('allows only one OTP verification request at a time', () => {
    const gate = createOtpRequestGate()

    assert.equal(gate.tryStart(), true)
    assert.equal(gate.tryStart(), false)

    gate.finish()
    assert.equal(gate.tryStart(), true)
  })
})
