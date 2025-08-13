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

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "./data-table-pagination"
import { DataTableViewOptions } from "./data-table-view-options"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  // 搜索配置
  searchKey?: string
  searchPlaceholder?: string
  // 初始搜索值（用于从URL或外部状态预填）
  searchDefaultValue?: string
  // 外部监听搜索变化（用于服务端筛选）
  onSearchChange?: (value: string) => void
  // 搜索提交（手动触发）
  onSearchSubmit?: (value: string) => void
  // 搜索模式：instant=输入即搜，manual=手动点击按钮或回车提交
  searchMode?: 'instant' | 'manual'
  // 排序变更（用于服务端排序）
  onSortChange?: (field: string, order: 'asc' | 'desc') => void
  // 排序默认值（用于从URL或外部状态预填）
  sortingDefaultValue?: { id: string; desc: boolean }
  // 选择回调
  onSelectionChange?: (selectedItems: TData[]) => void
  // 是否隐藏内部分页控件（当使用外部/服务端分页时设置为true）
  hideInternalPagination?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "搜索...",
  searchDefaultValue,
  onSearchChange,
  onSearchSubmit,
  searchMode = 'instant',
  onSortChange,
  sortingDefaultValue,
  onSelectionChange,
  hideInternalPagination = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [searchInput, setSearchInput] = React.useState<string>("")

  const table = useReactTable({
    data,
    columns,
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? (updater as any)(sorting) : updater
      setSorting(next)
      const first = next?.[0]
      if (first && onSortChange) {
        onSortChange(first.id, first.desc ? 'desc' : 'asc')
      } else if ((!first || next.length === 0) && onSortChange) {
        // 无排序时通知清空（默认升序可由调用方自行决定）
        onSortChange('', 'asc')
      }
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: hideInternalPagination ? undefined : getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  // 同步外部排序默认值到表格（用于刷新/URL还原）
  React.useEffect(() => {
    if (sortingDefaultValue?.id) {
      setSorting([{ id: sortingDefaultValue.id, desc: sortingDefaultValue.desc }])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortingDefaultValue?.id, sortingDefaultValue?.desc])

  // 初始化/同步手动搜索框的值（支持外部默认值）
  React.useEffect(() => {
    if (!searchKey || searchMode !== 'manual') return
    const initial = searchDefaultValue ?? ((table.getColumn(searchKey)?.getFilterValue() as string) ?? "")
    setSearchInput(initial)
    // 不主动触发表格过滤，等待用户点击“搜索”
  }, [searchDefaultValue, searchKey, searchMode, table])

  const handleSearchSubmit = React.useCallback(() => {
    if (!searchKey) return
    // 同步到表格列过滤
    table.getColumn(searchKey)?.setFilterValue(searchInput)
    // 通知外部（服务端筛选）
    onSearchSubmit?.(searchInput)
  }, [onSearchSubmit, searchInput, searchKey, table])

  // 处理选择变化
  React.useEffect(() => {
    if (onSelectionChange) {
      const selectedRows = table.getFilteredSelectedRowModel().rows
      const selectedItems = selectedRows.map(row => row.original)
      onSelectionChange(selectedItems)
    }
  }, [rowSelection, onSelectionChange, table])

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {searchKey && (
            <>
              {searchMode === 'manual' ? (
                <>
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearchSubmit()
                      }
                    }}
                    className="h-8 w-[150px] lg:w-[250px]"
                  />
                  <Button size="sm" className="h-8" onClick={handleSearchSubmit}>
                    搜索
                  </Button>
                </>
              ) : (
                <Input
                  placeholder={searchPlaceholder}
                  value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                  onChange={(event) => {
                    const value = event.target.value
                    table.getColumn(searchKey)?.setFilterValue(value)
                    onSearchChange?.(value)
                  }}
                  className="h-8 w-[150px] lg:w-[250px]"
                />
              )}
            </>
          )}
        </div>
        <DataTableViewOptions table={table} />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead 
                      key={header.id}
                      className="text-left h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
                    >
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
                  className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id}
                      className="px-4 py-4 text-left align-middle [&:has([role=checkbox])]:pr-0"
                    >
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
      {!hideInternalPagination && <DataTablePagination table={table} />}
    </div>
  )
}