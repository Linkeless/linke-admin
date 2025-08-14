'use client'

import { useMemo } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { 
  ShoppingCart, 
  DollarSign, 
  CreditCard, 
  TrendingUp,
  AlertCircle,
  Ban
} from 'lucide-react'
import { useOrderAnalytics } from '@/hooks/queries/use-orders'

export function OrderStatsCards() {
  // 使用当月的日期范围
  const queryParams = useMemo(() => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    return {
      from_date: firstDay.toISOString().split('T')[0],
      to_date: lastDay.toISOString().split('T')[0]
    }
  }, [])

  // 使用 React Query hook with unified error handling
  const { data: statsResponse, isLoading, error } = useOrderAnalytics(queryParams)
  const stats = statsResponse?.data

  // 错误状态统一处理
  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-600">数据获取失败</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">--</div>
              <p className="text-xs text-red-500">请稍后重试</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">加载中...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">--</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
  }

  const formatPercentage = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">总订单数</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_orders.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            当月订单总数
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">总收入</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.total_revenue)}</div>
          <p className="text-xs text-muted-foreground">
            当月收入总额
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">已支付订单</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.paid_orders.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            成功支付 {stats.total_orders > 0 ? formatPercentage(stats.paid_orders / stats.total_orders) : '0%'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">转换率</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercentage(stats.conversion_rate)}</div>
          <p className="text-xs text-muted-foreground">
            支付成功率
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">待支付订单</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.pending_orders.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            等待支付中
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">平均订单价值</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.avg_order_value)}</div>
          <p className="text-xs text-muted-foreground">
            平均每单金额
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">失败订单</CardTitle>
          <Ban className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.failed_orders.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            支付失败/取消
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">退款金额</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.total_refunded)}</div>
          <p className="text-xs text-muted-foreground">
            {stats.refunded_orders} 笔退款
          </p>
        </CardContent>
      </Card>
    </div>
  )
}