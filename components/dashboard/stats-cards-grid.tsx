'use client'

import { 
  Users, 
  TrendingUp, 
  Activity,
  TicketX
} from "lucide-react"
import { StatsCard } from "./stats-card"
import { DashboardOverview } from "@/lib/stats-types"
import { formatNumber, formatRevenue, calculatePercentage } from "@/lib/dashboard-utils"

interface StatsCardsGridProps {
  overview: DashboardOverview | null
  loading: boolean
}

export function StatsCardsGrid({ overview, loading }: StatsCardsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="用户总数"
        value={overview ? formatNumber(overview.users.total_users) : '0'}
        change={overview ? `本月新增 ${overview.users.new_users_this_month}` : '加载中...'}
        changeType="positive"
        icon={Users}
        loading={loading}
      />
      <StatsCard
        title="总收入"
        value={overview ? formatRevenue(overview.orders.total_revenue) : '¥0'}
        change={overview ? `订单转化率 ${(overview.orders.conversion_rate * 100).toFixed(1)}%` : '加载中...'}
        changeType="positive"
        icon={TrendingUp}
        loading={loading}
      />
      <StatsCard
        title="活跃用户"
        value={overview ? formatNumber(overview.users.active_users) : '0'}
        change={overview ? `活跃率 ${calculatePercentage(overview.users.active_users, overview.users.total_users)}` : '加载中...'}
        changeType="positive"
        icon={Activity}
        loading={loading}
      />
      <StatsCard
        title="待处理工单"
        value={overview ? overview.tickets.open_tickets : '0'}
        change={overview ? `总工单 ${overview.tickets.total_tickets}` : '加载中...'}
        changeType={overview && overview.tickets.open_tickets > 10 ? 'negative' : 'neutral'}
        icon={TicketX}
        loading={loading}
      />
    </div>
  )
}