'use client'
import { GoldButton } from '@/components/ui/GoldButton'
import { GhostButton } from '@/components/ui/GhostButton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireTitle,
} from '@/components/ui/questionnaire'
import { Questionnaire } from '@shadcn/react/questionnaire'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldLegend, FieldSet } from '@/components/ui/field-set'
import {
  HEALTH_INTAKE_SECTIONS,
  getDefaultHealthIntake,
  isHealthIntakeComplete,
  validateHealthIntake,
  type HealthCondition,
} from '@/lib/health-intake'
import { cn } from '@/lib/utils'
import type { WizardState, Person } from '@/types'

type Props = { state: WizardState; update: (p: Partial<WizardState>) => void; goNext: () => void; goBack: () => void }

function toEnDigits(s: string) {
  return s
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
}

function isValidIranPhone(phone: string) {
  return /^09[0-9]{9}$/.test(phone)
}

function toFaOrdinal(n: number) {
  return String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])
}

const arrivalNotice = 'لطفاً ۱۵ دقیقه قبل از زمان رزرو در مجموعه حضور داشته باشید تا خدمات بهتری دریافت کنید.'
const noneLabel = 'هیچ‌کدام از موارد بالا را ندارم'

function HealthQuestionnaire({
  person,
  gender,
  onChange,
}: {
  person: Person
  gender: NonNullable<WizardState['gender']>
  onChange: (healthIntake: Person['healthIntake']) => void
}) {
  const intake = person.healthIntake ?? getDefaultHealthIntake()
  const validation = validateHealthIntake(intake, gender)
  const invalid = !isHealthIntakeComplete(person.healthIntake) || !validation.valid

  function setCondition(condition: HealthCondition, checked: boolean) {
    const conditions = { ...intake.conditions }
    if (checked) conditions[condition] = true
    else delete conditions[condition]
    onChange({ ...intake, noneOfTheAbove: false, conditions })
  }

  function setNone(checked: boolean) {
    onChange({ ...intake, noneOfTheAbove: checked, conditions: checked ? {} : intake.conditions })
  }

  return (
    <div className="flex flex-col gap-3" data-health-questionnaire data-invalid={invalid ? '' : undefined} aria-invalid={invalid}>
      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>مواردی که دارید انتخاب کنید</p>
      {HEALTH_INTAKE_SECTIONS.map(section => {
        const conditions = section.conditions.filter(condition => !condition.femaleOnly || gender === 'FEMALE')
        return (
          <Questionnaire.Root key={section.key} noValidate>
            <Questionnaire.Item name={section.key} multiple invalid={invalid}>
              <QuestionnaireTitle>{section.label}</QuestionnaireTitle>
              <QuestionnaireDescription className="mb-2 text-xs font-normal text-muted-foreground">
                در صورت وجود، موارد مربوط به خود را انتخاب کنید.
              </QuestionnaireDescription>
              <QuestionnaireChoices className={cn(
                section.key === 'illnesses' ? 'grid grid-cols-1 gap-2 sm:grid-cols-2' : 'flex flex-col gap-2',
              )}>
                {conditions.map(condition => {
                  const id = `health-${section.key}-${condition.key}`
                  return (
                    <label key={condition.key} htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs" style={{ borderColor: 'var(--border-base)' }}>
                      <Checkbox
                        id={id}
                        aria-label={condition.label}
                        checked={intake.conditions[condition.key] === true}
                        onCheckedChange={checked => setCondition(condition.key, checked === true)}
                      />
                      <span>{condition.label}</span>
                    </label>
                  )
                })}
              </QuestionnaireChoices>
            </Questionnaire.Item>
          </Questionnaire.Root>
        )
      })}
      <label htmlFor={`health-none-${person.customerName}`} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs" style={{ borderColor: 'var(--border-base)' }}>
        <Checkbox
          id={`health-none-${person.customerName}`}
          aria-label={noneLabel}
          checked={intake.noneOfTheAbove}
          onCheckedChange={checked => setNone(checked === true)}
        />
        <span>{noneLabel}</span>
      </label>
      {Object.keys(intake.conditions).length > 0 && (
          <Textarea
            placeholder="توضیحات پزشکی (اختیاری)"
            value={intake.medicalNotes}
            onChange={event => onChange({ ...intake, medicalNotes: event.target.value })}
            className="h-20 text-right placeholder:text-right placeholder:text-xs"
        />
      )}
    </div>
  )
}

export function Step3Details({ state, update, goNext, goBack }: Props) {
  const persons = state.persons
  const gender = state.gender ?? 'MALE'

  function setPerson(index: number, patch: Partial<Person>) {
    update({ persons: persons.map((p, i) => i === index ? { ...p, ...patch } : p) })
  }

  function handlePhoneChange(index: number, raw: string) {
    const normalized = toEnDigits(raw).replace(/[^0-9]/g, '')
    setPerson(index, { customerPhone: normalized })
  }

  const canProceed = persons.every((p, i) => {
    const nameOk = p.customerName.trim() !== ''
    const phoneOk = i === 0 ? isValidIranPhone(p.customerPhone) : (p.customerPhone === '' || isValidIranPhone(p.customerPhone))
    const healthOk = isHealthIntakeComplete(p.healthIntake) && validateHealthIntake(p.healthIntake, gender).valid
    return nameOk && phoneOk && healthOk
  })

  return (
    <div>
      <h2 className="text-base font-light mb-0.5" style={{ color: 'var(--text-primary)' }}>اطلاعات افراد</h2>
      <p className="text-xs mb-3 font-light" style={{ color: 'var(--text-muted)' }}>اطلاعات هر نفر را وارد کنید</p>
      <p className="mb-4 rounded-xl border px-3 py-2 text-xs" style={{ borderColor: 'var(--border-base)', color: 'var(--text-muted)' }}>{arrivalNotice}</p>

      <div className="flex flex-col gap-4">
        {persons.map((person, i) => {
          const phone = person.customerPhone
          const phoneTouched = phone.length > 0
          const phoneValid = isValidIranPhone(phone)
          const isPayer = i === 0

          return (
            <div key={i} className="flex flex-col gap-3 rounded-2xl border p-3" style={{ borderColor: 'var(--border-base)', background: 'var(--bg-surface)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                نفر {toFaOrdinal(i + 1)}
                {isPayer && <span className="mr-1 text-[10px]" style={{ color: 'var(--text-faint)' }}>(پرداخت‌کننده — پیامک تأیید ارسال می‌شود)</span>}
              </p>
              <FieldSet className="gap-3 rounded-xl border border-border/70 bg-muted/5 p-3">
                <FieldLegend variant="label">اطلاعات تماس</FieldLegend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="نام و نام خانوادگی *"
                    value={person.customerName}
                    onChange={e => setPerson(i, { customerName: e.target.value })}
                    className="text-right placeholder:text-right placeholder:text-xs"
                  />
                  <div>
                    <Input
                      placeholder={isPayer ? '* شماره موبایل' : 'شماره موبایل (اختیاری)'}
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={e => handlePhoneChange(i, e.target.value)}
                      className={cn(
                        'text-right placeholder:text-right placeholder:text-xs',
                        phoneTouched && !phoneValid && 'border-destructive focus-visible:ring-destructive/30',
                      )}
                    />
                    {phoneTouched && !phoneValid && (
                      <p className="text-[11px] mt-1 pr-1" style={{ color: 'var(--color-destructive, #f87171)' }}>
                        شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود
                      </p>
                    )}
                  </div>
                  <Textarea
                    placeholder="توضیحات (اختیاری)"
                    value={person.customerNotes}
                    onChange={e => setPerson(i, { customerNotes: e.target.value })}
                    className="col-span-full h-14 text-right placeholder:text-right placeholder:text-xs"
                  />
                </div>
              </FieldSet>
              <FieldSet className="gap-3 rounded-xl border border-border/70 bg-muted/5 p-3">
                <FieldLegend variant="label">سلامت و پزشکی</FieldLegend>
                <HealthQuestionnaire
                  person={person}
                  gender={gender}
                  onChange={healthIntake => setPerson(i, { healthIntake })}
                />
              </FieldSet>
            </div>
          )
        })}
      </div>

      <div className="flex gap-3 mt-4">
        <GhostButton onClick={goBack} className="flex-1">→ برگشت</GhostButton>
        <GoldButton onClick={goNext} className="flex-1" disabled={!canProceed}>ادامه ←</GoldButton>
      </div>
    </div>
  )
}
