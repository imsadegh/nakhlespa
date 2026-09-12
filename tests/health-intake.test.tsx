import { describe, expect, test } from 'bun:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Step3Details } from '@/components/booking/Step3Details'
import { getDefaultHealthIntake } from '@/lib/health-intake'
import type { Person, WizardState } from '@/types'

function person(overrides: Partial<Person> = {}): Person {
  return {
    serviceId: 'massage',
    addonIds: [],
    customization: null,
    healthIntake: null,
    customerName: 'مشتری',
    customerPhone: '09123456789',
    customerNotes: '',
    ...overrides,
  }
}

function props(state: WizardState, update = () => {}) {
  return { state, update, goNext: () => {}, goBack: () => {} }
}

function findComponents(node: unknown, name: string): React.ReactElement[] {
  if (!React.isValidElement(node)) return []
  const own = typeof node.type === 'function' && node.type.name === name ? [node] : []
  if (typeof node.type === 'function' && node.type.name === 'HealthQuestionnaire') {
    return own.concat(findComponents(node.type(node.props), name))
  }
  return own.concat(React.Children.toArray(node.props.children).flatMap(child => findComponents(child, name)))
}

describe('details health questionnaire', () => {
  test('renders the per-person questionnaire and female-only pregnancy row', () => {
    const state: WizardState = { gender: 'FEMALE', persons: [person(), person({ customerName: 'مشتری دوم' })] }
    const html = renderToStaticMarkup(<Step3Details {...props(state)} />)

    expect(html).toContain('لطفاً ۱۵ دقیقه قبل از زمان رزرو در مجموعه حضور داشته باشید تا خدمات بهتری دریافت کنید.')
    expect(html).toContain('مواردی که دارید انتخاب کنید')
    expect(html).toContain('بیماری‌ها')
    expect(html).toContain('پوست و حساسیت')
    expect(html).toContain('دارو و درمان')
    expect(html).toContain('وضعیت فعلی بدن')
    expect(html).toContain('بارداری')
    expect(html).toContain('عادت ماهیانه')
    expect(html).toContain('هیچ‌کدام از موارد بالا را ندارم')
    expect(html).toContain('grid grid-cols-1 gap-2 sm:grid-cols-2')
    expect(html).toContain('col-span-full h-14')
    expect(html).not.toContain('توضیحات پزشکی (اختیاری)')
    expect(html).toContain('disabled=""')
  })

  test('hides pregnancy for male customers and gates continue until every person answers', () => {
    const state: WizardState = { gender: 'MALE', persons: [person(), person()] }
    const html = renderToStaticMarkup(<Step3Details {...props(state)} />)

    expect(html).not.toContain('بارداری')
    expect(html).not.toContain('عادت ماهیانه')
    expect(html).toContain('disabled=""')
  })

  test('keeps Continue disabled when a male person has stale pregnancy state', () => {
    const state: WizardState = {
      gender: 'MALE',
      persons: [person({
        healthIntake: {
          ...getDefaultHealthIntake(),
          conditions: { pregnancy: true },
        },
      })],
    }
    const html = renderToStaticMarkup(<Step3Details {...props(state)} />)

    expect(html).toContain('disabled=""')
  })

  test('updates one person with mutual exclusion and reveals medical notes', () => {
    const state: WizardState = { gender: 'MALE', persons: [person(), person()] }
    const updates: Partial<WizardState>[] = []
    const element = <Step3Details {...props(state, patch => updates.push(patch))} />
    const checkboxes = findComponents(Step3Details(element.props), 'Checkbox')
    const illness = checkboxes.find(checkbox => checkbox.props['aria-label'] === 'دیابت')
    const none = checkboxes.find(checkbox => checkbox.props['aria-label'] === 'هیچ‌کدام از موارد بالا را ندارم')

    illness?.props.onCheckedChange(true)
    expect(updates[0]?.persons?.[0].healthIntake).toEqual({ ...getDefaultHealthIntake(), noneOfTheAbove: false, conditions: { diabetes: true } })
    expect(updates[0]?.persons?.[1].healthIntake).toBeNull()

    none?.props.onCheckedChange(true)
    expect(updates[1]?.persons?.[0].healthIntake).toEqual({ ...getDefaultHealthIntake(), noneOfTheAbove: true })
    expect(renderToStaticMarkup(<Step3Details {...props({ ...state, persons: updates[0].persons! })} />)).toContain('توضیحات پزشکی (اختیاری)')
  })
})
