import { expect, spyOn, test } from 'bun:test'
import axios from 'axios'
import { sendConfirmSms } from '../src/lib/smsir'

test('confirmation fills ORDER_NUMBER with the booking code', async () => {
  const post = spyOn(axios, 'post').mockResolvedValue({ data: { status: 1 } })
  try {
    await sendConfirmSms('09123456789', {
      name: 'علی', service: 'مشاوره', date: '۱۴۰۵/۸/۱۱', time: '15:00', bookingCode: 'NS-1234ABCD',
    })
    expect(post.mock.calls[0][1].parameters).toContainEqual({ name: 'ORDER_NUMBER', value: 'NS-1234ABCD' })
    expect(post.mock.calls[0][1].parameters.some((parameter: { name: string }) => parameter.name === 'refId')).toBe(false)
  } finally {
    post.mockRestore()
  }
})
