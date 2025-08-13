'use client'

import { useEffect, useState, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ShoppingCart, TrendingUp, CreditCard, Globe } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { OrderAnalytics } from "@/lib/subscription-types"
import { OrderAnalyticsComponent } from "../components/order-analytics"

export default function OrderAnalyticsPage() {
  const [orderAnalytics, setOrderAnalytics] = useState<OrderAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  // 模拟数据加载
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 模拟订单分析数据
      const mockOrderAnalytics: OrderAnalytics = {
        overview: {
          total_orders: 2156,
          completed_orders: 2034,
          pending_orders: 87,
          failed_orders: 35,
          total_revenue: 287340,
          average_order_value: 133.28,
          conversion_rate: 94.3
        },
        trends: [
          { date: '2024-01-08', order_count: 67, revenue: 8940, conversion_rate: 92.5 },
          { date: '2024-01-09', order_count: 73, revenue: 9730, conversion_rate: 95.1 },
          { date: '2024-01-10', order_count: 54, revenue: 7210, conversion_rate: 91.2 },
          { date: '2024-01-11', order_count: 89, revenue: 11860, conversion_rate: 96.8 },
          { date: '2024-01-12', order_count: 76, revenue: 10140, conversion_rate: 93.7 },
          { date: '2024-01-13', order_count: 82, revenue: 10930, conversion_rate: 95.4 },
          { date: '2024-01-14', order_count: 69, revenue: 9200, conversion_rate: 92.8 }
        ],
        payment_methods: [
          { method: '支付宝', count: 867, revenue: 115620, percentage: 40.3 },
          { method: '微信支付', count: 642, revenue: 85630, percentage: 29.8 },
          { method: '信用卡', count: 398, revenue: 53070, percentage: 18.5 },
          { method: 'PayPal', count: 187, revenue: 24930, percentage: 8.7 },
          { method: '银行转账', count: 62, revenue: 8090, percentage: 2.8 }
        ],
        geographic_distribution: [
          { country: '中国', order_count: 1543, revenue: 205820, percentage: 71.6 },
          { country: '美国', order_count: 234, revenue: 31220, percentage: 10.9 },
          { country: '日本', order_count: 167, revenue: 22290, percentage: 7.8 },
          { country: '韩国', order_count: 123, revenue: 16410, percentage: 5.7 },
          { country: '其他', order_count: 89, revenue: 11600, percentage: 4.0 }
        ]
      }

      setOrderAnalytics(mockOrderAnalytics)
    } catch (error) {
      console.error('加载订单分析数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 格式化货币
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex flex-col">
        <PageHeader 
          title="订单分析" 
          description="订单数据分析和支付趋势报告"
        />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">加载中...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!orderAnalytics) {
    return (
      <div className="flex flex-col">
        <PageHeader 
          title="订单分析" 
          description="订单数据分析和支付趋势报告"
        />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">暂无数据</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="订单分析" 
        description="订单数据分析和支付趋势报告"
      >
        <Button variant="outline" onClick={loadData}>
          刷新数据
        </Button>
      </PageHeader>
      
      <main className="flex-1 p-6">
        <div className="space-y-6">
          {/* 核心指标概览 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总订单数</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orderAnalytics.overview.total_orders.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  完成率 {((orderAnalytics.overview.completed_orders / orderAnalytics.overview.total_orders) * 100).toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总收入</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(orderAnalytics.overview.total_revenue)}</div>
                <p className="text-xs text-muted-foreground">
                  已完成订单收入
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">平均订单价值</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(orderAnalytics.overview.average_order_value)}</div>
                <p className="text-xs text-muted-foreground">
                  AOV
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">支付成功率</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orderAnalytics.overview.conversion_rate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  转化率
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 详细分析组件 */}
          <OrderAnalyticsComponent analytics={orderAnalytics} />
        </div>
      </main>
    </div>
  )
}