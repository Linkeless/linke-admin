"use client"

import * as React from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ResponsiveColumnDef, ColumnPriority } from "./responsive-data-table"

interface DataTableMobileCardProps<TData> {
  data: TData
  columns: ResponsiveColumnDef<TData, any>[]
  title?: string
  subtitle?: string
  renderCard?: () => React.ReactNode
}

export function DataTableMobileCard<TData>({
  data,
  columns,
  title,
  subtitle,
  renderCard,
}: DataTableMobileCardProps<TData>) {
  const [isOpen, setIsOpen] = React.useState(false)

  // 如果提供了自定义渲染函数，使用它
  if (renderCard) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          {renderCard()}
        </CardContent>
      </Card>
    )
  }

  // 按优先级分组列
  const essentialColumns = columns.filter(col => 
    col.priority === ColumnPriority.ESSENTIAL || !col.priority
  )
  const highColumns = columns.filter(col => 
    col.priority === ColumnPriority.HIGH
  )
  const mediumColumns = columns.filter(col => 
    col.priority === ColumnPriority.MEDIUM
  )
  const lowColumns = columns.filter(col => 
    col.priority === ColumnPriority.LOW
  )

  // 渲染单个字段
  const renderField = (column: ResponsiveColumnDef<TData, any>, isInline = false) => {
    if (!column.accessorKey || column.id === 'actions') return null

    const value = (data as any)[column.accessorKey as string]
    const label = column.mobileLabel || (column.accessorKey as string)

    // 获取格式化后的值
    let displayValue = value
    if (column.cell && typeof column.cell === 'function') {
      const context = {
        getValue: () => value,
        row: { original: data, getValue: (key: string) => (data as any)[key] },
        column: { id: column.accessorKey as string },
        cell: { getValue: () => value },
        table: null,
        renderValue: () => value,
      }
      try {
        const cellResult = (column.cell as any)(context)
        if (React.isValidElement(cellResult)) {
          displayValue = cellResult
        }
      } catch (e) {
        // 如果cell函数出错，使用原始值
        displayValue = value
      }
    }

    if (isInline) {
      return (
        <div key={column.accessorKey as string} className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">{label}:</span>
          <div className="text-sm">{displayValue}</div>
        </div>
      )
    }

    return (
      <div key={column.accessorKey as string} className="space-y-1">
        <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
          {label}
        </div>
        <div className="text-sm">{displayValue}</div>
      </div>
    )
  }

  // 获取操作列
  const actionsColumn = columns.find(col => col.id === 'actions')

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            {title && (
              <h3 className="font-semibold leading-none tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          {actionsColumn && (
            <div className="ml-4">
              {actionsColumn.cell && typeof actionsColumn.cell === 'function' && (
                <div>
                  {(actionsColumn.cell as any)({
                    row: { original: data },
                    table: null,
                    column: { id: 'actions' },
                    cell: { getValue: () => null },
                    getValue: () => null,
                    renderValue: () => null,
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* 高优先级信息 - 始终显示 */}
        <div className="space-y-3">
          {essentialColumns.map(column => renderField(column))}
          
          {/* 重要信息 - 内联显示 */}
          {highColumns.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {highColumns.map(column => renderField(column, true))}
            </div>
          )}
        </div>

        {/* 详细信息 - 可展开 */}
        {(mediumColumns.length > 0 || lowColumns.length > 0) && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-4">
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-between p-0 h-8 text-muted-foreground hover:text-foreground"
              >
                <span className="text-sm">
                  {isOpen ? '收起详细信息' : '查看详细信息'}
                </span>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3">
              <div className="border-t pt-3 space-y-3">
                {mediumColumns.map(column => renderField(column))}
                {lowColumns.map(column => renderField(column))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  )
}