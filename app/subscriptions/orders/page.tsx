'use client'

import { useEffect, useState, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ShoppingCart, Filter, Download } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { 
  OrderDetail,
  ORDER_STATUS_CONFIG 
} from "@/lib/subscription-types"
import { createOrderColumns } from "./components/order-columns"
import { OrderFilters } from "./components/order-filters"
import { OrderStatsCards } from "./components/order-stats-cards"

export default function SubscriptionOrdersPage() {
  const [orders, setOrders] = useState<OrderDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    payment_method: '',
    date_from: '',
    date_to: ''
  })
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)

  // 模拟数据加载
  const loadData = useCallback(async (page: number = 1, limit: number = 10) => {
    try {
      setLoading(true)
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 模拟订单数据
      const mockOrders: OrderDetail[] = [
        {
          id: 10001,
          user_id: 1001,
          subscription_plan_id: 2001,
          order_number: 'ORD-2024-001',
          status: 'completed',
          amount: 299.00,
          currency: 'CNY',
          payment_method: '支付宝',
          payment_status: 'completed',
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T10:35:00Z',
          completed_at: '2024-01-15T10:35:00Z',
          notes: '用户升级到专业版',
          user: {
            id: 1001,
            email: 'john@example.com',
            username: 'john_doe',
            name: 'John Doe'
          },
          subscription_plan: {
            id: 2001,
            name: '专业版月付',
            price: 299.00,
            currency: 'CNY',
            billing_cycle: 'monthly'
          },
          payment_transactions: [
            {
              id: 30001,
              order_id: 10001,
              transaction_id: 'TXN_2024_001',
              payment_method: '支付宝',
              amount: 299.00,
              currency: 'CNY',
              status: 'completed',
              created_at: '2024-01-15T10:30:00Z',
              updated_at: '2024-01-15T10:35:00Z'
            }
          ]
        },
        {
          id: 10002,
          user_id: 1002,
          subscription_plan_id: 2002,
          order_number: 'ORD-2024-002',
          status: 'pending',
          amount: 99.00,
          currency: 'CNY',
          payment_method: '微信支付',
          payment_status: 'pending',
          created_at: '2024-01-14T15:20:00Z',
          updated_at: '2024-01-14T15:20:00Z',
          notes: '等待支付确认',
          user: {
            id: 1002,
            email: 'jane@example.com',
            username: 'jane_smith',
            name: 'Jane Smith'
          },
          subscription_plan: {
            id: 2002,
            name: '基础版月付',
            price: 99.00,
            currency: 'CNY',
            billing_cycle: 'monthly'
          },
          payment_transactions: [
            {
              id: 30002,
              order_id: 10002,
              transaction_id: 'TXN_2024_002',
              payment_method: '微信支付',
              amount: 99.00,
              currency: 'CNY',
              status: 'pending',
              created_at: '2024-01-14T15:20:00Z',
              updated_at: '2024-01-14T15:20:00Z'
            }
          ]
        },
        {
          id: 10003,
          user_id: 1003,
          subscription_plan_id: 2003,
          order_number: 'ORD-2024-003',
          status: 'failed',
          amount: 599.00,
          currency: 'CNY',
          payment_method: '信用卡',
          payment_status: 'failed',
          created_at: '2024-01-13T09:15:00Z',
          updated_at: '2024-01-13T09:20:00Z',
          notes: '信用卡支付失败，需要用户重新尝试',
          user: {
            id: 1003,
            email: 'bob@example.com',
            username: 'bob_wilson',
            name: 'Bob Wilson'
          },
          subscription_plan: {
            id: 2003,
            name: '企业版月付',
            price: 599.00,
            currency: 'CNY',
            billing_cycle: 'monthly'
          },
          payment_transactions: [
            {
              id: 30003,
              order_id: 10003,
              transaction_id: 'TXN_2024_003',
              payment_method: '信用卡',
              amount: 599.00,
              currency: 'CNY',
              status: 'failed',
              gateway_response: '卡余额不足',
              created_at: '2024-01-13T09:15:00Z',
              updated_at: '2024-01-13T09:20:00Z'
            }
          ]
        }
      ]

      setOrders(mockOrders)
      setTotalItems(mockOrders.length)
      setCurrentPage(page)
    } catch (error) {
      console.error('加载订单数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters)
    setCurrentPage(1)
    loadData(1, pageSize)
  }, [pageSize, loadData])

  const handleOrderUpdated = useCallback(() => {
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

  const handleExportOrders = useCallback(() => {
    // 模拟导出功能
    console.log('导出订单数据:', { filters, orders })
    // 实际项目中这里会调用导出API
  }, [filters, orders])

  useEffect(() => {
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

  // 计算统计数据
  const stats = {
    total: orders.length,
    completed: orders.filter(o => o.status === 'completed').length,
    pending: orders.filter(o => o.status === 'pending').length,
    failed: orders.filter(o => o.status === 'failed').length,
    totalRevenue: orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.amount, 0)
  }

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="订阅订单管理" 
        description="管理所有订阅相关的订单，包括支付状态、订单详情等"
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportOrders}>
            <Download className="mr-2 h-4 w-4" />
            导出数据
          </Button>
          <Button variant="outline" onClick={() => loadData(currentPage, pageSize)}>
            刷新数据
          </Button>
        </div>
      </PageHeader>
      
      <main className="flex-1 p-6">
        <div className="space-y-6">
          {/* 统计卡片 */}
          <OrderStatsCards stats={stats} />

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
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">加载中...</p>
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
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}