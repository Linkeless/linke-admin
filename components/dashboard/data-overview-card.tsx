'use client'

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardOverview } from "@/lib/stats-types"
import { calculatePercentage } from "@/lib/dashboard-utils"

interface DataOverviewCardProps {
  overview: DashboardOverview | null
  loading: boolean
  onRefresh?: () => void
  isRefetching?: boolean
  lastUpdated?: Date | null
}

export const DataOverviewCard = React.memo<DataOverviewCardProps>(function DataOverviewCard({ 
  overview, 
  loading, 
  onRefresh,
  isRefetching = false,
  lastUpdated
}) {
  // 格式化最后更新时间
  const formattedLastUpdated = React.useMemo(() => {
    if (!lastUpdated) return null
    return lastUpdated.toLocaleString('zh-CN')
  }, [lastUpdated])

  // 手动刷新处理函数
  const handleRefresh = React.useCallback(() => {
    onRefresh?.()
  }, [onRefresh])

  return (
    <Card className="col-span-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <CardTitle>数据概览</CardTitle>
          </div>
          {onRefresh && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={loading || isRefetching}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          )}
        </div>
        <CardDescription>
          系统运营数据统计
          {formattedLastUpdated && (
            <span className="ml-2 text-xs text-muted-foreground">
              · 更新于 {formattedLastUpdated}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        {loading ? (
          <div className="h-[250px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : overview ? (
          <OverviewContent overview={overview} />
        ) : (
          <EmptyState />
        )}
      </CardContent>
    </Card>
  )
})

// 概览内容组件 - 使用React.memo优化渲染
const OverviewContent = React.memo<{ overview: DashboardOverview }>(function OverviewContent({ overview }) {
  return (
    <div className="h-[250px] grid grid-cols-2 gap-4">
      <div className="space-y-4">
        <UserStatsSection users={overview.users} />
        <OrderStatsSection orders={overview.orders} />
      </div>
      <div className="space-y-4">
        <InviteCodesSection inviteCodes={overview.inviteCodes} />
        <TicketsSection tickets={overview.tickets} />
      </div>
    </div>
  )
})

// 用户统计部分
const UserStatsSection = React.memo<{ users: DashboardOverview['users'] }>(function UserStatsSection({ users }) {
  return (
    <div>
      <h4 className="text-sm font-medium mb-2">用户统计</h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">总用户</span>
          <span className="font-medium">{users.total_users.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">活跃用户</span>
          <span className="font-medium text-green-600">{users.active_users.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">本月新增</span>
          <span className="font-medium text-blue-600">{users.new_users_this_month.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">活跃率</span>
          <span className="font-medium">
            {calculatePercentage(users.active_users, users.total_users)}
          </span>
        </div>
      </div>
    </div>
  )
})

// 订单统计部分
const OrderStatsSection = React.memo<{ orders: DashboardOverview['orders'] }>(function OrderStatsSection({ orders }) {
  return (
    <div>
      <h4 className="text-sm font-medium mb-2">订单统计</h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">总订单</span>
          <span className="font-medium">{orders.total_orders.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">已支付</span>
          <span className="font-medium text-green-600">{orders.paid_orders.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">待支付</span>
          <span className="font-medium text-orange-600">{orders.pending_orders.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">转化率</span>
          <span className="font-medium">
            {(orders.conversion_rate * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  )
})

// 邀请码统计部分
const InviteCodesSection = React.memo<{ inviteCodes: DashboardOverview['inviteCodes'] }>(function InviteCodesSection({ inviteCodes }) {
  return (
    <div>
      <h4 className="text-sm font-medium mb-2">邀请码统计</h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">总数</span>
          <span className="font-medium">{inviteCodes.total_codes.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">已使用</span>
          <span className="font-medium text-green-600">{inviteCodes.used_codes.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">剩余</span>
          <span className="font-medium text-blue-600">{inviteCodes.unused_codes.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">使用率</span>
          <span className="font-medium">
            {calculatePercentage(inviteCodes.used_codes, inviteCodes.total_codes)}
          </span>
        </div>
      </div>
    </div>
  )
})

// 工单统计部分
const TicketsSection = React.memo<{ tickets: DashboardOverview['tickets'] }>(function TicketsSection({ tickets }) {
  return (
    <div>
      <h4 className="text-sm font-medium mb-2">工单统计</h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">总工单</span>
          <span className="font-medium">{tickets.total_tickets.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">待处理</span>
          <span className="font-medium text-orange-600">{tickets.open_tickets.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">已解决</span>
          <span className="font-medium text-green-600">{tickets.resolved_tickets.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">解决率</span>
          <span className="font-medium">
            {calculatePercentage(tickets.resolved_tickets, tickets.total_tickets)}
          </span>
        </div>
      </div>
    </div>
  )
})

// 空状态组件
const EmptyState = React.memo(function EmptyState() {
  return (
    <div className="h-[250px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
      <div className="text-center">
        <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">暂无数据</p>
        <p className="text-xs text-muted-foreground mt-1">请检查网络连接或稍后重试</p>
      </div>
    </div>
  )
})