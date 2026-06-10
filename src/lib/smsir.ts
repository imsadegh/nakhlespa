import axios from 'axios'

const API_KEY = process.env.SMSIR_API_KEY!
const TEMPLATE_ID = Number(process.env.SMSIR_TEMPLATE_ID!)

export async function sendSms(mobile: string, message: string) {
  try {
    await axios.post(
      'https://api.sms.ir/v1/send/verify',
      {
        mobile,
        templateId: TEMPLATE_ID,
        parameters: [{ name: 'CODE', value: message }],
      },
      {
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'text/plain',
        },
      }
    )
  } catch (err: any) {
    throw new Error(`SMS send failed for ${mobile}: ${err?.response?.data?.message ?? err?.message}`)
  }
}
