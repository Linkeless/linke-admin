'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, Users, TrendingUp, TicketX, Activity, Server, Wifi, Database, AlertTriangle } from "lucide-react"
import { ActivityItem } from "./activity-item"
import { DashboardOverview } from "@/lib/stats-types"
import { cn } from "@/lib/utils"

interface SystemStatusCardProps {
  overview: DashboardOverview | null
}

// 状态指示器组件
function StatusIndicator({ 
  status, 
  label, 
  description 
}: { 
  status: 'healthy' | 'warning' | 'critical' | 'unknown'
  label: string
  description: string
}) {
  const statusConfig = {
    healthy: {
      color: 'bg-green-500',
      badge: 'default',
      text: '正常'
    },
    warning: {
      color: 'bg-yellow-500',
      badge: 'secondary',
      text: '警告'
    },
    critical: {
      color: 'bg-red-500',
      badge: 'destructive', 
      text: '异常'
    },
    unknown: {
      color: 'bg-gray-500',
      badge: 'outline',
      text: '未知'
    }
  } as const

  const config = statusConfig[status]

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
      <div className="flex items-center space-x-3">
        <div className={cn(
          "w-3 h-3 rounded-full animate-pulse",
          config.color
        )} />
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Badge variant={config.badge as any} className="text-xs">
        {config.text}
      </Badge>
    </div>
  )
}

// 获取系统状态
function getSystemStatus(overview: DashboardOverview | null) {
  if (!overview) {
    return {
      userActivity: 'unknown' as const,
      orderProcessing: 'unknown' as const, 
      ticketSystem: 'unknown' as const,
      inviteSystem: 'unknown' as const,
      overall: 'unknown' as const
    }
  }

  const userActivityRate = overview.users.total_users > 0 
    ? overview.users.active_users / overview.users.total_users 
    : 0

  const orderProcessingRate = overview.orders.total_orders > 0
    ? overview.orders.paid_orders / overview.orders.total_orders
    : 0

  const ticketResolutionRate = overview.tickets.total_tickets > 0
    ? overview.tickets.resolved_tickets / overview.tickets.total_tickets
    : 0

  const inviteUsageRate = overview.inviteCodes.total_codes > 0
    ? overview.inviteCodes.used_codes / overview.inviteCodes.total_codes
    : 0

  return {
    userActivity: userActivityRate > 0.8 ? 'healthy' : userActivityRate > 0.5 ? 'warning' : 'critical',
    orderProcessing: orderProcessingRate > 0.7 ? 'healthy' : orderProcessingRate > 0.4 ? 'warning' : 'critical',
    ticketSystem: overview.tickets.open_tickets < 5 ? 'healthy' : overview.tickets.open_tickets < 15 ? 'warning' : 'critical',
    inviteSystem: inviteUsageRate > 0.3 ? 'healthy' : inviteUsageRate > 0.1 ? 'warning' : 'critical',
    overall: 'healthy' // 可以根据上述指标计算
  } as const
}

export function SystemStatusCard({ overview }: SystemStatusCardProps) {
  const status = getSystemStatus(overview)
  const now = new Date().toLocaleTimeString('zh-CN', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            系统状态
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wifi className="h-4 w-4" />
            最后更新: {now}
          </div>
        </CardTitle>
        <CardDescription>
          实时系统运行状态监控与健康检查
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 系统整体状态 */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
          <div className="flex items-center space-x-3">
            <Server className="h-6 w-6 text-primary" />
            <div>
              <p className="font-medium">系统整体状态</p>
              <p className="text-sm text-muted-foreground">所有服务正常运行</p>
            </div>
          </div>
          <Badge variant="default" className="bg-green-500">
            正常运行
          </Badge>
        </div>

        {/* 各模块状态 */}
        <div className="space-y-3">
          <StatusIndicator
            status={status.userActivity}
            label="用户活跃度"
            description={overview ? `${overview.users.active_users} / ${overview.users.total_users} 用户在线` : '加载中...'}
          />
          
          <StatusIndicator
            status={status.orderProcessing}
            label="订单处理"
            description={overview ? `${overview.orders.pending_orders} 个订单待处理` : '加载中...'}
          />
          
          <StatusIndicator
            status={status.ticketSystem}
            label="工单系统"
            description={overview ? `${overview.tickets.open_tickets} 个工单待处理` : '加载中...'}
          />
          
          <StatusIndicator
            status={status.inviteSystem}
            label="邀请码系统"
            description={overview ? `${overview.inviteCodes.unused_codes} 个邀请码可用` : '加载中...'}
          />
        </div>

        {/* 性能指标 */}
        {overview && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              性能指标
            </h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>用户活跃率</span>
                  <span>{((overview.users.active_users / overview.users.total_users) * 100).toFixed(1)}%</span>
                </div>
                <Progress 
                  value={(overview.users.active_users / overview.users.total_users) * 100} 
                  className="h-2"
                />
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>订单转化率</span>
                  <span>{(overview.orders.conversion_rate * 100).toFixed(1)}%</span>
                </div>
                <Progress 
                  value={overview.orders.conversion_rate * 100} 
                  className="h-2"
                />
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>邀请码使用率</span>
                  <span>{((overview.inviteCodes.used_codes / overview.inviteCodes.total_codes) * 100).toFixed(1)}%</span>
                </div>
                <Progress 
                  value={(overview.inviteCodes.used_codes / overview.inviteCodes.total_codes) * 100} 
                  className="h-2"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}