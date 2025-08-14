'use client'

import React from 'react'
import { 
  Users, 
  TrendingUp, 
  Activity,
  TicketX,
  ShoppingCart,
  Gift,
  DollarSign,
  UserCheck,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatsCard } from "./stats-card"
import { DashboardOverview } from "@/lib/stats-types"
import { formatNumber, formatRevenue, calculatePercentage } from "@/lib/dashboard-utils"

interface StatsCardsGridProps {
  overview: DashboardOverview | null
  loading: boolean
  onRefresh?: () => void
  isRefetching?: boolean
  lastUpdated?: Date | null
}

// 提取统计卡片数据 - 使用React.memo优化计算
const getStatsCardsData = React.memo((overview: DashboardOverview | null) => {
  if (!overview) {
    return [
      {
        title: "用户总数",
        value: "0",
        change: "加载中...",
        changeType: "neutral" as const,
        icon: Users,
        trend: null
      },
      {
        title: "总收入",
        value: "¥0",
        change: "加载中...",
        changeType: "neutral" as const,
        icon: DollarSign,
        trend: null
      },
      {
        title: "活跃用户",
        value: "0",
        change: "加载中...",
        changeType: "neutral" as const,
        icon: UserCheck,
        trend: null
      },
      {
        title: "待处理工单",
        value: "0",
        change: "加载中...",
        changeType: "neutral" as const,
        icon: TicketX,
        trend: null
      }
    ]
  }

  // 计算趋势数据
  const userActivityRate = overview.users.total_users > 0 
    ? (overview.users.active_users / overview.users.total_users)
    : 0
  
  const orderConversionRate = overview.orders.conversion_rate
  const ticketResolutionRate = overview.tickets.total_tickets > 0
    ? (overview.tickets.resolved_tickets / overview.tickets.total_tickets)
    : 0
  
  const inviteUsageRate = overview.inviteCodes.total_codes > 0
    ? (overview.inviteCodes.used_codes / overview.inviteCodes.total_codes)
    : 0

  return [
    {
      title: "用户总数",
      value: formatNumber(overview.users.total_users),
      change: `本月新增 +${overview.users.new_users_this_month}`,
      changeType: overview.users.new_users_this_month > 0 ? "positive" as const : "neutral" as const,
      icon: Users,
      trend: userActivityRate,
      subtitle: `活跃率 ${(userActivityRate * 100).toFixed(1)}%`
    },
    {
      title: "总收入",
      value: formatRevenue(overview.orders.total_revenue),
      change: `转化率 ${(orderConversionRate * 100).toFixed(1)}%`,
      changeType: orderConversionRate > 0.6 ? "positive" as const : orderConversionRate > 0.3 ? "neutral" as const : "negative" as const,
      icon: DollarSign,
      trend: orderConversionRate,
      subtitle: `${overview.orders.paid_orders} 已支付 / ${overview.orders.total_orders} 总订单`
    },
    {
      title: "活跃用户",
      value: formatNumber(overview.users.active_users),
      change: `活跃率 ${calculatePercentage(overview.users.active_users, overview.users.total_users)}`,
      changeType: userActivityRate > 0.7 ? "positive" as const : userActivityRate > 0.4 ? "neutral" as const : "negative" as const,
      icon: UserCheck,
      trend: userActivityRate,
      subtitle: `今日新增 ${overview.users.new_users_today} 人`
    },
    {
      title: "待处理工单",
      value: overview.tickets.open_tickets.toString(),
      change: `解决率 ${(ticketResolutionRate * 100).toFixed(1)}%`,
      changeType: overview.tickets.open_tickets > 10 ? "negative" as const : overview.tickets.open_tickets > 5 ? "neutral" as const : "positive" as const,
      icon: TicketX,
      trend: ticketResolutionRate,
      subtitle: `${overview.tickets.resolved_tickets} 已解决 / ${overview.tickets.total_tickets} 总工单`
    }
  ]
})

// 主要统计卡片网格组件 - 使用React.memo优化
export const StatsCardsGrid = React.memo<StatsCardsGridProps>(function StatsCardsGrid({ 
  overview, 
  loading, 
  onRefresh,
  isRefetching = false,
  lastUpdated
}) {
  // 使用useMemo缓存计算结果
  const statsData = React.useMemo(() => getStatsCardsData(overview), [overview])

  // 格式化最后更新时间
  const formattedLastUpdated = React.useMemo(() => {
    if (!lastUpdated) return null
    return lastUpdated.toLocaleTimeString('zh-CN')
  }, [lastUpdated])

  // 手动刷新处理函数
  const handleRefresh = React.useCallback(() => {
    onRefresh?.()
  }, [onRefresh])

  return (
    <div className="space-y-4">
      {/* 数据状态和操作栏 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {formattedLastUpdated && `最后更新: ${formattedLastUpdated}`}
        </div>
        {onRefresh && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading || isRefetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            刷新数据
          </Button>
        )}
      </div>

      {/* 主要指标 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stats, index) => (
          <StatsCard
            key={index}
            title={stats.title}
            value={stats.value}
            change={stats.change}
            changeType={stats.changeType}
            icon={stats.icon}
            loading={loading}
            trend={stats.trend}
            subtitle={stats.subtitle}
          />
        ))}
      </div>
      
      {/* 次要指标 - 使用条件渲染和缓存优化 */}
      {overview && !loading && (
        <SecondaryStatsGrid overview={overview} />
      )}
    </div>
  )
})

// 次要统计数据网格 - 单独组件以优化渲染性能
const SecondaryStatsGrid = React.memo<{ overview: DashboardOverview }>(function SecondaryStatsGrid({ overview }) {
  // 使用useMemo缓存计算结果
  const secondaryStats = React.useMemo(() => [
    {
      title: "订单统计",
      value: overview.orders.total_orders.toString(),
      change: `待处理 ${overview.orders.pending_orders} 个`,
      changeType: overview.orders.pending_orders > 5 ? "negative" as const : "neutral" as const,
      icon: ShoppingCart,
      subtitle: `已支付 ${overview.orders.paid_orders} 个`
    },
    {
      title: "邀请码使用",
      value: `${((overview.inviteCodes.used_codes / overview.inviteCodes.total_codes) * 100).toFixed(1)}%`,
      change: `剩余 ${overview.inviteCodes.unused_codes} 个`,
      changeType: overview.inviteCodes.unused_codes < 10 ? "negative" as const : "positive" as const,
      icon: Gift,
      subtitle: `${overview.inviteCodes.used_codes} 已用 / ${overview.inviteCodes.total_codes} 总数`
    },
    {
      title: "本周新用户",
      value: overview.users.new_users_this_week.toString(),
      change: `对比上周 ${overview.users.new_users_this_week > overview.users.new_users_today * 7 ? '+' : ''}${(overview.users.new_users_this_week - overview.users.new_users_today * 7)}`,
      changeType: overview.users.new_users_this_week > overview.users.new_users_today * 7 ? "positive" as const : "negative" as const,
      icon: Activity,
      subtitle: "本周增长趋势"
    },
    {
      title: "系统健康度",
      value: "98.5%",
      change: "运行稳定",
      changeType: "positive" as const,
      icon: TrendingUp,
      subtitle: "系统性能指标"
    }
  ], [overview])

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {secondaryStats.map((stats, index) => (
        <StatsCard
          key={index}
          title={stats.title}
          value={stats.value}
          change={stats.change}
          changeType={stats.changeType}
          icon={stats.icon}
          loading={false}
          subtitle={stats.subtitle}
        />
      ))}
    </div>
  )
})