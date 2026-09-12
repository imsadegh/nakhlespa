import { describe, expect, test } from 'bun:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { StepCustomization } from '../src/components/booking/StepCustomization'
import { CUSTOMIZATION_OPTIONS, getDefaultCustomization, normalizeCustomization } from '../src/lib/booking-customization'
import type { Person, ServiceDTO, WizardState } from '../src/types'

const services: ServiceDTO[] = [
  { id: 'tier-2', nameFa: 'سرویس ویژه', descriptionFa: 'توضیح', durationMinutes: 60, price: 1000, color: 'purple', symbol: '۲', tier: 2 },
  { id: 'tier-3', nameFa: 'ارغوان', descriptionFa: 'توضیح', durationMinutes: 90, price: 2000, color: 'blue', symbol: '۳', tier: 3 },
  { id: 'consultation', nameFa: 'مشاوره', descriptionFa: 'توضیح', durationMinutes: 30, price: 500, color: null, symbol: null, tier: null },
]

function person(serviceId: string): Person {
  return {
    serviceId,
    addonIds: ['addon-1'],
    customization: getDefaultCustomization(),
    customerName: '',
    customerPhone: '',
    customerNotes: '',
  }
}

function props(state: WizardState, update = () => {}) {
  return { state, update, goNext: () => {}, goBack: () => {}, services }
}

function findToggleGroups(node: unknown): React.ReactElement[] {
  if (!React.isValidElement(node)) return []
  const groups = typeof node.type === 'function' && node.type.name === 'ToggleGroup' ? [node] : []
  const children = React.Children.toArray(node.props.children)
  return groups.concat(children.flatMap(findToggleGroups))
}

function expectPressedButton(html: string, label: string) {
  expect(html).toMatch(new RegExp(`<button[^>]*aria-pressed="true"[^>]*>[\\s\\S]*${label}`))
}

function expectDisabledButton(html: string, label: string) {
  expect(html).toMatch(new RegExp(`<button[^>]*disabled[^>]*>[\\s\\S]*${label}`))
}

describe('booking customization step', () => {
  test('renders one card and collapsed customization controls per person by default', () => {
    const html = renderToStaticMarkup(
      <StepCustomization {...props({ persons: [person('tier-2'), person('tier-2')] })} />,
    )

    expect((html.match(/data-slot="card"/g) ?? []).length).toBe(0)
    expect((html.match(/data-slot="button"/g) ?? []).length).toBe(1)
    expect((html.match(/data-slot="toggle-group"/g) ?? []).length).toBe(0)
    expect((html.match(/aria-expanded="false"/g) ?? []).length).toBe(1)
    expect((html.match(/شخصی‌سازی انتخاب‌ها/g) ?? []).length).toBe(1)
  })

  test('updates each customization field independently for only the selected person', () => {
    const state = { persons: [person('tier-2'), person('tier-2')] }
    const updates: Partial<WizardState>[] = []
    const selections = ['POP', 'FIRM', 'LUXURY', 'BRINGS_OWN', 'PRIVATE_BARLEY_COLD']
    const fields = ['musicGenre', 'pressureLevel', 'soap', 'loofah', 'poultice'] as const

    const secondPerson = <StepCustomization {...props(state, patch => updates.push(patch))} defaultExpanded />
    findToggleGroups(StepCustomization(secondPerson.props)).slice(5, 10).forEach((group, index) => {
      group.props.onValueChange([selections[index]])
    })

    expect(updates).toHaveLength(5)
    updates.forEach((patch, index) => {
      expect(patch.persons?.[0].customization).toEqual(getDefaultCustomization())
      expect(patch.persons?.[0].addonIds).toEqual(['addon-1'])
      expect(patch.persons?.[1].customization).toEqual({ ...getDefaultCustomization(), [fields[index]]: selections[index] })
      expect(patch.persons?.[1].addonIds).toEqual(['addon-1'])
    })

    const firstPerson = <StepCustomization {...props(state, patch => updates.push(patch))} defaultExpanded />
    const firstPersonGroups = findToggleGroups(StepCustomization(firstPerson.props))
    firstPersonGroups[0].props.onValueChange(['POP'])
    expect(updates.at(-1)?.persons?.[0].customization.musicGenre).toBe('POP')
    expect(updates.at(-1)?.persons?.[1].customization.musicGenre).toBe('INSTRUMENTAL')
  })

  test('locks tier 3 loofah to VIP_FREE_NEW and disables every alternative', () => {
    const state = { persons: [{ ...person('tier-3'), customization: { ...getDefaultCustomization(), loofah: 'PUBLIC' as const } }] }
    const html = renderToStaticMarkup(<StepCustomization {...props(state)} defaultExpanded />)

    expectPressedButton(html, 'کیسه و لیف نو رایگان')
    expect(html).toContain('ارغوان')
    CUSTOMIZATION_OPTIONS.loofah
      .filter(option => option.value !== 'VIP_FREE_NEW')
      .forEach(option => expectDisabledButton(html, option.label))
    expect(normalizeCustomization(state.persons[0].customization, 3).loofah).toBe('VIP_FREE_NEW')
  })

  test('shows concise loofah choices when customization is expanded', () => {
    const html = renderToStaticMarkup(
      <StepCustomization {...props({ persons: [person('tier-2')] })} defaultExpanded />,
    )

    expect(html).toContain('همراه داشتن کیسه و لیف شخصی')
    expect(html).toContain('خرید کیسه و لیف جدید')
    expect(html).not.toContain('کیسه و لیف جدید از مجموعه خریداری می‌شود.')
    expect(html).not.toContain('مخصوص VIP ارغوان، به‌صورت خودکار انتخاب می‌شود.')
    expect(html).not.toContain('موسیقی سنتی رایگان')
    expect(html).not.toContain('فشار ملایم رایگان')
    expect(html.match(/data-slot="field-set"/g)?.length).toBe(5)
    expect(html).toContain('rounded-xl border border-border/70')
    expect(html).toContain('!bg-foreground')
    expect(html).not.toContain('lucide-check')
  })

  test('keeps the VIP free kit unavailable for non-VIP services', () => {
    const html = renderToStaticMarkup(
      <StepCustomization {...props({ persons: [person('tier-2')] })} defaultExpanded />,
    )

    expectDisabledButton(html, 'کیسه و لیف نو رایگان')
  })

  test('uses the shared navigation button components', () => {
    const html = renderToStaticMarkup(<StepCustomization {...props({ persons: [person('tier-2')] })} />)

    expect(html).toContain('glass inline-flex')
    expect(html).toContain('bg-gradient-to-br from-[#e0c276]')
  })

  test('does not render massage customization controls for non-tier services', () => {
    const html = renderToStaticMarkup(<StepCustomization {...props({ persons: [person('consultation')] })} />)

    expect(html).toContain('مشاوره')
    expect(html).not.toContain('سفارشی‌سازی ماساژ')
    expect(html).not.toContain('data-slot="toggle-group"')
  })

  test('keeps original person indexes when non-tier and tiered services are mixed', () => {
    const state = { persons: [{ ...person('consultation'), customization: null }, person('tier-2')] }
    const updates: Partial<WizardState>[] = []
    const element = <StepCustomization {...props(state, patch => updates.push(patch))} defaultExpanded />
    const groups = findToggleGroups(StepCustomization(element.props))

    groups[0].props.onValueChange(['POP'])

    expect(updates[0]?.persons?.[0].customization).toBeNull()
    expect(updates[0]?.persons?.[1].customization.musicGenre).toBe('POP')
  })
})
