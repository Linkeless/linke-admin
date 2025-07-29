// 分页组件 - 使用shadcn/ui组件

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  className?: string
}

export function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onPageSizeChange,
  className
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < totalPages

  const goToFirstPage = () => onPageChange(1)
  const goToPreviousPage = () => onPageChange(currentPage - 1)
  const goToNextPage = () => onPageChange(currentPage + 1)
  const goToLastPage = () => onPageChange(totalPages)

  // 生成页码按钮
  const getPageNumbers = () => {
    const pageNumbers = []
    const delta = 2 // 当前页前后显示的页数

    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      pageNumbers.push(i)
    }

    return pageNumbers
  }

  if (totalItems === 0) {
    return null
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* 显示信息 */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div>
          显示 {startItem} - {endItem} 条，共 {totalItems} 条
        </div>
        
        {/* 每页条数选择 */}
        <div className="flex items-center gap-2">
          <span>每页</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => onPageSizeChange(parseInt(value))}
          >
            <SelectTrigger className="w-16 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span>条</span>
        </div>
      </div>

      {/* 分页控件 */}
      <div className="flex items-center gap-1">
        {/* 首页 */}
        <Button
          variant="outline"
          size="sm"
          onClick={goToFirstPage}
          disabled={!canGoPrevious}
          className="h-8 w-8 p-0"
        >
          <ChevronsLeft className="h-4 w-4" />
          <span className="sr-only">首页</span>
        </Button>

        {/* 上一页 */}
        <Button
          variant="outline"
          size="sm"
          onClick={goToPreviousPage}
          disabled={!canGoPrevious}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">上一页</span>
        </Button>

        {/* 页码按钮 */}
        {getPageNumbers().map((pageNum) => (
          <Button
            key={pageNum}
            variant={pageNum === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(pageNum)}
            className="h-8 w-8 p-0"
          >
            {pageNum}
          </Button>
        ))}

        {/* 下一页 */}
        <Button
          variant="outline"
          size="sm"
          onClick={goToNextPage}
          disabled={!canGoNext}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">下一页</span>
        </Button>

        {/* 末页 */}
        <Button
          variant="outline"
          size="sm"
          onClick={goToLastPage}
          disabled={!canGoNext}
          className="h-8 w-8 p-0"
        >
          <ChevronsRight className="h-4 w-4" />
          <span className="sr-only">末页</span>
        </Button>
      </div>
    </div>
  )
}