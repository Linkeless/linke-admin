'use client'

import { useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ShoppingCart, TrendingUp, CreditCard, Globe, RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { OrderAnalyticsComponent } from "../components/order-analytics"
import { useOrderAnalytics } from "@/hooks/queries/use-analytics"

export default function OrderAnalyticsPage() {
  // 使用React Query hooks
  const { 
    data: orderAnalytics, 
    isLoading: loading, 
    error,
    refetch 
  } = useOrderAnalytics({
    enabled: true
  })

  // 格式化货币
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(amount)
  }

  // 错误处理
  if (error) {
    return (
      <div className="flex flex-col">
        <PageHeader 
          title="订单分析" 
          description="订单数据分析和支付趋势报告"
        />
        <main className="flex-1 p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-destructive mb-4">加载订单分析数据失败</p>
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

  // 加载状态
  if (loading) {
    return (
      <div className="flex flex-col">
        <PageHeader 
          title="订单分析" 
          description="订单数据分析和支付趋势报告"
        />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <p>加载中...</p>
            </div>
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
        <Button 
          variant="outline" 
          onClick={() => refetch()}
          disabled={loading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          刷新数据
        </Button>
      </PageHeader>
      
      <main className="flex-1 p-6">
        <div className="space-y-6">
          {/* 核心指标概览 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className={loading ? 'animate-pulse' : ''}>
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

            <Card className={loading ? 'animate-pulse' : ''}>
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

            <Card className={loading ? 'animate-pulse' : ''}>
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

            <Card className={loading ? 'animate-pulse' : ''}>
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
          <OrderAnalyticsComponent 
            analytics={orderAnalytics} 
            loading={loading}
          />
        </div>
      </main>
    </div>
  )
}