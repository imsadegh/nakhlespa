import axios from 'axios'

const MERCHANT = process.env.ZARINPAL_MERCHANT_ID!
const CALLBACK = process.env.ZARINPAL_CALLBACK_URL!
const BASE = 'https://api.zarinpal.com/pg/v4/payment'

export async function zarinpalRequest(amount: number, description: string, mobile: string) {
  let res
  try {
    res = await axios.post(`${BASE}/request.json`, {
      merchant_id: MERCHANT,
      amount,
      description,
      callback_url: CALLBACK,
      metadata: { mobile },
    })
  } catch (err: any) {
    throw new Error(`Zarinpal request network error: ${err?.message}`)
  }
  const { data } = res
  const responseData = data?.data
  if (!responseData || responseData.code !== 100) {
    const msg = data?.errors?.message ?? data?.errors?.[0]?.message ?? 'Unknown error'
    throw new Error(`Zarinpal request failed: ${msg}`)
  }
  return {
    authority: responseData.authority as string,
    paymentUrl: `https://www.zarinpal.com/pg/StartPay/${responseData.authority}`,
  }
}

export async function zarinpalVerify(authority: string, amount: number) {
  let res
  try {
    res = await axios.post(`${BASE}/verify.json`, {
      merchant_id: MERCHANT,
      amount,
      authority,
    })
  } catch (err: any) {
    throw new Error(`Zarinpal verify network error: ${err?.message}`)
  }
  const { data } = res
  const responseData = data?.data
  if (!responseData || (responseData.code !== 100 && responseData.code !== 101)) {
    const msg = data?.errors?.message ?? data?.errors?.[0]?.message ?? 'Unknown error'
    throw new Error(`Zarinpal verify failed: ${msg}`)
  }
  return { refId: String(responseData.ref_id) }
}
