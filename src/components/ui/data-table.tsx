import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type Column<T> = {
  key: keyof T | string
  header: string
  render?: (row: T) => ReactNode
  className?: string
}

type DataTableProps<T> = {
  columns: Column<T>[]
  data: T[]
  emptyMessage?: string
  className?: string
  rowKey?: (row: T, index: number) => string
}

const DataTable = <T extends Record<string, any>>({
  columns,
  data,
  emptyMessage = "No records found.",
  className,
  rowKey
}: DataTableProps<T>) => {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key.toString()}
                className={cn(
                  "px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white text-slate-900">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-8 text-center text-slate-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={rowKey ? rowKey(row, index) : `${index}`}
                className="transition hover:bg-slate-50"
              >
                {columns.map((column) => (
                  <td
                    key={column.key.toString()}
                    className={cn("px-5 py-4 text-sm text-slate-700", column.className)}
                  >
                    {column.render ? column.render(row) : (row[column.key as keyof T] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable


