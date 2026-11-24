import { expect, spyOn, test } from 'bun:test'
import axios from 'axios'
import { getSmsDeliveryReport, sendConfirmSms } from '../src/lib/smsir'

test('confirmation fills ORDER_NUMBER with the booking code', async () => {
  const post = spyOn(axios, 'post').mockResolvedValue({ data: { status: 1, data: { messageId: 456 } } })
  try {
    const messageId = await sendConfirmSms('09123456789', {
      name: 'علی', service: 'مشاوره', date: '۱۴۰۵/۸/۱۱', time: '15:00', bookingCode: 'NS-1234ABCD',
    })
    expect(messageId).toBe('456')
    expect(post.mock.calls[0][1].parameters).toContainEqual({ name: 'ORDER_NUMBER', value: 'NS-1234ABCD' })
    expect(post.mock.calls[0][1].parameters.some((parameter: { name: string }) => parameter.name === 'refId')).toBe(false)
  } finally {
    post.mockRestore()
  }
})

test('returns the provider delivery status and timestamps for a message ID', async () => {
  const report = { sendDateTime: 100, deliveryState: 1, deliveryDateTime: 200 }
  const get = spyOn(axios, 'get').mockResolvedValue({ data: { status: 1, data: report } })
  try {
    expect(await getSmsDeliveryReport('456')).toEqual(report)
    expect(get.mock.calls[0][0]).toBe('https://api.sms.ir/v1/send/456')
  } finally {
    get.mockRestore()
  }
})
