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
import { DataTableMobileCard } from "./data-table-mobile-card"
import { useMediaQuery } from "@/hooks/use-mobile"

// 列优先级定义
export enum ColumnPriority {
  ESSENTIAL = 1,    // 必须显示（名称、状态、操作）
  HIGH = 2,         // 重要信息（倍率、服务器组）
  MEDIUM = 3,       // 中等信息（加密方式、混淆方式）
  LOW = 4,          // 详细信息（创建时间、标签、父服务器）
}

export interface ResponsiveColumnDef<TData, TValue> extends ColumnDef<TData, TValue> {
  priority?: ColumnPriority
  mobileLabel?: string // 移动端显示的标签
}

interface ResponsiveDataTableProps<TData, TValue> {
  columns: ResponsiveColumnDef<TData, TValue>[]
  data: TData[]
  // 搜索配置
  searchPlaceholder?: string
  searchColumn?: string
  // 列名映射
  columnNames?: Record<string, string>
  // 分页相关
  pageCount?: number
  manualPagination?: boolean
  totalItems?: number
  currentPage?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  // 移动端配置
  mobileTitle?: (item: TData) => string
  mobileSubtitle?: (item: TData) => string
  mobileRenderCard?: (item: TData, index: number) => React.ReactNode
}

export function ResponsiveDataTable<TData, TValue>({
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
  onPageChange,
  onPageSizeChange,
  mobileTitle,
  mobileSubtitle,
  mobileRenderCard,
}: ResponsiveDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  // 响应式断点检测
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const isTablet = useMediaQuery("(min-width: 768px)")
  const isMobile = !useMediaQuery("(min-width: 640px)")

  // 根据屏幕尺寸过滤列
  const getVisibleColumns = React.useMemo(() => {
    if (isDesktop) {
      // 桌面端显示所有列
      return columns
    } else if (isTablet) {
      // 平板端隐藏低优先级列
      return columns.filter(col => 
        !col.priority || col.priority <= ColumnPriority.MEDIUM
      )
    } else {
      // 移动端只显示高优先级列
      return columns.filter(col => 
        !col.priority || col.priority <= ColumnPriority.HIGH
      )
    }
  }, [columns, isDesktop, isTablet])

  const table = useReactTable({
    data,
    columns: getVisibleColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    manualPagination,
    pageCount: manualPagination ? Math.ceil(totalItems / pageSize) : -1,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: manualPagination
        ? { pageIndex: currentPage - 1, pageSize }
        : undefined,
    },
  })

  // 移动端使用卡片布局
  if (isMobile) {
    return (
      <div className="w-full space-y-4">
        {/* 搜索栏 */}
        <div className="flex items-center space-x-2">
          {searchColumn && (
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchColumn)?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn(searchColumn)?.setFilterValue(event.target.value)
              }
              className="flex-1"
            />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ChevronDown className="h-4 w-4" />
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

        {/* 移动端卡片列表 */}
        <div className="space-y-3">
          {data.map((item, index) => (
            <DataTableMobileCard
              key={index}
              data={item}
              columns={columns}
              title={mobileTitle?.(item)}
              subtitle={mobileSubtitle?.(item)}
              renderCard={mobileRenderCard ? () => mobileRenderCard(item, index) : undefined}
            />
          ))}
        </div>

        {/* 移动端分页 */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {manualPagination ? (
              `共 ${totalItems} 项`
            ) : (
              `共 ${data.length} 项`
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (manualPagination && onPageChange && currentPage > 1) {
                  onPageChange(currentPage - 1)
                } else {
                  table.previousPage()
                }
              }}
              disabled={manualPagination ? currentPage <= 1 : !table.getCanPreviousPage()}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (manualPagination && onPageChange && currentPage < Math.ceil(totalItems / pageSize)) {
                  onPageChange(currentPage + 1)
                } else {
                  table.nextPage()
                }
              }}
              disabled={manualPagination ? currentPage >= Math.ceil(totalItems / pageSize) : !table.getCanNextPage()}
            >
              下一页
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 桌面端和平板端使用表格布局
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

      {/* 响应式提示 */}
      {!isDesktop && (
        <div className="mb-4 text-sm text-muted-foreground">
          {isTablet ? "平板模式 - 部分列已隐藏" : "移动模式 - 显示精简版"}
        </div>
      )}

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
                  className="hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
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
                  colSpan={getVisibleColumns.length}
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
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (manualPagination && onPageChange && currentPage > 1) {
                onPageChange(currentPage - 1)
              } else {
                table.previousPage()
              }
            }}
            disabled={manualPagination ? currentPage <= 1 : !table.getCanPreviousPage()}
          >
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (manualPagination && onPageChange && currentPage < Math.ceil(totalItems / pageSize)) {
                onPageChange(currentPage + 1)
              } else {
                table.nextPage()
              }
            }}
            disabled={manualPagination ? currentPage >= Math.ceil(totalItems / pageSize) : !table.getCanNextPage()}
          >
            下一页
          </Button>
        </div>
      </div>
    </div>
  )
}