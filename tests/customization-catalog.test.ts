import { describe, expect, test } from 'bun:test'
import {
  CUSTOMIZATION_CATALOG,
  getCustomizationAdditionalPriceFromCatalog,
  toCustomizationSnapshot,
} from '../src/lib/booking-customization'
import { getDefaultCustomization } from '../src/lib/booking-customization'

describe('database customization catalog contract', () => {
  test('contains the current paid customization prices', () => {
    expect(CUSTOMIZATION_CATALOG.find(option => option.code === 'BUYS_FROM_US')?.additionalPrice).toBe(300000)
    expect(CUSTOMIZATION_CATALOG.find(option => option.code === 'PRIVATE_WHEAT_WARM')?.additionalPrice).toBe(600000)
    expect(CUSTOMIZATION_CATALOG.find(option => option.code === 'PRIVATE_BARLEY_COLD')?.additionalPrice).toBe(600000)
  })

  test('calculates and snapshots selected options independently of later catalog changes', () => {
    const customization = { ...getDefaultCustomization(), loofah: 'BUYS_FROM_US' as const }
    const price = getCustomizationAdditionalPriceFromCatalog(customization, 1, CUSTOMIZATION_CATALOG)
    const snapshot = toCustomizationSnapshot(customization, 1, CUSTOMIZATION_CATALOG)

    expect(price).toBe(300000)
    expect(snapshot.find(item => item.category === 'loofah')).toMatchObject({ codeSnapshot: 'BUYS_FROM_US', pricePaid: 300000 })
  })
})
