import { afterEach, describe, expect, spyOn, test } from 'bun:test'
import axios from 'axios'
import { zibalRequest, zibalVerify } from '../src/lib/zibal'

process.env.ZIBAL_MERCHANT = 'test-merchant'
process.env.ZIBAL_CALLBACK_URL = 'https://spa.test/api/bookings/verify'
process.env.ZIBAL_MOCK = 'false'

afterEach(() => {
  post?.mockRestore()
  process.env.ZIBAL_MERCHANT = 'test-merchant'
  process.env.ZIBAL_MOCK = 'false'
})
let post: ReturnType<typeof spyOn>

describe('Zibal payments', () => {
  test('requests rials and returns the Zibal payment URL', async () => {
    post = spyOn(axios, 'post').mockResolvedValue({ data: { result: 100, trackId: 12345 } })
    expect(await zibalRequest(25000, 'booking', '09123456789')).toEqual({
      trackId: '12345', paymentUrl: 'https://gateway.zibal.ir/start/12345',
    })
    expect(post.mock.calls[0][1]).toEqual({
      merchant: 'test-merchant', amount: 250000, description: 'booking',
      mobile: '09123456789', callbackUrl: 'https://spa.test/api/bookings/verify',
    })
  })

  test('rejects gateway errors and malformed track IDs', async () => {
    post = spyOn(axios, 'post').mockResolvedValue({ data: { result: 104, message: 'invalid merchant' } })
    await expect(zibalRequest(25000, 'booking', '09123456789')).rejects.toThrow('invalid merchant')
    post.mockResolvedValue({ data: { result: 100 } })
    await expect(zibalRequest(25000, 'booking', '09123456789')).rejects.toThrow()
  })

  test('verifies the paid amount and reference', async () => {
    post = spyOn(axios, 'post').mockResolvedValue({ data: { result: 100, status: 1, amount: 250000, refNumber: 9876 } })
    expect(await zibalVerify('12345', 25000)).toEqual({ refId: '9876' })
    expect(post.mock.calls[0][1]).toEqual({ merchant: 'test-merchant', trackId: 12345 })
    post.mockResolvedValue({ data: { result: 100, status: 1, amount: 25000, refNumber: 9876 } })
    await expect(zibalVerify('12345', 25000)).rejects.toThrow()
  })

  test('recovers already verified payments through inquiry', async () => {
    post = spyOn(axios, 'post')
      .mockResolvedValueOnce({ data: { result: 201 } })
      .mockResolvedValueOnce({ data: { result: 100, status: 1, amount: 250000, refNumber: 9876 } })
    expect(await zibalVerify('12345', 25000)).toEqual({ refId: '9876' })
    expect(post.mock.calls[1][0]).toBe('https://gateway.zibal.ir/v1/inquiry')
  })

  test('rejects unpaid, missing-reference and invalid-ID payments', async () => {
    post = spyOn(axios, 'post').mockResolvedValue({ data: { result: 202 } })
    await expect(zibalVerify('12345', 25000)).rejects.toThrow()
    post.mockResolvedValue({ data: { result: 100, status: 2, amount: 250000, refNumber: 9876 } })
    await expect(zibalVerify('12345', 25000)).rejects.toThrow()
    post.mockResolvedValue({ data: { result: 100, status: 1, amount: 250000 } })
    await expect(zibalVerify('12345', 25000)).rejects.toThrow()
    await expect(zibalVerify('invalid', 25000)).rejects.toThrow()
  })

  test('rejects invalid amounts before requesting payment', async () => {
    post = spyOn(axios, 'post')
    for (const amount of [0, -1, NaN, Infinity, Number.MAX_SAFE_INTEGER]) {
      await expect(zibalRequest(amount, 'booking', '09123456789')).rejects.toThrow()
    }
    expect(post).not.toHaveBeenCalled()
  })

  test('local mock uses Zibal callback parameters without contacting the gateway', async () => {
    process.env.ZIBAL_MOCK = 'true'
    post = spyOn(axios, 'post')
    const result = await zibalRequest(25000, 'booking', '09123456789')
    const callback = new URL(result.paymentUrl)
    expect(callback.searchParams.get('trackId')).toBe(result.trackId)
    expect(callback.searchParams.get('success')).toBe('1')
    expect(await zibalVerify(result.trackId, 25000)).toEqual({ refId: result.trackId.slice(5) })
    expect(post).not.toHaveBeenCalled()
  })

  test('production rejects the test merchant and cannot bypass payment with mock mode', async () => {
    const previousMode = process.env.NODE_ENV
    try {
      process.env.NODE_ENV = 'production'
      process.env.ZIBAL_MERCHANT = 'zibal'
      process.env.ZIBAL_MOCK = 'true'
      post = spyOn(axios, 'post')
      await expect(zibalRequest(25000, 'booking', '09123456789')).rejects.toThrow('live ZIBAL_MERCHANT')
      await expect(zibalVerify('mock-fake', 25000)).rejects.toThrow()
      expect(post).not.toHaveBeenCalled()
    } finally {
      if (previousMode === undefined) delete process.env.NODE_ENV
      else process.env.NODE_ENV = previousMode
    }
  })
})
