'use client'
import { createContext, useContext, useState, useCallback } from 'react'
import { BookingDialog } from './BookingDialog'
import type { ServiceDTO } from '@/types'

type CtxValue = { open: () => void; available: boolean }
const Ctx = createContext<CtxValue>({ open: () => {}, available: false })

export function useBookingDialog() {
  return useContext(Ctx)
}

export function BookingDialogProvider({ services, children }: { services: ServiceDTO[]; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  return (
    <Ctx.Provider value={{ open, available: true }}>
      {children}
      <BookingDialog open={isOpen} onClose={close} services={services} />
    </Ctx.Provider>
  )
}
