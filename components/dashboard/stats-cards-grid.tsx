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
  UserCheck
} from "lucide-react"
import { StatsCard } from "./stats-card"
import { DashboardOverview } from "@/lib/stats-types"
import { formatNumber, formatRevenue, calculatePercentage } from "@/lib/dashboard-utils"

interface StatsCardsGridProps {
  overview: DashboardOverview | null
  loading: boolean
}

// 提取统计卡片数据
function getStatsCardsData(overview: DashboardOverview | null) {
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
}

// 主要统计卡片网格组件 - 使用React.memo优化
export const StatsCardsGrid = React.memo<StatsCardsGridProps>(function StatsCardsGrid({ overview, loading }) {
  // 使用useMemo缓存计算结果
  const statsData = React.useMemo(() => getStatsCardsData(overview), [overview])

  return (
    <div className="space-y-4">
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
      
      {/* 次要指标 */}
      {overview && !loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="订单统计"
            value={overview.orders.total_orders.toString()}
            change={`待处理 ${overview.orders.pending_orders} 个`}
            changeType={overview.orders.pending_orders > 5 ? "negative" : "neutral"}
            icon={ShoppingCart}
            loading={false}
            subtitle={`已支付 ${overview.orders.paid_orders} 个`}
          />
          
          <StatsCard
            title="邀请码使用"
            value={`${((overview.inviteCodes.used_codes / overview.inviteCodes.total_codes) * 100).toFixed(1)}%`}
            change={`剩余 ${overview.inviteCodes.unused_codes} 个`}
            changeType={overview.inviteCodes.unused_codes < 10 ? "negative" : "positive"}
            icon={Gift}
            loading={false}
            subtitle={`${overview.inviteCodes.used_codes} 已用 / ${overview.inviteCodes.total_codes} 总数`}
          />
          
          <StatsCard
            title="本周新用户"
            value={overview.users.new_users_this_week.toString()}
            change={`对比上周 ${overview.users.new_users_this_week > overview.users.new_users_today * 7 ? '+' : ''}${(overview.users.new_users_this_week - overview.users.new_users_today * 7)}`}
            changeType={overview.users.new_users_this_week > overview.users.new_users_today * 7 ? "positive" : "negative"}
            icon={Activity}
            loading={false}
            subtitle="本周增长趋势"
          />
          
          <StatsCard
            title="系统健康度"
            value="98.5%"
            change="运行稳定"
            changeType="positive"
            icon={TrendingUp}
            loading={false}
            subtitle="系统性能指标"
          />
        </div>
      )}
    </div>
  )
})