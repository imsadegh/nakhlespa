import { afterAll, afterEach, expect, spyOn, test } from 'bun:test'
import axios from 'axios'
import { sendAdminSms } from '../src/lib/smsir'

const params = { name: 'Customer', service: 'Spa', date: '1405/08/12', time: '10:00', phone: '09123456789' }
const post = spyOn(axios, 'post')
afterEach(() => post.mockReset())
afterAll(() => post.mockRestore())

test('sends to each distinct comma-separated admin number', async () => {
  post.mockResolvedValue({ data: {} })
  await sendAdminSms('09111111111, 09222222222, ,09111111111', params)
  expect(post.mock.calls.map(call => (call[1] as { mobile: string }).mobile)).toEqual(['09111111111', '09222222222'])
})

test('preserves single-recipient support and skips empty configuration', async () => {
  post.mockResolvedValue({ data: {} })
  await sendAdminSms('09111111111', params)
  await sendAdminSms('', params)
  expect(post).toHaveBeenCalledTimes(1)
})

test('attempts every recipient even when one delivery fails', async () => {
  post.mockRejectedValueOnce(new Error('unavailable')).mockResolvedValueOnce({ data: {} })
  await expect(sendAdminSms('09111111111,09222222222', params)).rejects.toThrow('SMS send failed')
  expect(post).toHaveBeenCalledTimes(2)
})
