import axios from 'axios'

const API_KEY = process.env.SMSIR_API_KEY!
const LINE = Number(process.env.SMSIR_LINE_NUMBER!)

export async function sendSms(mobile: string, message: string) {
  try {
    await axios.post(
      'https://api.sms.ir/v1/send/bulk',
      { lineNumber: LINE, messageTexts: [message], mobiles: [mobile] },
      { headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    throw new Error(`SMS send failed for ${mobile}: ${err?.response?.data?.Message ?? err?.message}`)
  }
}
