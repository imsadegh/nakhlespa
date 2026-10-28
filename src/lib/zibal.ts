import axios from 'axios'

const BASE = 'https://gateway.zibal.ir'
const isMock = () => process.env.NODE_ENV !== 'production' && process.env.ZIBAL_MOCK === 'true'

function merchant() {
  const value = process.env.ZIBAL_MERCHANT
  if (!value || (process.env.NODE_ENV === 'production' && value === 'zibal')) {
    throw new Error('Configure a live ZIBAL_MERCHANT in production; use zibal for local testing')
  }
  return value
}

function rials(amount: number) {
  const value = amount * 10
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error('Invalid payment amount')
  return value
}

function numericTrackId(trackId: string) {
  const value = Number(trackId)
  if (!/^[1-9]\d*$/.test(trackId) || !Number.isSafeInteger(value)) throw new Error('Invalid Zibal trackId')
  return value
}

export async function zibalRequest(amount: number, description: string, mobile: string, callbackUrl = process.env.ZIBAL_CALLBACK_URL!) {
  const amountRials = rials(amount)
  if (isMock()) {
    const trackId = `mock-${crypto.randomUUID()}`
    const callback = new URL(callbackUrl)
    callback.searchParams.set('trackId', trackId)
    callback.searchParams.set('success', '1')
    return { trackId, paymentUrl: callback.toString() }
  }

  const { data } = await axios.post(`${BASE}/v1/request`, {
    merchant: merchant(), amount: amountRials, description, mobile, callbackUrl,
  }, { timeout: 15000 })
  if (data?.result !== 100) throw new Error(`Zibal request failed: ${data?.message ?? 'Unknown error'}`)
  const trackId = String(data.trackId)
  numericTrackId(trackId)
  return { trackId, paymentUrl: `${BASE}/start/${trackId}` }
}

export async function zibalVerify(trackId: string, amount: number) {
  const amountRials = rials(amount)
  if (isMock() && trackId.startsWith('mock-')) return { refId: trackId.slice(5) }

  const payload = { merchant: merchant(), trackId: numericTrackId(trackId) }
  let { data } = await axios.post(`${BASE}/v1/verify`, payload, { timeout: 15000 })
  // Already verified responses may omit receipt details; recover them before accepting payment.
  if (data?.result === 201) {
    const inquiry = await axios.post(`${BASE}/v1/inquiry`, payload, { timeout: 15000 })
    data = inquiry.data
  }
  if (data?.result !== 100 || data.status !== 1 || data.amount !== amountRials ||
      !/^\d+$/.test(String(data.refNumber))) {
    throw new Error(`Zibal verify failed: ${data?.message ?? 'Invalid payment receipt'}`)
  }
  return { refId: String(data.refNumber) }
}
