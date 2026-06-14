'use client'
import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { StepProgress } from './StepProgress'
import { Step1Service } from './Step1Service'
import { Step2DateTime } from './Step2DateTime'
import { Step3Details } from './Step3Details'
import { Step4Review } from './Step4Review'
import type { ServiceDTO, AddonDTO, BookingCreateInput } from '@/types'

export type WizardState = Partial<BookingCreateInput> & {
  endTime?: string
  addonIds: string[]
}

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

export function BookingWizard({ services }: { services: ServiceDTO[] }) {
  const [step, setStep] = useState(1)
  const [dir, setDir] = useState(1)
  const [state, setState] = useState<WizardState>({ addonIds: [] })
  const [addons, setAddons] = useState<AddonDTO[]>([])

  useEffect(() => {
    fetch('/api/addons')
      .then(r => r.json())
      .then(setAddons)
      .catch(() => {})
  }, [])

  function goNext() { setDir(1); setStep(s => s + 1) }
  function goBack() { setDir(-1); setStep(s => s - 1) }
  const update = useCallback((patch: Partial<WizardState>) => setState(s => ({ ...s, ...patch })), [])

  const stepProps = { state, update, goNext, goBack, services, addons }

  return (
    <div className="px-4 sm:px-5 pt-4 pb-5">
      <StepProgress current={step} total={4} />
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={step}
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          {step === 1 && <Step1Service {...stepProps} />}
          {step === 2 && <Step2DateTime {...stepProps} />}
          {step === 3 && <Step3Details {...stepProps} />}
          {step === 4 && <Step4Review {...stepProps} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
