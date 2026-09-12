import { describe, expect, test } from 'bun:test'
import {
  CUSTOMIZATION_DEFAULTS,
  CUSTOMIZATION_OPTIONS,
  getCustomizationAdditionalPrice,
  getDefaultCustomization,
  normalizeCustomization,
  validateCustomization,
} from '../src/lib/booking-customization'

describe('booking customization contract', () => {
  test('defines the exact five option sets with stable values', () => {
    expect(Object.keys(CUSTOMIZATION_OPTIONS)).toEqual([
      'musicGenre',
      'pressureLevel',
      'soap',
      'loofah',
      'poultice',
    ])
    expect(CUSTOMIZATION_OPTIONS.musicGenre.map(option => option.value)).toEqual([
      'TRADITIONAL',
      'POP',
      'INSTRUMENTAL',
      'RELAXING',
      'CLASSICAL',
    ])
    expect(CUSTOMIZATION_OPTIONS.pressureLevel.map(option => option.value)).toEqual([
      'GENTLE',
      'MEDIUM',
      'FIRM',
    ])
    expect(CUSTOMIZATION_OPTIONS.soap.map(option => option.value)).toEqual([
      'TRADITIONAL',
      'LUXURY',
      'GOLNAR',
      'SHAMPOO',
    ])
    expect(CUSTOMIZATION_OPTIONS.loofah.map(option => option.value)).toEqual([
      'PUBLIC',
      'BRINGS_OWN',
      'BUYS_FROM_US',
      'VIP_FREE_NEW',
    ])
    expect(CUSTOMIZATION_OPTIONS.poultice.map(option => option.value)).toEqual([
      'GENERAL_SEDR_HENNA',
      'PRIVATE_WHEAT_WARM',
      'PRIVATE_BARLEY_COLD',
    ])
    expect(CUSTOMIZATION_OPTIONS.poultice.every(option => option.label && option.description)).toBe(true)
  })

  test('exposes the documented defaults and returns fresh default objects', () => {
    expect(CUSTOMIZATION_DEFAULTS).toEqual({
      musicGenre: 'INSTRUMENTAL',
      pressureLevel: 'MEDIUM',
      soap: 'TRADITIONAL',
      loofah: 'PUBLIC',
      poultice: 'GENERAL_SEDR_HENNA',
    })

    const first = getDefaultCustomization()
    const second = getDefaultCustomization()
    expect(first).toEqual(CUSTOMIZATION_DEFAULTS)
    expect(first).not.toBe(second)
    first.musicGenre = 'POP'
    expect(second.musicGenre).toBe('INSTRUMENTAL')
  })

  test('forces the free new kit for tier 3', () => {
    const customization = {
      ...getDefaultCustomization(),
      loofah: 'BUYS_FROM_US' as const,
    }

    expect(normalizeCustomization(customization, 3)).toEqual({
      ...customization,
      loofah: 'VIP_FREE_NEW',
    })
    expect(normalizeCustomization(customization, 2)).toEqual(customization)
    expect(normalizeCustomization({ ...customization, loofah: 'VIP_FREE_NEW' }, 2)).toEqual({
      ...customization,
      loofah: 'PUBLIC',
    })
  })

  test('prices only the paid loofah and private poultice choices', () => {
    expect(getCustomizationAdditionalPrice(getDefaultCustomization(), 1)).toBe(0)
    expect(getCustomizationAdditionalPrice({ ...getDefaultCustomization(), loofah: 'BUYS_FROM_US' }, 1)).toBe(300000)
    expect(getCustomizationAdditionalPrice({ ...getDefaultCustomization(), poultice: 'PRIVATE_WHEAT_WARM' }, 1)).toBe(600000)
    expect(getCustomizationAdditionalPrice({ ...getDefaultCustomization(), poultice: 'PRIVATE_BARLEY_COLD' }, 1)).toBe(600000)
    expect(getCustomizationAdditionalPrice({ ...getDefaultCustomization(), loofah: 'VIP_FREE_NEW' }, 3)).toBe(0)
  })

  test('accepts complete known values and rejects unknown or malformed values', () => {
    const valid = validateCustomization(getDefaultCustomization(), 1)
    expect(valid).toEqual({ valid: true, value: getDefaultCustomization() })

    expect(validateCustomization({ ...getDefaultCustomization(), soap: 'UNKNOWN' }, 1)).toEqual({
      valid: false,
      error: 'Invalid customization value for soap',
    })
    expect(validateCustomization({ ...getDefaultCustomization(), loofah: 'VIP_FREE_NEW' }, 2)).toEqual({
      valid: false,
      error: 'VIP_FREE_NEW loofah is only valid for tier 3 services',
    })
    expect(validateCustomization({ musicGenre: 'POP' }, 1)).toEqual({
      valid: false,
      error: 'Invalid customization object',
    })
    expect(validateCustomization(null, 1)).toEqual({
      valid: false,
      error: 'Invalid customization object',
    })
  })

  test('rejects extra keys and arrays', () => {
    expect(validateCustomization({ ...getDefaultCustomization(), extra: 'value' }, 1)).toEqual({
      valid: false,
      error: 'Invalid customization object',
    })
    expect(validateCustomization([getDefaultCustomization()], 1)).toEqual({
      valid: false,
      error: 'Invalid customization object',
    })
  })

  test('rejects malformed field types', () => {
    for (const [key, value] of [
      ['musicGenre', 42],
      ['pressureLevel', null],
      ['soap', {}],
      ['loofah', ['PUBLIC']],
      ['poultice', true],
    ] as const) {
      expect(validateCustomization({ ...getDefaultCustomization(), [key]: value }, 1)).toEqual({
        valid: false,
        error: `Invalid customization value for ${key}`,
      })
    }
  })

  test('normalizes tier 3 validation results to the free new kit', () => {
    const result = validateCustomization(
      { ...getDefaultCustomization(), loofah: 'PUBLIC' },
      3,
    )

    expect(result).toEqual({
      valid: true,
      value: { ...getDefaultCustomization(), loofah: 'VIP_FREE_NEW' },
    })
  })
})
