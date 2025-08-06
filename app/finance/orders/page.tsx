'use client'

import { useEffect, useState, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Plus } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"

import { orderService } from "@/lib/order-service"
import { SubscriptionOrderResponse } from "@/lib/order-types"
import { createColumns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { OrderStatsCards } from "@/components/finance/orders/order-stats-cards"
import { OrderFilters } from "@/components/finance/orders/order-filters"
import { OrderDetailDialog, CreateOrderDialog } from "./components"

export default function OrdersPage() {
  const [orders, setOrders] = useState<SubscriptionOrderResponse[]>([])
  const [loading, setLoading] = useState(true)
  
  // 分页状态 - 使用基于页码的分页（shadcn/ui标准）
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)

  // 筛选状态
  const [filters, setFilters] = useState({
    status: 'all',
    order_type: 'all',
    payment_method: 'all',
    payment_gateway: 'all',
    search: '',
    start_date: '',
    end_date: '',
  })

  // 对话框状态
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)

  const loadData = useCallback(async (page: number = 1, limit: number = 10, currentFilters = filters) => {
    try {
      setLoading(true)
      
      // 将页码转换为offset
      const offset = (page - 1) * limit
      
      // 构建查询参数
      const queryParams: Record<string, string | number> = {
        offset: offset,
        limit: limit,
        sort_by: 'created_at',
        sort_order: 'desc',
      }

      // 添加筛选条件
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && value !== '' && value !== 'all') {
          // 映射参数名称以匹配API规范
          if (key === 'start_date') {
            queryParams.date_from = value
          } else if (key === 'end_date') {
            queryParams.date_to = value
          } else {
            queryParams[key] = value
          }
        }
      })
      
      const response = await orderService.getOrders(queryParams)
      
      console.log('Orders API Response:', response) // 调试信息
      
      if (response.code === 0 && response.data) {
        setOrders(response.data || [])
        setTotalItems(response.total || 0)
        setCurrentPage(page)
      } else {
        console.error('API返回错误:', response)
        setOrders([])
        setTotalItems(0)
      }
    } catch (error) {
      console.error('加载订单列表失败:', error)
      setOrders([])
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const handleOrderUpdated = useCallback(() => {
    // 重新加载订单列表
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

  const handleFiltersChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters)
    setCurrentPage(1) // 重置到第一页
    loadData(1, pageSize, newFilters)
  }, [loadData, pageSize])

  const handleViewDetail = useCallback((orderId: number) => {
    setSelectedOrderId(orderId)
    setShowDetailDialog(true)
  }, [])

  useEffect(() => {
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="订单管理" 
        description="管理系统订单和支付记录"
        action={
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            创建订单
          </Button>
        }
      />
      
      <main className="flex-1 p-6">
        <div className="space-y-6">
          {/* 订单统计卡片 */}
          <OrderStatsCards />

          {/* 筛选器 */}
          <OrderFilters onFiltersChange={handleFiltersChange} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                订单列表
              </CardTitle>
              <CardDescription>
                共 {totalItems} 个订单
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">加载中...</p>
                </div>
              ) : (
                <>
                  {/* 数据表格（支持服务端分页） */}
                  <DataTable 
                    columns={createColumns({ 
                      onOrderUpdated: handleOrderUpdated,
                      onViewDetail: handleViewDetail
                    })} 
                    data={orders}
                    searchPlaceholder="搜索订单..."
                    searchColumn="id"
                    columnNames={{
                      id: 'ID',
                      subscription_plan: '订阅计划',
                      user: '用户',
                      status: '状态',
                      amount: '金额',
                      payment_method: '支付方式',
                      payment_gateway: '支付网关',
                      order_type: '订单类型',
                      created_at: '创建时间',
                    }}
                    manualPagination={true}
                    pageCount={Math.ceil(totalItems / pageSize)}
                    totalItems={totalItems}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    initialPagination={{ pageIndex: currentPage - 1, pageSize }}
                    onPaginationChange={(updater) => {
                      const newPagination = typeof updater === 'function' 
                        ? updater({ pageIndex: currentPage - 1, pageSize })
                        : updater
                      const newPage = newPagination.pageIndex + 1
                      const newPageSize = newPagination.pageSize
                      
                      if (newPageSize !== pageSize) {
                        setPageSize(newPageSize)
                        setCurrentPage(1)
                        loadData(1, newPageSize)
                      } else if (newPage !== currentPage) {
                        loadData(newPage, pageSize)
                      }
                    }}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* 对话框 */}
      <CreateOrderDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onOrderCreated={handleOrderUpdated}
      />
      
      <OrderDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        orderId={selectedOrderId}
        onOrderUpdated={handleOrderUpdated}
      />
    </div>
  )
}