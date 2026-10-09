"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { BookingStatus, Gender } from '@/db/schema'
import type { BookingCustomization } from '@/types'
import type { HealthIntake } from '@/lib/health-intake'
import { ArrowDown, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BookingDetailDialog } from "./BookingDetailDialog"

export type BookingAddonRow = {
  nameFa: string
  pricePaid: number
}

export type BookingCustomizationPriceRow = {
  labelSnapshot: string
  pricePaid: number
}

export type BookingRow = {
  id: string
  bookingCode: string
  bookedAt: number
  date: string        // fa-IR formatted
  startTime: string
  endTime: string
  customerName: string
  customerPhone: string
  serviceNameFa: string
  servicePrice: number
  addonsPricePaid: number
  addons: BookingAddonRow[]
  customizations: BookingCustomizationPriceRow[]
  status: BookingStatus
  notes: string | null
  refId: string | null
  gender: Gender
  discountAmount: number
  discountCode: { code: string } | null
  customization: BookingCustomization | null
  healthIntake: HealthIntake | null
}

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

export const columns: ColumnDef<BookingRow>[] = [
  {
    accessorKey: "bookedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className={`rounded-md px-2 font-medium ${column.getIsSorted() ? "bg-[#C6A55B]/10 text-[#C6A55B]" : "px-0"}`}
        style={{ color: column.getIsSorted() ? "#C6A55B" : "var(--text-muted)" }}
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        زمان ثبت
        {column.getIsSorted() === "asc" ? <ArrowUp className="mr-1 h-3 w-3" /> : column.getIsSorted() === "desc" ? <ArrowDown className="mr-1 h-3 w-3" /> : <ArrowUp className="mr-1 h-3 w-3 opacity-40" />}
      </Button>
    ),
    cell: ({ row }) => (
      <span className="tabular-nums text-xs" style={{ color: "var(--text-muted)" }}>
        {new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Tehran" }).format(row.original.bookedAt)}
      </span>
    ),
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className={`rounded-md px-2 font-medium ${column.getIsSorted() ? "bg-[#C6A55B]/10 text-[#C6A55B]" : "px-0"}`}
        style={{ color: column.getIsSorted() ? "#C6A55B" : "var(--text-muted)" }}
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        تاریخ
        {column.getIsSorted() === "asc" ? <ArrowUp className="mr-1 h-3 w-3" /> : column.getIsSorted() === "desc" ? <ArrowDown className="mr-1 h-3 w-3" /> : <ArrowUp className="mr-1 h-3 w-3 opacity-40" />}
      </Button>
    ),
    cell: ({ row }) => (
      <span className="tabular-nums text-[#C6A55B]">
        {row.getValue("date")} {row.original.startTime.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d])}
      </span>
    ),
  },
  {
    accessorKey: "customerName",
    header: () => <span style={{ color: "var(--text-muted)" }}>مشتری</span>,
    cell: ({ row }) => (
      <div>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
            {row.getValue("customerName")}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
            row.original.gender === 'FEMALE'
              ? 'bg-pink-400/10 text-pink-400'
              : 'bg-blue-400/10 text-blue-400'
          }`}>
            {row.original.gender === 'FEMALE' ? 'خانم' : 'آقا'}
          </span>
        </div>
        <div className="text-[11px]" style={{ color: "var(--text-faint)" }}>
          {row.original.customerPhone}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "serviceNameFa",
    header: () => <span style={{ color: "var(--text-muted)" }}>سرویس</span>,
    cell: ({ row }) => (
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
        {row.getValue("serviceNameFa")}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className={`rounded-md px-2 font-medium ${column.getIsSorted() ? "bg-[#C6A55B]/10 text-[#C6A55B]" : "px-0"}`}
        style={{ color: column.getIsSorted() ? "#C6A55B" : "var(--text-muted)" }}
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        وضعیت
        {column.getIsSorted() === "asc" ? <ArrowUp className="mr-1 h-3 w-3" /> : column.getIsSorted() === "desc" ? <ArrowDown className="mr-1 h-3 w-3" /> : <ArrowUp className="mr-1 h-3 w-3 opacity-40" />}
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as BookingStatus
      return (
        <span className={`text-xs px-2.5 py-1 rounded-full ${statusStyle[status]}`}>
          {statusLabel[status]}
        </span>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <BookingDetailDialog booking={row.original} />,
    enableHiding: false,
  },
]
