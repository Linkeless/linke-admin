"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  // 搜索配置
  searchPlaceholder?: string
  searchColumn?: string
  // 列名映射（用于显示列控制下拉菜单中的中文名称）
  columnNames?: Record<string, string>
  // 分页相关（用于服务端分页）
  pageCount?: number
  manualPagination?: boolean
  // 服务端分页信息
  totalItems?: number
  currentPage?: number
  pageSize?: number
  // 分页控制
  onPaginationChange?: (updater: {pageIndex: number; pageSize: number} | ((prev: {pageIndex: number; pageSize: number}) => {pageIndex: number; pageSize: number})) => void
  // 排序控制
  onSortingChange?: (updater: SortingState | ((prev: SortingState) => SortingState)) => void
  // 筛选控制
  onColumnFiltersChange?: (updater: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState)) => void
  // 行选择控制
  onSelectionChange?: (selectedRows: TData[]) => void
  // 初始状态
  initialSorting?: SortingState
  initialColumnFilters?: ColumnFiltersState
  initialPagination?: { pageIndex: number; pageSize: number }
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "搜索...",
  searchColumn,
  columnNames = {},
  pageCount,
  manualPagination = false,
  totalItems = 0,
  currentPage = 1,
  pageSize = 10,
  onPaginationChange,
  onSortingChange,
  onColumnFiltersChange,
  onSelectionChange,
  initialSorting = [],
  initialColumnFilters = [],
  initialPagination = { pageIndex: 0, pageSize: 10 },
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting)
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(initialColumnFilters)
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [pagination, setPagination] = React.useState(initialPagination)

  const table = useReactTable({
    data,
    columns,
    onSortingChange: onSortingChange || setSorting,
    onColumnFiltersChange: onColumnFiltersChange || setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: onPaginationChange || setPagination,
    manualPagination,
    pageCount: pageCount ?? -1,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  })

  // 当选择变更时通知父组件
  React.useEffect(() => {
    if (onSelectionChange) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original)
      onSelectionChange(selectedRows)
    }
  }, [rowSelection, onSelectionChange, table])

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        {searchColumn && (
          <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchColumn)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(searchColumn)?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              列 <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {columnNames[column.id] || column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  暂无数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {manualPagination ? (
            <>
              显示第 {(currentPage - 1) * pageSize + 1} 到 {Math.min(currentPage * pageSize, totalItems)} 项，共 {totalItems} 项
              {table.getFilteredSelectedRowModel().rows.length > 0 && (
                <span className="ml-2 font-medium">
                  已选择 {table.getFilteredSelectedRowModel().rows.length} 行
                </span>
              )}
            </>
          ) : (
            <>
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </>
          )}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            下一页
          </Button>
        </div>
      </div>
    </div>
  )
}