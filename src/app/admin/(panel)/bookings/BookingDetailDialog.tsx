"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BookingStatus } from "@prisma/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { BookingRow } from "./columns"

const statusLabel: Record<BookingStatus, string> = {
  PENDING_PAYMENT: "در انتظار پرداخت",
  PAID: "پرداخت شده",
  CONFIRMED: "تأیید شده",
  CANCELLED: "لغو شده",
}

const statusStyle: Record<BookingStatus, string> = {
  PENDING_PAYMENT: "bg-yellow-400/10 text-yellow-400",
  PAID: "bg-[rgba(198,165,91,0.15)] text-[#C6A55B]",
  CONFIRMED: "bg-[rgba(31,94,70,0.3)] text-[#4F6F52]",
  CANCELLED: "bg-red-400/10 text-red-400",
}

export function BookingDetailDialog({ booking }: { booking: BookingRow & { endTime: string; notes: string | null; refId: string | null } }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState<BookingStatus>(booking.status)

  async function updateStatus(next: BookingStatus) {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) { setError("بروزرسانی ناموفق بود"); return }
      setStatus(next)
      router.refresh()
    } catch {
      setError("خطا در اتصال به سرور")
    } finally {
      setLoading(false)
    }
  }

  const fields: [string, string][] = [
    ["نام", booking.customerName],
    ["موبایل", booking.customerPhone],
    ["خدمت", booking.serviceNameFa],
    ["تاریخ", booking.date],
    ["ساعت", `${booking.startTime} — ${booking.endTime}`],
    ["توضیحات", booking.notes ?? "—"],
    ["کد پیگیری", booking.refId ?? "—"],
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            className="text-[11px] px-3 py-1 rounded-md transition-colors hover:bg-white/10 cursor-pointer"
            style={{ color: "var(--text-muted)" }}
          />
        }
      >
        جزئیات
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>جزئیات رزرو</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2.5 py-2">
          {fields.map(([label, value]) => (
            <div key={label} className="flex justify-between items-start gap-4">
              <span className="text-xs flex-shrink-0" style={{ color: "var(--text-faint)" }}>{label}</span>
              <span className="text-xs text-end" style={{ color: "var(--text-primary)" }}>{value}</span>
            </div>
          ))}
          <div className="flex justify-between items-center gap-4">
            <span className="text-xs flex-shrink-0" style={{ color: "var(--text-faint)" }}>وضعیت</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusStyle[status]}`}>
              {statusLabel[status]}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t" style={{ borderColor: "var(--border-base)" }}>
          {error && <p className="text-destructive text-xs text-center">{error}</p>}
          <div className="flex gap-2">
            {status !== BookingStatus.CONFIRMED && status !== BookingStatus.CANCELLED && (
              <Button variant="gold" disabled={loading} onClick={() => updateStatus(BookingStatus.CONFIRMED)} className="flex-1 rounded-xl">
                تأیید رزرو
              </Button>
            )}
            {status !== BookingStatus.CANCELLED && (
              <Button variant="ghost" disabled={loading} onClick={() => updateStatus(BookingStatus.CANCELLED)} className="flex-1 rounded-xl text-destructive hover:text-destructive">
                لغو رزرو
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
