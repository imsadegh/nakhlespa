"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { GlassCard } from "@/components/ui/GlassCard"
import { Columns3, Search } from "lucide-react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  initialColumnVisibility: VisibilityState
}

export function BookingsDataTable<TData, TValue>({
  columns,
  data,
  initialColumnVisibility,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "bookedAt", desc: true }])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(initialColumnVisibility)

  React.useEffect(() => {
    document.cookie = `admin-bookings-column-visibility=${encodeURIComponent(JSON.stringify(columnVisibility))}; Path=/admin/bookings; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`
  }, [columnVisibility])

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters, columnVisibility },
    initialState: { pagination: { pageSize: 20 } },
  })

  return (
    <div className="space-y-4">
      <GlassCard className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="relative w-full sm:max-w-sm">
            <Search aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2" style={{ color: "var(--text-faint)" }} />
            <Input
              aria-label="جستجو بر اساس نام مشتری"
              placeholder="جستجو بر اساس نام مشتری..."
              value={(table.getColumn("customerName")?.getFilterValue() as string) ?? ""}
              onChange={(e) => table.getColumn("customerName")?.setFilterValue(e.target.value)}
              className="h-10 w-full pr-10 text-sm"
            />
          </div>
          <Popover>
            <PopoverTrigger render={<Button variant="outline" className="h-10 gap-2 px-4 text-sm" />}>
              <Columns3 aria-hidden="true" className="size-4" /> ستون‌ها
            </PopoverTrigger>
            <PopoverContent align="end" className="w-52">
              <p className="px-1 pb-1 text-xs font-medium" style={{ color: "var(--text-muted)" }}>نمایش ستون‌ها</p>
              {table.getAllLeafColumns().filter(column => column.getCanHide()).map(column => (
                <label key={column.id} className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-2 text-sm hover:bg-white/5">
                  <Checkbox
                    checked={column.getIsVisible()}
                    onCheckedChange={value => column.toggleVisibility(!!value)}
                  />
                  <span>{({ bookedAt: "زمان ثبت", date: "تاریخ رزرو", customerName: "مشتری", serviceNameFa: "سرویس", status: "وضعیت" } as Record<string, string>)[column.id] ?? column.id}</span>
                </label>
              ))}
            </PopoverContent>
          </Popover>
        </div>

        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b bg-white/[0.025] hover:bg-transparent"
                style={{ borderColor: "var(--border-base)" }}
              >
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-12 whitespace-nowrap px-4 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-b transition-colors hover:bg-white/[0.035]"
                  style={{ borderColor: "var(--border-base)" }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-4 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getVisibleLeafColumns().length}
                  className="h-32 text-sm"
                  style={{ color: "var(--text-faint)" }}
                >
                  رزروی یافت نشد.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </GlassCard>

      {/* Pagination */}
      <GlassCard className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
          {table.getFilteredRowModel().rows.length.toLocaleString('fa-IR')} رزرو
        </span>
        <div className="flex items-center justify-between gap-2 sm:justify-start">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            قبلی
          </Button>
          <span className="min-w-16 text-center text-sm tabular-nums" style={{ color: "var(--text-muted)" }}>
            {(table.getState().pagination.pageIndex + 1).toLocaleString('fa-IR')} / {table.getPageCount().toLocaleString('fa-IR')}
          </span>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            بعدی
          </Button>
        </div>
      </GlassCard>
    </div>
  )
}
