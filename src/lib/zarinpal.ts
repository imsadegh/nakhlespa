import axios from 'axios'

const MERCHANT = process.env.ZARINPAL_MERCHANT_ID!
const CALLBACK = process.env.ZARINPAL_CALLBACK_URL!
const BASE = 'https://api.zarinpal.com/pg/v4/payment'

export async function zarinpalRequest(amount: number, description: string, mobile: string) {
  const { data } = await axios.post(`${BASE}/request.json`, {
    merchant_id: MERCHANT,
    amount,
    description,
    callback_url: CALLBACK,
    metadata: { mobile },
  })
  if (data.data.code !== 100) throw new Error(`Zarinpal request failed: ${data.errors?.message}`)
  return {
    authority: data.data.authority as string,
    paymentUrl: `https://www.zarinpal.com/pg/StartPay/${data.data.authority}`,
  }
}

export async function zarinpalVerify(authority: string, amount: number) {
  const { data } = await axios.post(`${BASE}/verify.json`, {
    merchant_id: MERCHANT,
    amount,
    authority,
  })
  if (data.data.code !== 100 && data.data.code !== 101) {
    throw new Error(`Zarinpal verify failed: ${data.errors?.message}`)
  }
  return { refId: String(data.data.ref_id) }
}
