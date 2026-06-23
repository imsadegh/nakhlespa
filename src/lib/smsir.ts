import axios from 'axios'

const API_KEY = process.env.SMSIR_API_KEY!

const TEMPLATE_IDS = {
  confirm:     Number(process.env.SMSIR_TEMPLATE_CONFIRM!),
  admin:       Number(process.env.SMSIR_TEMPLATE_ADMIN!),
  reminder24h: Number(process.env.SMSIR_TEMPLATE_REMINDER_24H!),
  reminder2h:  Number(process.env.SMSIR_TEMPLATE_REMINDER_2H!),
} as const

export type SmsTemplate = keyof typeof TEMPLATE_IDS

async function sendPattern(mobile: string, templateId: number, parameters: { name: string; value: string }[]) {
  try {
    await axios.post(
      'https://api.sms.ir/v1/send/verify',
      { mobile, templateId, parameters },
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

export async function sendConfirmSms(mobile: string, params: { name: string; service: string; date: string; time: string; refId: string }) {
  return sendPattern(mobile, TEMPLATE_IDS.confirm, [
    { name: 'name',    value: params.name },
    { name: 'service', value: params.service },
    { name: 'date',    value: params.date },
    { name: 'time',    value: params.time },
    { name: 'refId',   value: params.refId },
  ])
}

export async function sendAdminSms(mobile: string, params: { name: string; service: string; date: string; time: string; phone: string }) {
  return sendPattern(mobile, TEMPLATE_IDS.admin, [
    { name: 'name',    value: params.name },
    { name: 'service', value: params.service },
    { name: 'date',    value: params.date },
    { name: 'time',    value: params.time },
    { name: 'phone',   value: params.phone },
  ])
}

export async function sendReminderSms(mobile: string, template: 'reminder24h' | 'reminder2h', params: { name: string; service: string; time: string }) {
  return sendPattern(mobile, TEMPLATE_IDS[template], [
    { name: 'name',    value: params.name },
    { name: 'service', value: params.service },
    { name: 'time',    value: params.time },
  ])
}
