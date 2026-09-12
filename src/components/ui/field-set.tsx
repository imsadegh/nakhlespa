import * as React from 'react'

import { cn } from '@/lib/utils'

function FieldSet({ className, ...props }: React.ComponentProps<'fieldset'>) {
  return <fieldset data-slot="field-set" className={cn('flex min-w-0 flex-col gap-4', className)} {...props} />
}

function FieldLegend({ className, variant = 'legend', ...props }: React.ComponentProps<'legend'> & { variant?: 'legend' | 'label' }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        variant === 'label' ? 'text-sm font-medium' : 'text-sm font-semibold',
        className,
      )}
      {...props}
    />
  )
}

export { FieldSet, FieldLegend }
