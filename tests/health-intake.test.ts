import { describe, expect, test } from 'bun:test'
import {
  HEALTH_INTAKE_SECTIONS,
  getDefaultHealthIntake,
  isHealthIntakeComplete,
  validateHealthIntake,
} from '@/lib/health-intake'

describe('health intake contract', () => {
  test('defines the four template condition groups and stable keys', () => {
    expect(HEALTH_INTAKE_SECTIONS.map(section => section.key)).toEqual([
      'illnesses',
      'skinAndSensitivity',
      'medicationAndTreatment',
      'currentBodyStatus',
    ])

    expect(HEALTH_INTAKE_SECTIONS.flatMap(section => section.conditions.map(condition => condition.key))).toEqual([
      'pregnancy',
      'diabetes',
      'bloodPressure',
      'cancer',
      'rheumatism',
      'multipleSclerosis',
      'osteoporosis',
      'discAndSpine',
      'coldOrFever',
      'psoriasis',
      'skinFungusOrAcne',
      'varicoseVeins',
      'underDoctorTreatment',
      'bloodClottingDisorder',
      'strokeRecent',
      'recentInjury',
      'fractureOrSurgery',
      'menstruation',
      'bruising',
    ])

    expect(HEALTH_INTAKE_SECTIONS.find(section => section.key === 'illnesses')?.conditions.map(condition => condition.key)).toContain('pregnancy')
  })

  test('provides an incomplete default empty state', () => {
    const intake = getDefaultHealthIntake()

    expect(intake).toEqual({ version: 1, noneOfTheAbove: false, conditions: {}, medicalNotes: '' })
    expect(validateHealthIntake(intake, 'MALE').valid).toBe(false)
    expect(isHealthIntakeComplete(null)).toBe(false)
    expect(isHealthIntakeComplete(intake)).toBe(false)
  })

  test('accepts none-of-the-above and normalizes away simultaneous conditions', () => {
    const result = validateHealthIntake({
      version: 1,
      noneOfTheAbove: true,
      conditions: { diabetes: true },
      medicalNotes: '',
    }, 'MALE')

    expect(result).toEqual({
      valid: true,
      value: { version: 1, noneOfTheAbove: true, conditions: {}, medicalNotes: '' },
    })
    if (result.valid) expect(isHealthIntakeComplete(result.value)).toBe(true)
  })

  test('accepts a valid female payload with pregnancy', () => {
    const result = validateHealthIntake({
      version: 1,
      noneOfTheAbove: false,
      conditions: { pregnancy: true, bruising: true },
      medicalNotes: 'توضیح پزشکی',
    }, 'FEMALE')

    expect(result).toMatchObject({ valid: true })
    if (result.valid) expect(isHealthIntakeComplete(result.value)).toBe(true)
  })

  test('accepts a valid male payload without pregnancy', () => {
    expect(validateHealthIntake({
      version: 1,
      noneOfTheAbove: false,
      conditions: { diabetes: true },
      medicalNotes: '',
    }, 'MALE')).toMatchObject({ valid: true })
  })

  test('rejects missing choices, malformed fields, and unknown condition keys', () => {
    expect(validateHealthIntake({ version: 1, noneOfTheAbove: false, conditions: {}, medicalNotes: '' }, 'MALE').valid).toBe(false)
    expect(validateHealthIntake({ version: 2, noneOfTheAbove: true, conditions: {}, medicalNotes: '' }, 'MALE').valid).toBe(false)
    expect(validateHealthIntake({ version: 1, noneOfTheAbove: true, conditions: { diabetes: false }, medicalNotes: '' }, 'MALE').valid).toBe(false)
    expect(validateHealthIntake({ version: 1, noneOfTheAbove: true, conditions: { unknown: true }, medicalNotes: '' }, 'MALE').valid).toBe(false)
    expect(validateHealthIntake({ version: 1, noneOfTheAbove: true, conditions: {}, medicalNotes: '', extra: true }, 'MALE').valid).toBe(false)
  })

  test('rejects female-only conditions for male input, including a none selection', () => {
    expect(validateHealthIntake({
      version: 1,
      noneOfTheAbove: false,
      conditions: { pregnancy: true },
      medicalNotes: '',
    }, 'MALE').valid).toBe(false)
    expect(validateHealthIntake({
      version: 1,
      noneOfTheAbove: true,
      conditions: { pregnancy: true },
      medicalNotes: '',
    }, 'MALE').valid).toBe(false)
    expect(validateHealthIntake({
      version: 1,
      noneOfTheAbove: false,
      conditions: { menstruation: true },
      medicalNotes: '',
    }, 'MALE').valid).toBe(false)
  })
})
