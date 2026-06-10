'use client'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { BookingWizard } from './BookingWizard'
import type { ServiceDTO } from '@/types'

type Props = {
  open: boolean
  onClose: () => void
  services: ServiceDTO[]
}

export function BookingDialog({ open, onClose, services }: Props) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="w-full sm:max-w-lg max-h-[92dvh] flex flex-col p-0 overflow-hidden
          rounded-t-3xl sm:rounded-3xl border border-white/[0.12]"
        style={{ backgroundColor: 'var(--bg-base)' }}
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">رزرو آنلاین</DialogTitle>
        {/* Header: drag handle + close button */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-5 pt-3 pb-2.5 border-b"
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
      </DialogContent>
    </Dialog>
  )
}
