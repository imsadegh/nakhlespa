const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹'
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'

const OTP_ERROR_MESSAGES: Record<string, string> = {
  expired: 'کد منقضی شده است. دوباره درخواست دهید.',
  invalid_request: 'درخواست نامعتبر است. دوباره تلاش کنید.',
  invalid_code: 'کد وارد شده اشتباه است.',
  'کد منقضی شده است': 'کد منقضی شده است. دوباره درخواست دهید.',
  'درخواست نامعتبر است': 'درخواست نامعتبر است. دوباره تلاش کنید.',
}

export function normalizeOtpDigits(value: unknown) {
  if (typeof value !== 'string') return ''

  return Array.from(value, char => {
    const persianIndex = PERSIAN_DIGITS.indexOf(char)
    if (persianIndex !== -1) return String(persianIndex)

    const arabicIndex = ARABIC_DIGITS.indexOf(char)
    if (arabicIndex !== -1) return String(arabicIndex)

    return char
  }).join('')
}

export function isOtpCode(value: unknown) {
  return /^\d{6}$/.test(normalizeOtpDigits(value))
}

export function createOtpRequestGate() {
  let inFlight = false

  return {
    tryStart() {
      if (inFlight) return false
      inFlight = true
      return true
    },
    finish() {
      inFlight = false
    },
  }
}

export function getOtpErrorMessage(error: unknown) {
  if (typeof error !== 'string') return OTP_ERROR_MESSAGES.invalid_code
  return OTP_ERROR_MESSAGES[error] ?? OTP_ERROR_MESSAGES.invalid_code
}
