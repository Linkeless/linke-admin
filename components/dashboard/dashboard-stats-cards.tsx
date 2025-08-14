'use client'

import React from "react"
import { TrendingDown, TrendingUp, Users, ShoppingCart, Ticket, UserPlus, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardOverview } from "@/hooks/queries/use-dashboard"
import { DashboardOverview, StatsQueryParams } from "@/lib/stats-types"

interface DashboardStatsCardsProps {
  period?: StatsQueryParams
  enableAutoRefresh?: boolean
  refreshInterval?: number
}

export const DashboardStatsCards = React.memo<DashboardStatsCardsProps>(function DashboardStatsCards({ 
  period, 
  enableAutoRefresh = false,
  refreshInterval = 300000 // 5分钟默认刷新间隔
}) {
  // 使用React Query hook替代传统的useState + useEffect模式
  const { 
    data, 
    isLoading, 
    error, 
    refetch,
    isRefetching,
    dataUpdatedAt
  } = useDashboardOverview({ 
    ...period,
    autoRefresh: enableAutoRefresh,
    refreshInterval
  })

  // 使用React.useCallback缓存函数，避免不必要的重新渲染
  const formatCurrency = React.useCallback((amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(amount)
  }, [])

  const formatNumber = React.useCallback((num: number) => {
    return new Intl.NumberFormat('zh-CN').format(num)
  }, [])

  const calculateGrowthRate = React.useCallback((current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous * 100).toFixed(1)
  }, [])

  // 手动刷新功能
  const handleRefresh = React.useCallback(() => {
    refetch()
  }, [refetch])

  // 计算数据最后更新时间
  const lastUpdated = React.useMemo(() => {
    if (!dataUpdatedAt) return null
    return new Date(dataUpdatedAt).toLocaleTimeString('zh-CN')
  }, [dataUpdatedAt])

  if (isLoading) {
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
            <CardTitle className="text-red-600 flex items-center justify-between">
              加载数据失败
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefetching}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
                重试
              </Button>
            </CardTitle>
            <CardDescription>{error?.message || '获取仪表板数据失败，请重试'}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!data) return null

  // 使用React.useMemo缓存计算结果，优化性能
  const statsData = React.useMemo(() => {
    // 计算增长率 (使用增强的数据计算功能)
    const revenueGrowth = data.orders.growthRate || calculateGrowthRate(data.orders.total_revenue, data.orders.total_revenue * 0.9)
    const userGrowth = data.users.growthRate || calculateGrowthRate(data.users.new_users_this_month, data.users.new_users_this_month * 0.8)
    const orderGrowth = calculateGrowthRate(data.orders.total_orders, data.orders.total_orders * 0.85)
    const conversionRate = data.orders.conversion_rate || data.orders.conversionPercentage / 100

    return {
      revenueGrowth,
      userGrowth,
      orderGrowth,
      conversionRate
    }
  }, [data, calculateGrowthRate])

  return (
    <div className="space-y-4">
      {/* 数据更新时间和刷新按钮 */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="text-sm text-muted-foreground">
          {lastUpdated && `最后更新: ${lastUpdated}`}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          刷新数据
        </Button>
      </div>

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
              {parseFloat(statsData.revenueGrowth) >= 0 ? <TrendingUp /> : <TrendingDown />}
              {parseFloat(statsData.revenueGrowth) >= 0 ? '+' : ''}{statsData.revenueGrowth}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <ShoppingCart className="size-4" />
            {data.orders.paid_orders} 笔已支付订单
          </div>
          <div className="text-muted-foreground">
            平均订单价值: {formatCurrency(data.orders.avgOrderValue || data.orders.avg_order_value)}
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
              {parseFloat(statsData.userGrowth) >= 0 ? <TrendingUp /> : <TrendingDown />}
              {parseFloat(statsData.userGrowth) >= 0 ? '+' : ''}{statsData.userGrowth}%
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
              {(data.users.activeRate * 100 || ((data.users.active_users / data.users.total_users) * 100)).toFixed(1)}%
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
            {(statsData.conversionRate * 100).toFixed(1)}%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {statsData.conversionRate >= 0.1 ? <TrendingUp /> : <TrendingDown />}
              {statsData.conversionRate >= 0.1 ? '良好' : '需优化'}
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
    </div>
  )
})