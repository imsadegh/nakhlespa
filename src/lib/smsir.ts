import axios from 'axios'

const API_KEY = process.env.SMSIR_API_KEY!
const API_URL = 'https://api.sms.ir/v1/send'
const requestOptions = {
  timeout: 10_000,
  headers: { 'x-api-key': API_KEY, Accept: 'application/json' },
}

const TEMPLATE_IDS = {
  confirm:     Number(process.env.SMSIR_TEMPLATE_CONFIRM!),
  admin:       Number(process.env.SMSIR_TEMPLATE_ADMIN!),
  reminder24h: Number(process.env.SMSIR_TEMPLATE_REMINDER_24H!),
  reminder2h:  Number(process.env.SMSIR_TEMPLATE_REMINDER_2H!),
} as const

export type SmsTemplate = keyof typeof TEMPLATE_IDS

async function sendPattern(mobile: string, templateId: number, parameters: { name: string; value: string }[]) {
  try {
    const { data } = await axios.post<{ status: number; data?: { messageId?: number } }>(
      `${API_URL}/verify`,
      { mobile, templateId, parameters },
      requestOptions,
    )
    if (data?.status !== 1) throw new Error(`SMS.ir response status ${data?.status ?? 'missing'}`)
    return data.data?.messageId == null ? null : String(data.data.messageId)
  } catch (error) {
    const reason = axios.isAxiosError(error)
      ? error.response?.status ?? error.code ?? 'request failed'
      : error instanceof Error ? error.message : 'request failed'
    throw new Error(`SMS send failed (${reason})`)
  }
}

export async function getSmsDeliveryReport(messageId: string) {
  const { data } = await axios.get<{
    status: number
    data?: { sendDateTime: number; deliveryState: number | null; deliveryDateTime: number | null }
  }>(`${API_URL}/${encodeURIComponent(messageId)}`, requestOptions)
  if (data?.status !== 1 || !data.data) throw new Error('SMS.ir delivery report unavailable')
  const { sendDateTime, deliveryState, deliveryDateTime } = data.data
  return { sendDateTime, deliveryState, deliveryDateTime }
}

export async function sendConfirmSms(mobile: string, params: { name: string; service: string; date: string; time: string; bookingCode: string }) {
  return sendPattern(mobile, TEMPLATE_IDS.confirm, [
    { name: 'name',    value: params.name },
    { name: 'service', value: params.service },
    { name: 'date',    value: params.date },
    { name: 'time',    value: params.time },
    { name: 'ORDER_NUMBER', value: params.bookingCode },
  ])
}

export async function sendAdminSms(mobile: string, params: { name: string; service: string; date: string; time: string; phone: string }) {
  const recipients = [...new Set((mobile ?? '').split(',').map(number => number.trim()).filter(Boolean))]
  return Promise.all(recipients.map(recipient => sendPattern(recipient, TEMPLATE_IDS.admin, [
    { name: 'name',    value: params.name },
    { name: 'service', value: params.service },
    { name: 'date',    value: params.date },
    { name: 'time',    value: params.time },
    { name: 'phone',   value: params.phone },
  ])))
}

export async function sendReminderSms(mobile: string, template: 'reminder24h' | 'reminder2h', params: { name: string; service: string; time: string }) {
  return sendPattern(mobile, TEMPLATE_IDS[template], [
    { name: 'name',    value: params.name },
    { name: 'service', value: params.service },
    { name: 'time',    value: params.time },
  ])
}

export async function sendOtpSms(mobile: string, code: string) {
  const templateId = Number(process.env.SMSIR_TEMPLATE_OTP!)
  return sendPattern(mobile, templateId, [
    { name: 'code', value: code },
  ])
}
