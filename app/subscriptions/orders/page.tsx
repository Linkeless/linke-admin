'use client'

import { useCallback, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ShoppingCart, Filter, Download, RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { createOrderColumns } from "./components/order-columns"
import { OrderFilters } from "./components/order-filters"
import { OrderStatsCards } from "./components/order-stats-cards"
import { useOrders } from "@/hooks/queries/use-orders"

export default function SubscriptionOrdersPage() {
  const [filters, setFilters] = useState({
    status: '',
    payment_method: '',
    date_from: '',
    date_to: ''
  })
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // 使用React Query hooks
  const { 
    data: ordersResponse, 
    isLoading: loading, 
    error, 
    refetch 
  } = useOrders({
    ...filters,
    offset: (currentPage - 1) * pageSize,
    limit: pageSize,
    enabled: true
  })

  // 提取数据
  const orders = ordersResponse?.items || []
  const totalItems = ordersResponse?.total || 0
  const stats = ordersResponse?.stats || {
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0,
    totalRevenue: 0
  }

  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters)
    setCurrentPage(1) // 重置到第一页
  }, [])

  const handleOrderUpdated = useCallback(() => {
    // React Query会自动重新获取数据
    refetch()
  }, [refetch])

  const handleExportOrders = useCallback(() => {
    // 模拟导出功能
    console.log('导出订单数据:', { filters, orders })
    // 实际项目中这里会调用导出API
  }, [filters, orders])

  // 处理分页变化
  const handlePaginationChange = useCallback((updater: any) => {
    const newPagination = typeof updater === 'function' 
      ? updater({ pageIndex: currentPage - 1, pageSize })
      : updater
    const newPage = newPagination.pageIndex + 1
    const newPageSize = newPagination.pageSize
    
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize)
      setCurrentPage(1)
    } else if (newPage !== currentPage) {
      setCurrentPage(newPage)
    }
  }, [currentPage, pageSize])

  // 错误处理
  if (error) {
    return (
      <div className="flex flex-col">
        <PageHeader 
          title="订阅订单管理" 
          description="管理所有订阅相关的订单，包括支付状态、订单详情等"
        />
        <main className="flex-1 p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-destructive mb-4">加载订单数据失败</p>
                <Button onClick={() => refetch()} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  重试
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="订阅订单管理" 
        description="管理所有订阅相关的订单，包括支付状态、订单详情等"
      >
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportOrders}
            disabled={loading}
          >
            <Download className="mr-2 h-4 w-4" />
            导出数据
          </Button>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新数据
          </Button>
        </div>
      </PageHeader>
      
      <main className="flex-1 p-6">
        <div className="space-y-6">
          {/* 统计卡片 */}
          <OrderStatsCards stats={stats} loading={loading} />

          {/* 筛选器 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                筛选条件
              </CardTitle>
              <CardDescription>
                使用筛选条件快速找到特定的订单
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrderFilters 
                filters={filters}
                onFiltersChange={handleFilterChange}
                disabled={loading}
              />
            </CardContent>
          </Card>

          {/* 订单列表 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                订单列表
              </CardTitle>
              <CardDescription>
                共 {totalItems} 个订单
                {Object.values(filters).some(v => v) && ' (已筛选)'}
                {loading && ' (加载中...)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <p>加载中...</p>
                  </div>
                </div>
              ) : (
                <DataTable 
                  columns={createOrderColumns({ 
                    onOrderUpdated: handleOrderUpdated
                  })} 
                  data={orders}
                  searchKey="order_number"
                  searchPlaceholder="搜索订单号..."
                  manualPagination={true}
                  pageCount={Math.ceil(totalItems / pageSize)}
                  totalItems={totalItems}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  initialPagination={{ pageIndex: currentPage - 1, pageSize }}
                  onPaginationChange={handlePaginationChange}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}