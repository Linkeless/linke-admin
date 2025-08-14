'use client'

import { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Plus, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'

import { useOrders, useCancelOrder } from '@/hooks/queries/use-orders'
import { OrderQueryParams } from '@/lib/order-types'
import { createColumns } from './columns'
import { OrderStatsCards } from './components/order-stats-cards'
import { OrderDetailDialog } from './components/order-detail-dialog'
import { CreateOrderDialog } from './components/create-order-dialog'

export default function OrdersPage() {
  // 分页状态
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  // 基础查询参数 - 使用 useMemo 避免重复创建对象
  const queryParams = useMemo<OrderQueryParams>(() => ({
    limit: pagination.pageSize,
    offset: pagination.pageIndex * pagination.pageSize,
  }), [pagination.pageIndex, pagination.pageSize])

  // 对话框状态
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // 使用 React Query hooks
  const { 
    data: ordersResponse, 
    isLoading, 
    error,
    refetch
  } = useOrders(queryParams)

  // 取消订单 mutation
  const cancelOrderMutation = useCancelOrder()

  // 提取订单数据
  const orders = ordersResponse?.data || []
  const totalItems = ordersResponse?.total || 0

  // 处理分页变化
  const handlePaginationChange = useCallback((newPagination: typeof pagination) => {
    setPagination(newPagination)
  }, [])

  // 查看订单详情
  const handleViewDetail = useCallback((orderId: number) => {
    setSelectedOrderId(orderId)
    setShowDetailDialog(true)
  }, [])

  // 订单更新后的回调
  const handleOrderUpdated = useCallback(() => {
    refetch()
  }, [refetch])

  // 取消订单
  const handleCancelOrder = useCallback(async (orderId: number) => {
    if (!confirm('确定要取消此订单吗？')) return

    cancelOrderMutation.mutate({
      id: orderId,
      data: {
        reason: '管理员手动取消',
      }
    })
  }, [cancelOrderMutation])

  // 表格列定义
  const columns = createColumns({
    onViewDetail: handleViewDetail,
    onCancelOrder: handleCancelOrder,
    onOrderUpdated: handleOrderUpdated,
  })

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">订单管理</h1>
          <p className="text-muted-foreground">
            管理系统中的所有订单和支付记录
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            创建订单
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <OrderStatsCards />

      {/* 订单列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">订单列表</CardTitle>
          <CardDescription>
            共 {totalItems} 个订单
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={orders}
            searchKey="order_number"
            searchPlaceholder="搜索订单号..."
            loading={isLoading}
          />
          
          {/* 自定义分页控制 */}
          {totalItems > pagination.pageSize && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-muted-foreground">
                共 {totalItems} 个订单，当前显示第 {pagination.pageIndex + 1} 页
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePaginationChange({
                    ...pagination,
                    pageIndex: Math.max(0, pagination.pageIndex - 1)
                  })}
                  disabled={pagination.pageIndex <= 0}
                >
                  上一页
                </Button>
                <span className="px-3 py-1 text-sm">
                  {pagination.pageIndex + 1} / {Math.ceil(totalItems / pagination.pageSize)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePaginationChange({
                    ...pagination,
                    pageIndex: Math.min(Math.ceil(totalItems / pagination.pageSize) - 1, pagination.pageIndex + 1)
                  })}
                  disabled={pagination.pageIndex >= Math.ceil(totalItems / pagination.pageSize) - 1}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 订单详情对话框 */}
      <OrderDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        orderId={selectedOrderId}
        onOrderUpdated={handleOrderUpdated}
      />

      {/* 创建订单对话框 */}
      <CreateOrderDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onOrderCreated={handleOrderUpdated}
      />
    </div>
  )
}