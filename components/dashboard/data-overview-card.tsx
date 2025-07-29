'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Loader2 } from "lucide-react"
import { DashboardOverview } from "@/lib/stats-types"
import { calculatePercentage } from "@/lib/dashboard-utils"

interface DataOverviewCardProps {
  overview: DashboardOverview | null
  loading: boolean
}

export function DataOverviewCard({ overview, loading }: DataOverviewCardProps) {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          数据概览
        </CardTitle>
        <CardDescription>
          系统运营数据统计
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        {loading ? (
          <div className="h-[250px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : overview ? (
          <div className="h-[250px] grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">用户统计</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">总用户</span>
                    <span className="font-medium">{overview.users.total_users}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">活跃用户</span>
                    <span className="font-medium">{overview.users.active_users}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">本月新增</span>
                    <span className="font-medium text-green-600">{overview.users.new_users_this_month}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">订单统计</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">总订单</span>
                    <span className="font-medium">{overview.orders.total_orders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">已支付</span>
                    <span className="font-medium text-green-600">{overview.orders.paid_orders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">待支付</span>
                    <span className="font-medium text-orange-600">{overview.orders.pending_orders}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">邀请码统计</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">总数</span>
                    <span className="font-medium">{overview.inviteCodes.total_codes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">已使用</span>
                    <span className="font-medium text-green-600">{overview.inviteCodes.used_codes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">使用率</span>
                    <span className="font-medium">{calculatePercentage(overview.inviteCodes.used_codes, overview.inviteCodes.total_codes)}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">工单统计</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">总工单</span>
                    <span className="font-medium">{overview.tickets.total_tickets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">待处理</span>
                    <span className="font-medium text-orange-600">{overview.tickets.open_tickets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">已解决</span>
                    <span className="font-medium text-green-600">{overview.tickets.resolved_tickets}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无数据</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}