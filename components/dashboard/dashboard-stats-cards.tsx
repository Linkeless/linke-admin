'use client'

import { useEffect, useState } from "react"
import { TrendingDown, TrendingUp, Users, ShoppingCart, Ticket, UserPlus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { dashboardService } from "@/lib/dashboard-service"
import { DashboardOverview, StatsQueryParams } from "@/lib/stats-types"

interface DashboardStatsCardsProps {
  period?: StatsQueryParams
}

export function DashboardStatsCards({ period }: DashboardStatsCardsProps) {
  const [data, setData] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [period])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const overview = await dashboardService.getOverview(period)
      setData(overview)
    } catch (err) {
      console.error('加载Dashboard数据失败:', err)
      setError(err instanceof Error ? err.message : '加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('zh-CN').format(num)
  }

  const calculateGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous * 100).toFixed(1)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24" />
            </CardHeader>
            <CardFooter>
              <Skeleton className="h-4 w-32" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">加载数据失败</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!data) return null

  // 计算增长率 (这里使用模拟数据，实际应该从API获取历史数据)
  const revenueGrowth = calculateGrowthRate(data.orders.total_revenue, data.orders.total_revenue * 0.9)
  const userGrowth = calculateGrowthRate(data.users.new_users_this_month, data.users.new_users_this_month * 0.8)
  const orderGrowth = calculateGrowthRate(data.orders.total_orders, data.orders.total_orders * 0.85)
  const conversionRate = data.orders.conversion_rate

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* 总收入 */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>总收入</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(data.orders.total_revenue)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {parseFloat(revenueGrowth) >= 0 ? <TrendingUp /> : <TrendingDown />}
              {parseFloat(revenueGrowth) >= 0 ? '+' : ''}{revenueGrowth}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <ShoppingCart className="size-4" />
            {data.orders.paid_orders} 笔已支付订单
          </div>
          <div className="text-muted-foreground">
            平均订单价值: {formatCurrency(data.orders.avg_order_value)}
          </div>
        </CardFooter>
      </Card>

      {/* 新增用户 */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>本月新增用户</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(data.users.new_users_this_month)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {parseFloat(userGrowth) >= 0 ? <TrendingUp /> : <TrendingDown />}
              {parseFloat(userGrowth) >= 0 ? '+' : ''}{userGrowth}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <UserPlus className="size-4" />
            今日新增 {data.users.new_users_today} 人
          </div>
          <div className="text-muted-foreground">
            本周新增 {data.users.new_users_this_week} 人
          </div>
        </CardFooter>
      </Card>

      {/* 活跃用户 */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>活跃用户</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(data.users.active_users)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Users />
              {((data.users.active_users / data.users.total_users) * 100).toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <Users className="size-4" />
            总用户 {formatNumber(data.users.total_users)} 人
          </div>
          <div className="text-muted-foreground">
            用户活跃度保持良好
          </div>
        </CardFooter>
      </Card>

      {/* 订单转化率 */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>订单转化率</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {(conversionRate * 100).toFixed(1)}%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {conversionRate >= 0.1 ? <TrendingUp /> : <TrendingDown />}
              {conversionRate >= 0.1 ? '良好' : '需优化'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <Ticket className="size-4" />
            总订单 {formatNumber(data.orders.total_orders)} 笔
          </div>
          <div className="text-muted-foreground">
            已支付 {data.orders.paid_orders} / 待处理 {data.orders.pending_orders}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}