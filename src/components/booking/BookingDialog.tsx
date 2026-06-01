'use client'
import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookingWizard } from './BookingWizard'
import type { ServiceDTO } from '@/types'

type Props = {
  open: boolean
  onClose: () => void
  services: ServiceDTO[]
}

export function BookingDialog({ open, onClose, services }: Props) {
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, handleKey])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Dialog panel */}
          <motion.div
            key="panel"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 pointer-events-none"
          >
            <motion.div
              className="relative w-full sm:max-w-lg max-h-[92dvh] flex flex-col pointer-events-auto
                rounded-t-3xl sm:rounded-3xl
                border border-white/[0.12] shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
              style={{ backgroundColor: 'var(--bg-base)' }}
              initial={{ y: 60, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 60, opacity: 0, scale: 0.97 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header: drag handle + close button — never scrolls away */}
              <div className="flex-shrink-0 flex items-center justify-between px-5 sm:px-7 pt-4 pb-3 border-b"
                style={{ borderColor: 'var(--border-base)' }}>
                {/* Drag handle — visible on mobile */}
                <div className="sm:hidden absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full"
                  style={{ background: 'var(--border-base)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>رزرو نوبت</span>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center border transition-colors text-sm"
                  style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-base)', color: 'var(--text-muted)' }}
                  aria-label="بستن"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable wizard content */}
              <div className="flex-1 overflow-y-auto">
                <BookingWizard services={services} />
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
