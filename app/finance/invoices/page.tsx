'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Plus,
  Search,
  Download, 
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'

import { useInvoices, useInvoiceStatistics } from '@/hooks/queries/use-invoices'
import { useBulkDownloadInvoices } from '@/hooks/mutations/use-finance-mutations'
import { Invoice, InvoiceQueryParams, InvoiceStatistics, InvoiceStatus } from '@/lib/invoice-types'
import { invoiceService } from '@/lib/invoice-service'
import { createColumns } from './columns'
import { BulkActionsDialog } from './components'

export default function InvoicesPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [selectedInvoices, setSelectedInvoices] = useState<Invoice[]>([])

  // 查询参数
  const queryParams = useMemo<InvoiceQueryParams>(() => {
    const params: InvoiceQueryParams = {
      page: currentPage,
      page_size: pageSize,
      sort_by: 'created_at',
      sort_order: 'desc',
    }

    if (searchQuery.trim()) {
      params.search = searchQuery.trim()
    }

    if (statusFilter !== 'all') {
      params.status = statusFilter as InvoiceStatus
    }

    // 日期筛选
    if (dateFilter !== 'all') {
      const now = new Date()
      let dateFrom: Date
      
      switch (dateFilter) {
        case 'today':
          dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'week':
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          dateFrom = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'quarter':
          dateFrom = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
          break
        default:
          dateFrom = new Date(now.getFullYear(), 0, 1)
      }
      
      params.date_from = dateFrom.toISOString().split('T')[0]
    }

    return params
  }, [currentPage, pageSize, searchQuery, statusFilter, dateFilter])

  // 使用 React Query hooks
  const { 
    data: invoicesResponse, 
    isLoading,
    refetch
  } = useInvoices(queryParams)

  const { 
    data: statisticsResponse, 
    isLoading: statisticsLoading 
  } = useInvoiceStatistics()

  // 提取数据
  const invoices = invoicesResponse?.data?.items || []
  const totalCount = invoicesResponse?.data?.total || 0
  const statistics = statisticsResponse?.data

  // 批量下载 mutation
  const bulkDownloadMutation = useBulkDownloadInvoices()

  // 批量下载选中的发票
  const handleBulkDownload = useCallback(async (invoicesForDownload: Invoice[] = selectedInvoices) => {
    if (invoicesForDownload.length === 0) {
      toast.error('请选择要下载的发票')
      return
    }

    const invoiceIds = invoicesForDownload.map(invoice => invoice.id)
    bulkDownloadMutation.mutate({
      invoice_ids: invoiceIds,
      format: 'zip'
    })
  }, [selectedInvoices, bulkDownloadMutation])

  // 使用ref来存储选择处理函数，避免重新渲染
  const onSelectionChangeRef = useRef<(selectedInvoices: Invoice[]) => void>()
  onSelectionChangeRef.current = (newSelectedInvoices: Invoice[]) => {
    setSelectedInvoices(newSelectedInvoices)
  }

  // 稳定的回调函数引用
  const handleBulkActions = useCallback((newSelectedInvoices: Invoice[]) => {
    onSelectionChangeRef.current?.(newSelectedInvoices)
  }, [])

  // 手动打开批量操作对话框
  const openBulkActions = useCallback(() => {
    if (selectedInvoices.length > 0) {
      setShowBulkActions(true)
    } else {
      toast.error('请选择要操作的发票')
    }
  }, [selectedInvoices.length])

  // 发票更新回调
  const handleInvoiceUpdated = useCallback(() => {
    refetch()
  }, [refetch])

  // 搜索处理
  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  // 筛选处理
  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  const handleDateFilter = (value: string) => {
    setDateFilter(value)
    setCurrentPage(1)
  }


  const columns = createColumns({ onInvoiceUpdated: handleInvoiceUpdated })

  // 渲染统计卡片
  const renderStatisticsCards = () => {
    if (statisticsLoading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    if (!statistics) return null

    const formatAmount = (amount: number | undefined) => {
      if (typeof amount !== 'number' || isNaN(amount)) {
        return '¥0.00'
      }
      return invoiceService.formatAmount(amount, statistics?.currency)
    }

    const safeNumber = (value: number | undefined): number => {
      return typeof value === 'number' && !isNaN(value) ? value : 0
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总发票数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safeNumber(statistics.total_invoices)}</div>
            <p className="text-xs text-muted-foreground">
              已发送 {safeNumber(statistics.sent_invoices)} | 草稿 {safeNumber(statistics.draft_invoices)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已付款</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{safeNumber(statistics.paid_invoices)}</div>
            <p className="text-xs text-muted-foreground">
              {formatAmount(statistics.paid_amount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待付款</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {safeNumber(statistics.total_invoices) - safeNumber(statistics.paid_invoices) - safeNumber(statistics.void_invoices)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatAmount(statistics.pending_amount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">逾期</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{safeNumber(statistics.overdue_invoices)}</div>
            <p className="text-xs text-muted-foreground">
              {formatAmount(statistics.overdue_amount)}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">发票管理</h1>
          <p className="text-muted-foreground">
            管理和跟踪所有发票的状态和付款情况
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline"
            onClick={() => {
              // 这里可以添加批量下载选中发票的逻辑
              // 由于没有选中的发票，我们可以提示用户选择
              toast.info('请在表格中选择要下载的发票，然后使用表格下方的批量操作按钮')
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            批量下载
          </Button>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            创建发票
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      {renderStatisticsCards()}

      {/* 筛选和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">发票列表</CardTitle>
          <CardDescription>
            查看和管理所有发票
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">搜索</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="搜索发票号、客户邮箱..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有状态</SelectItem>
                  <SelectItem value="draft">草稿</SelectItem>
                  <SelectItem value="sent">已发送</SelectItem>
                  <SelectItem value="viewed">已查看</SelectItem>
                  <SelectItem value="paid">已付款</SelectItem>
                  <SelectItem value="overdue">逾期</SelectItem>
                  <SelectItem value="void">作废</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={handleDateFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="时间" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有时间</SelectItem>
                  <SelectItem value="today">今天</SelectItem>
                  <SelectItem value="week">本周</SelectItem>
                  <SelectItem value="month">本月</SelectItem>
                  <SelectItem value="quarter">本季度</SelectItem>
                  <SelectItem value="year">本年</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 发票表格 */}
      <Card>
        <CardContent className="space-y-4">
          {/* 操作按钮行 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {selectedInvoices.length > 0 && (
                <Button
                  variant="outline"
                  onClick={openBulkActions}
                  className="h-8"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  批量操作 ({selectedInvoices.length})
                </Button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkDownload()}
                disabled={selectedInvoices.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                批量下载
              </Button>
            </div>
          </div>

          {/* 数据表格 */}
          <DataTable
            columns={columns}
            data={invoices || []}
            loading={isLoading}
            searchKey="invoice_number"
            searchPlaceholder="搜索发票号..."
            onSelectionChange={handleBulkActions}
          />
          
          {/* 简单分页信息 */}
          {totalCount > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>
                共 {totalCount} 条记录，第 {currentPage} 页，每页 {pageSize} 条
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={currentPage * pageSize >= totalCount}
                >
                  下一页
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 批量操作对话框 */}
      <BulkActionsDialog
        open={showBulkActions}
        onOpenChange={setShowBulkActions}
        selectedInvoices={selectedInvoices}
        onActionComplete={handleInvoiceUpdated}
      />
    </div>
  )
}