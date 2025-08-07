'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ShoppingCart,
  DollarSign,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Ban,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { orderService } from '@/lib/order-service'
import { OrderStatsResponse } from '@/lib/order-types'

export function OrderStatsCards() {
  const [stats, setStats] = useState<OrderStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true)

        // 获取当月的日期范围
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

        const response = await orderService.getOrderAnalytics({
          from_date: firstDay.toISOString().split('T')[0],
          to_date: lastDay.toISOString().split('T')[0],
        })

        if (response.code === 0 && response.data) {
          setStats(response.data)
        }
      } catch (error) {
        console.error('加载订单统计失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  // 格式化货币
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // 格式化百分比
  const formatPercentage = (rate: number) => {
    return `${(rate * 100).toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
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

  const statsCards = [
    {
      title: '总订单数',
      value: stats.total_orders.toLocaleString(),
      description: '本月订单总数',
      icon: ShoppingCart,
      color: 'text-blue-600',
    },
    {
      title: '总收入',
      value: formatCurrency(stats.total_revenue),
      description: '本月收入总额',
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: '已支付',
      value: stats.paid_orders.toLocaleString(),
      description: `支付成功率 ${stats.total_orders > 0 ? formatPercentage(stats.paid_orders / stats.total_orders) : '0%'}`,
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: '转换率',
      value: formatPercentage(stats.conversion_rate),
      description: '订单支付转换率',
      icon: TrendingUp,
      color: 'text-blue-600',
    },
    {
      title: '待支付',
      value: stats.pending_orders.toLocaleString(),
      description: '等待用户支付',
      icon: AlertCircle,
      color: 'text-yellow-600',
    },
    {
      title: '平均订单价值',
      value: formatCurrency(stats.avg_order_value),
      description: '每单平均金额',
      icon: CreditCard,
      color: 'text-purple-600',
    },
    {
      title: '失败订单',
      value: stats.failed_orders.toLocaleString(),
      description: `失败率 ${stats.total_orders > 0 ? formatPercentage(stats.failed_orders / stats.total_orders) : '0%'}`,
      icon: XCircle,
      color: 'text-red-600',
    },
    {
      title: '退款金额',
      value: formatCurrency(stats.total_refunded),
      description: `${stats.refunded_orders} 笔退款`,
      icon: Ban,
      color: 'text-orange-600',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}