'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Users, TrendingUp, TicketX, Activity } from "lucide-react"
import { ActivityItem } from "./activity-item"
import { DashboardOverview } from "@/lib/stats-types"

interface SystemStatusCardProps {
  overview: DashboardOverview | null
}

export function SystemStatusCard({ overview }: SystemStatusCardProps) {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          系统状态
        </CardTitle>
        <CardDescription>
          系统运行状态概览
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <ActivityItem
            title="用户活跃度"
            description={overview ? `${overview.users.active_users} / ${overview.users.total_users} 用户在线` : '加载中...'}
            time="实时"
            icon={Users}
          />
          <ActivityItem
            title="订单处理"
            description={overview ? `${overview.orders.pending_orders} 个订单待处理` : '加载中...'}
            time="实时"
            icon={TrendingUp}
          />
          <ActivityItem
            title="工单系统"
            description={overview ? `${overview.tickets.open_tickets} 个工单待处理` : '加载中...'}
            time="实时"
            icon={TicketX}
          />
          <ActivityItem
            title="邀请码"
            description={overview ? `${overview.inviteCodes.unused_codes} 个邀请码可用` : '加载中...'}
            time="实时"
            icon={Activity}
          />
        </div>
      </CardContent>
    </Card>
  )
}