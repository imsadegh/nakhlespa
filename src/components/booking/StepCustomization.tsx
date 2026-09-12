'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldLegend, FieldSet } from '@/components/ui/field-set'
import { GoldButton } from '@/components/ui/GoldButton'
import { GhostButton } from '@/components/ui/GhostButton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { CUSTOMIZATION_FIELD_LABELS, CUSTOMIZATION_OPTIONS, getDefaultCustomization, normalizeCustomization } from '@/lib/booking-customization'
import type { BookingCustomization, CustomizationKey, ServiceDTO, WizardState } from '@/types'

type Props = {
  state: WizardState
  update: (patch: Partial<WizardState>) => void
  goNext: () => void
  goBack: () => void
  services: ServiceDTO[]
  defaultExpanded?: boolean
}

function toPersianNumber(value: number) {
  return String(value).replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)])
}

type ContentProps = Props & {
  isExpanded: boolean
  toggleExpanded: () => void
}

function StepCustomizationContent({ state, update, goNext, goBack, services, isExpanded, toggleExpanded }: ContentProps) {
  const customizablePersons = state.persons.flatMap((person, personIndex) => {
    const serviceTier = services.find(item => item.id === person.serviceId)?.tier
    return serviceTier !== null && serviceTier !== undefined ? [{ person, personIndex }] : []
  })

  function setCustomization(index: number, key: CustomizationKey, value: string) {
    const person = state.persons[index]
    const serviceTier = services.find(service => service.id === person.serviceId)?.tier
    if (key === 'loofah' && serviceTier === 3) return
    const customization = normalizeCustomization(
      { ...(person.customization ?? getDefaultCustomization()), [key]: value } as BookingCustomization,
      serviceTier,
    )
    update({ persons: state.persons.map((item, itemIndex) => itemIndex === index ? { ...item, customization } : item) })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        {customizablePersons.length > 0 ? (
          <>
            <h2 className="text-base font-light text-foreground">سفارشی‌سازی ماساژ</h2>
            <p className="text-xs font-light text-muted-foreground">برای هر نفر انتخاب‌های دلخواه را مشخص کنید</p>
            <Button
              type="button"
              variant="outline"
              aria-expanded={isExpanded}
              aria-controls="booking-customization-panel"
              onClick={toggleExpanded}
              className="mt-3 h-auto w-full justify-between border-primary/30 bg-primary/5 px-4 py-3 text-right hover:border-primary/60 hover:bg-primary/10"
            >
              <span className="flex flex-col items-start gap-0.5">
                <span>{isExpanded ? 'بستن شخصی‌سازی' : 'شخصی‌سازی انتخاب‌ها'}</span>
                {!isExpanded && <span className="text-xs font-normal text-muted-foreground">انتخاب‌های پیش‌فرض فعال هستند</span>}
              </span>
              {isExpanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
            </Button>
          </>
        ) : (
          <p className="text-xs font-light text-muted-foreground">
            {state.persons.map(person => services.find(item => item.id === person.serviceId)?.nameFa).filter(Boolean).join('، ')}؛ این خدمت انتخاب اضافی ندارد.
          </p>
        )}
      </div>

      {isExpanded && <div id="booking-customization-panel" className="flex flex-col gap-4">
      {customizablePersons.map(({ person, personIndex }) => {
        const service = services.find(item => item.id === person.serviceId)
        const tier = service?.tier
        const customization = normalizeCustomization(person.customization ?? getDefaultCustomization(), tier)

        return (
          <Card key={personIndex} size="sm" className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="text-sm">نفر {toPersianNumber(personIndex + 1)}</CardTitle>
              <CardDescription>{service?.nameFa ?? 'انتخاب‌های شما'}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {(Object.keys(CUSTOMIZATION_OPTIONS) as CustomizationKey[]).map(key => {
                const isVipLoofah = key === 'loofah' && tier === 3
                return (
                  <div key={key} className="flex flex-col gap-4">
                  <FieldSet className="gap-3 rounded-xl border border-border/70 bg-muted/5 p-3">
                    <FieldLegend variant="label">{CUSTOMIZATION_FIELD_LABELS[key]}</FieldLegend>
                    <ToggleGroup
                      multiple={false}
                      value={[customization[key]]}
                      onValueChange={values => values[0] && setCustomization(personIndex, key, values[0])}
                      disabled={isVipLoofah}
                      aria-label={CUSTOMIZATION_FIELD_LABELS[key]}
                      className="flex w-full flex-wrap gap-2"
                    >
                      {CUSTOMIZATION_OPTIONS[key].map(option => {
                        const selected = customization[key] === option.value
                        const disabled = (option.value === 'VIP_FREE_NEW' && tier !== 3) || (isVipLoofah && option.value !== 'VIP_FREE_NEW')
                        return (
                          <ToggleGroupItem
                            key={option.value}
                            value={option.value}
                            disabled={disabled}
                            className={cn(
                              'h-auto min-h-9 flex-1 whitespace-normal px-2.5 py-2 text-xs leading-5',
                              selected && 'border-foreground !bg-foreground !text-background shadow-sm hover:!bg-foreground hover:!text-background aria-pressed:!bg-foreground aria-pressed:!text-background data-[state=on]:!bg-foreground data-[state=on]:!text-background',
                            )}
                          >
                            <span className="flex flex-col gap-0.5 text-center">
                              <span>{option.label}</span>
                              {(key !== 'musicGenre' && key !== 'pressureLevel') && (
                                <span className={cn('text-[10px] font-medium', selected ? 'text-primary-foreground/85' : 'text-muted-foreground')}>
                                  {option.additionalPrice ? `+${option.additionalPrice.toLocaleString('fa-IR')} تومان` : 'رایگان'}
                                </span>
                              )}
                              {key === 'poultice' && <span className={cn('text-[10px]', selected ? 'text-primary-foreground/85' : 'text-muted-foreground')}>{option.description}</span>}
                            </span>
                          </ToggleGroupItem>
                        )
                      })}
                    </ToggleGroup>
                  </FieldSet>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )
      })}
      </div>}

      <div className="flex gap-3">
        <GhostButton onClick={goBack} className="flex-1">→ برگشت</GhostButton>
        <GoldButton onClick={goNext} className="flex-1">ادامه ←</GoldButton>
      </div>
    </div>
  )
}

function InteractiveStepCustomization(props: Props) {
  const [isExpanded, setIsExpanded] = useState(false)
  return <StepCustomizationContent {...props} isExpanded={isExpanded} toggleExpanded={() => setIsExpanded(value => !value)} />
}

export function StepCustomization({ defaultExpanded = false, ...props }: Props) {
  if (defaultExpanded) {
    return StepCustomizationContent({ ...props, isExpanded: true, toggleExpanded: () => {} })
  }
  return <InteractiveStepCustomization {...props} />
}
