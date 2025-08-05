'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  FileText, 
  DollarSign, 
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

import { Invoice, InvoiceQueryParams, InvoiceStatistics } from '@/lib/invoice-types'
import { invoiceService } from '@/lib/invoice-service'
import { createColumns } from './columns'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [statistics, setStatistics] = useState<InvoiceStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [statisticsLoading, setStatisticsLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  // 获取发票列表
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true)
      
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
        params.status = statusFilter as any
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

      const response = await invoiceService.getInvoices(params)
      
      if (response.code === 0) {
        setInvoices(response.data.items)
        setTotalCount(response.data.total)
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      console.error('获取发票列表失败:', error)
      toast.error('获取发票列表失败，请稍后重试')
      setInvoices([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, searchQuery, statusFilter, dateFilter])

  // 获取统计信息
  const fetchStatistics = useCallback(async () => {
    try {
      setStatisticsLoading(true)
      const response = await invoiceService.getInvoiceStatistics()
      
      if (response.code === 0) {
        setStatistics(response.data)
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      console.error('获取统计信息失败:', error)
      // 不显示错误提示，统计信息是非关键功能
    } finally {
      setStatisticsLoading(false)
    }
  }, [])

  // 批量下载选中的发票
  const handleBulkDownload = async (selectedInvoices: Invoice[]) => {
    if (selectedInvoices.length === 0) {
      toast.error('请选择要下载的发票')
      return
    }

    try {
      const invoiceIds = selectedInvoices.map(invoice => invoice.id)
      const blob = await invoiceService.bulkDownloadInvoices({
        invoice_ids: invoiceIds,
        format: 'zip'
      })
      
      const filename = `invoices-${new Date().toISOString().split('T')[0]}.zip`
      invoiceService.downloadFile(blob, filename)
      toast.success(`成功下载 ${selectedInvoices.length} 张发票`)
    } catch (error) {
      console.error('批量下载失败:', error)
      toast.error('批量下载失败，请稍后重试')
    }
  }

  // 发票更新回调
  const handleInvoiceUpdated = useCallback(() => {
    fetchInvoices()
    fetchStatistics()
  }, [fetchInvoices, fetchStatistics])

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

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  useEffect(() => {
    fetchStatistics()
  }, [fetchStatistics])

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

    const formatAmount = (amount: number) => 
      invoiceService.formatAmount(amount, statistics.currency)

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总发票数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total_invoices}</div>
            <p className="text-xs text-muted-foreground">
              已发送 {statistics.sent_invoices} | 草稿 {statistics.draft_invoices}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已付款</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.paid_invoices}</div>
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
              {statistics.total_invoices - statistics.paid_invoices - statistics.void_invoices}
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
            <div className="text-2xl font-bold text-red-600">{statistics.overdue_invoices}</div>
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
          <Button asChild>
            <Link href="/finance/invoices/create">
              <Plus className="mr-2 h-4 w-4" />
              创建发票
            </Link>
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
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={invoices}
            loading={loading}
            totalCount={totalCount}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            onBulkAction={handleBulkDownload}
            bulkActionLabel="批量下载"
            bulkActionIcon={<Download className="h-4 w-4" />}
          />
        </CardContent>
      </Card>
    </div>
  )
}