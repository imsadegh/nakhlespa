import type { Gender } from '@/db/schema'

export type HealthCondition =
  | 'pregnancy'
  | 'diabetes'
  | 'bloodPressure'
  | 'cancer'
  | 'rheumatism'
  | 'multipleSclerosis'
  | 'osteoporosis'
  | 'discAndSpine'
  | 'coldOrFever'
  | 'psoriasis'
  | 'skinFungusOrAcne'
  | 'varicoseVeins'
  | 'underDoctorTreatment'
  | 'bloodClottingDisorder'
  | 'strokeRecent'
  | 'recentInjury'
  | 'fractureOrSurgery'
  | 'menstruation'
  | 'bruising'

export type HealthIntake = {
  version: 1
  noneOfTheAbove: boolean
  conditions: Record<string, true>
  medicalNotes: string
}

export type HealthIntakeSection = {
  key: 'illnesses' | 'skinAndSensitivity' | 'medicationAndTreatment' | 'currentBodyStatus'
  label: string
  conditions: readonly { key: HealthCondition; label: string; femaleOnly?: boolean }[]
}

export const HEALTH_INTAKE_SECTIONS: readonly HealthIntakeSection[] = [
  {
    key: 'illnesses',
    label: 'بیماری‌ها',
    conditions: [
      { key: 'pregnancy', label: 'بارداری', femaleOnly: true },
      { key: 'diabetes', label: 'دیابت' },
      { key: 'bloodPressure', label: 'فشار خون' },
      { key: 'cancer', label: 'سرطان' },
      { key: 'rheumatism', label: 'روماتیسم' },
      { key: 'multipleSclerosis', label: 'ام‌اس' },
      { key: 'osteoporosis', label: 'پوکی استخوان' },
      { key: 'discAndSpine', label: 'مشکلات دیسک و ستون فقرات' },
    ],
  },
  {
    key: 'skinAndSensitivity',
    label: 'پوست و حساسیت',
    conditions: [
      { key: 'coldOrFever', label: 'تب و سرماخوردگی' },
      { key: 'psoriasis', label: 'پسوریازیس' },
      { key: 'skinFungusOrAcne', label: 'زگیل، قارچ پوستی، آکنه' },
      { key: 'varicoseVeins', label: 'واریس' },
    ],
  },
  {
    key: 'medicationAndTreatment',
    label: 'دارو و درمان',
    conditions: [
      { key: 'underDoctorTreatment', label: 'در حال حاضر تحت درمان پزشک هستم' },
      { key: 'bloodClottingDisorder', label: 'اختلالات تشکیل لخته خون' },
    ],
  },
  {
    key: 'currentBodyStatus',
    label: 'وضعیت فعلی بدن',
    conditions: [
      { key: 'strokeRecent', label: 'سکته طی شش ماه گذشته' },
      { key: 'recentInjury', label: 'ضربه و آسیب طی دو روز گذشته' },
      { key: 'fractureOrSurgery', label: 'شکستگی یا جراحی طی دو سال گذشته' },
      { key: 'menstruation', label: 'عادت ماهیانه', femaleOnly: true },
      { key: 'bruising', label: 'کوفتگی یا کبودشدگی' },
    ],
  },
] as const

const HEALTH_CONDITION_KEYS = HEALTH_INTAKE_SECTIONS.flatMap(section => section.conditions.map(condition => condition.key))
const HEALTH_CONDITION_KEY_SET = new Set<HealthCondition>(HEALTH_CONDITION_KEYS)
const FEMALE_ONLY_CONDITIONS = new Set<HealthCondition>(['pregnancy', 'menstruation'])

export function getDefaultHealthIntake(): HealthIntake {
  return { version: 1, noneOfTheAbove: false, conditions: {}, medicalNotes: '' }
}

export function isHealthIntakeComplete(input: HealthIntake | null | undefined): boolean {
  return input?.version === 1 && (input.noneOfTheAbove || Object.keys(input.conditions).length > 0)
}

type HealthIntakeValidation =
  | { valid: true; value: HealthIntake }
  | { valid: false; error: string }

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype
}

export function validateHealthIntake(input: unknown, gender: Gender): HealthIntakeValidation {
  if (!isPlainObject(input)) return { valid: false, error: 'Invalid health intake object' }

  const keys = Object.keys(input)
  if (keys.length !== 4 || keys.some(key => !['version', 'noneOfTheAbove', 'conditions', 'medicalNotes'].includes(key))) {
    return { valid: false, error: 'Invalid health intake object' }
  }
  if (input.version !== 1 || typeof input.noneOfTheAbove !== 'boolean' || typeof input.medicalNotes !== 'string') {
    return { valid: false, error: 'Invalid health intake fields' }
  }
  if (!isPlainObject(input.conditions)) return { valid: false, error: 'Invalid health conditions' }

  const normalizedConditions: Record<string, true> = {}
  for (const [key, value] of Object.entries(input.conditions)) {
    if (!HEALTH_CONDITION_KEY_SET.has(key as HealthCondition) || value !== true) {
      return { valid: false, error: `Invalid health condition: ${key}` }
    }
    if (gender === 'MALE' && FEMALE_ONLY_CONDITIONS.has(key as HealthCondition)) {
      return { valid: false, error: `Health condition is not valid for ${gender}: ${key}` }
    }
    normalizedConditions[key as HealthCondition] = true
  }

  const conditions = input.noneOfTheAbove ? {} : normalizedConditions
  if (!input.noneOfTheAbove && Object.keys(conditions).length === 0) {
    return { valid: false, error: 'Select none of the above or at least one condition' }
  }

  return {
    valid: true,
    value: { version: 1, noneOfTheAbove: input.noneOfTheAbove, conditions, medicalNotes: input.medicalNotes },
  }
}
