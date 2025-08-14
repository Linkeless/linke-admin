'use client'

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Clock, 
  Users, 
  TrendingUp, 
  TicketX, 
  Activity, 
  Server, 
  Wifi, 
  Database, 
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  XCircle
} from "lucide-react"
import { ActivityItem } from "./activity-item"
import { DashboardOverview } from "@/lib/stats-types"
import { useSystemHealth, useCacheMetrics } from "@/hooks/queries/use-dashboard"
import { cn } from "@/lib/utils"

interface SystemStatusCardProps {
  overview: DashboardOverview | null
  onRefresh?: () => void
  isRefetching?: boolean
}

// 状态指示器组件 - 使用React.memo优化
const StatusIndicator = React.memo<{ 
  status: 'healthy' | 'warning' | 'critical' | 'unknown'
  label: string
  description: string
  metric?: number
}>(function StatusIndicator({ status, label, description, metric }) {
  const statusConfig = {
    healthy: {
      color: 'bg-green-500',
      badge: 'default',
      text: '正常',
      icon: CheckCircle
    },
    warning: {
      color: 'bg-yellow-500',
      badge: 'secondary',
      text: '警告',
      icon: AlertTriangle
    },
    critical: {
      color: 'bg-red-500',
      badge: 'destructive', 
      text: '异常',
      icon: XCircle
    },
    unknown: {
      color: 'bg-gray-500',
      badge: 'outline',
      text: '未知',
      icon: Activity
    }
  } as const

  const config = statusConfig[status]
  const IconComponent = config.icon

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div className={cn(
            "w-3 h-3 rounded-full",
            config.color,
            status === 'healthy' && "animate-pulse"
          )} />
          <IconComponent className={cn(
            "absolute -top-1 -right-1 h-3 w-3",
            status === 'healthy' && "text-green-500",
            status === 'warning' && "text-yellow-500",
            status === 'critical' && "text-red-500",
            status === 'unknown' && "text-gray-500"
          )} />
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
          {metric && (
            <p className="text-xs font-mono text-primary">
              {typeof metric === 'number' ? `${metric.toFixed(1)}%` : metric}
            </p>
          )}
        </div>
      </div>
      <Badge variant={config.badge as any} className="text-xs">
        {config.text}
      </Badge>
    </div>
  )
})

// 获取系统状态 - 使用React.useMemo缓存计算
function useSystemStatus(overview: DashboardOverview | null) {
  return React.useMemo(() => {
    if (!overview) {
      return {
        userActivity: 'unknown' as const,
        orderProcessing: 'unknown' as const, 
        ticketSystem: 'unknown' as const,
        inviteSystem: 'unknown' as const,
        overall: 'unknown' as const,
        metrics: {
          userActivityRate: 0,
          orderProcessingRate: 0,
          ticketResolutionRate: 0,
          inviteUsageRate: 0
        }
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

    // 计算整体健康状态
    const healthyCount = [
      userActivityRate > 0.8,
      orderProcessingRate > 0.7,
      overview.tickets.open_tickets < 5,
      inviteUsageRate > 0.3
    ].filter(Boolean).length

    const overall = healthyCount >= 3 ? 'healthy' : healthyCount >= 2 ? 'warning' : 'critical'

    return {
      userActivity: userActivityRate > 0.8 ? 'healthy' : userActivityRate > 0.5 ? 'warning' : 'critical',
      orderProcessing: orderProcessingRate > 0.7 ? 'healthy' : orderProcessingRate > 0.4 ? 'warning' : 'critical',
      ticketSystem: overview.tickets.open_tickets < 5 ? 'healthy' : overview.tickets.open_tickets < 15 ? 'warning' : 'critical',
      inviteSystem: inviteUsageRate > 0.3 ? 'healthy' : inviteUsageRate > 0.1 ? 'warning' : 'critical',
      overall,
      metrics: {
        userActivityRate: userActivityRate * 100,
        orderProcessingRate: orderProcessingRate * 100,
        ticketResolutionRate: ticketResolutionRate * 100,
        inviteUsageRate: inviteUsageRate * 100
      }
    } as const
  }, [overview])
}

export const SystemStatusCard = React.memo<SystemStatusCardProps>(function SystemStatusCard({ 
  overview, 
  onRefresh,
  isRefetching = false
}) {
  const status = useSystemStatus(overview)
  
  // 使用React Query获取系统健康数据（实时数据，30秒缓存）
  const { 
    data: systemHealth, 
    isLoading: healthLoading,
    refetch: refetchHealth 
  } = useSystemHealth()

  // 使用React Query获取缓存性能指标（实时数据，1分钟刷新）
  const { 
    data: cacheMetrics, 
    isLoading: cacheLoading 
  } = useCacheMetrics()

  // 当前时间
  const [currentTime, setCurrentTime] = React.useState(new Date())
  
  // 每秒更新时间
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])

  const formattedTime = React.useMemo(() => {
    return currentTime.toLocaleTimeString('zh-CN', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }, [currentTime])

  // 综合刷新处理函数
  const handleRefresh = React.useCallback(() => {
    onRefresh?.()
    refetchHealth()
  }, [onRefresh, refetchHealth])

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            系统状态
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wifi className="h-4 w-4" />
              {formattedTime}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefetching || healthLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching || healthLoading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          实时系统运行状态监控与健康检查
          {systemHealth?.lastChecked && (
            <span className="ml-2 text-xs text-muted-foreground">
              · 健康检查于 {new Date(systemHealth.lastChecked).toLocaleTimeString('zh-CN')}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 系统整体状态 */}
        <div className={cn(
          "flex items-center justify-between p-4 rounded-lg transition-colors",
          status.overall === 'healthy' && "bg-green-50 border-green-200",
          status.overall === 'warning' && "bg-yellow-50 border-yellow-200",
          status.overall === 'critical' && "bg-red-50 border-red-200",
          status.overall === 'unknown' && "bg-muted/30"
        )}>
          <div className="flex items-center space-x-3">
            <Server className="h-6 w-6 text-primary" />
            <div>
              <p className="font-medium">系统整体状态</p>
              <p className="text-sm text-muted-foreground">
                {systemHealth?.overallHealth === 'healthy' ? '所有服务正常运行' : 
                 systemHealth?.overallHealth === 'warning' ? '部分服务存在警告' :
                 systemHealth?.overallHealth === 'critical' ? '系统存在严重问题' :
                 '状态检查中...'}
              </p>
            </div>
          </div>
          <Badge 
            variant={status.overall === 'healthy' ? 'default' : 
                    status.overall === 'warning' ? 'secondary' : 'destructive'}
            className={cn(
              status.overall === 'healthy' && "bg-green-500",
              status.overall === 'warning' && "bg-yellow-500",
              status.overall === 'critical' && "bg-red-500"
            )}
          >
            {status.overall === 'healthy' ? '正常运行' :
             status.overall === 'warning' ? '警告状态' :
             status.overall === 'critical' ? '异常状态' : '检查中'}
          </Badge>
        </div>

        {/* 各模块状态 */}
        <div className="space-y-3">
          <StatusIndicator
            status={status.userActivity}
            label="用户活跃度"
            description={overview ? `${overview.users.active_users} / ${overview.users.total_users} 用户在线` : '加载中...'}
            metric={status.metrics.userActivityRate}
          />
          
          <StatusIndicator
            status={status.orderProcessing}
            label="订单处理"
            description={overview ? `${overview.orders.pending_orders} 个订单待处理` : '加载中...'}
            metric={status.metrics.orderProcessingRate}
          />
          
          <StatusIndicator
            status={status.ticketSystem}
            label="工单系统"
            description={overview ? `${overview.tickets.open_tickets} 个工单待处理` : '加载中...'}
            metric={status.metrics.ticketResolutionRate}
          />
          
          <StatusIndicator
            status={status.inviteSystem}
            label="邀请码系统"
            description={overview ? `${overview.inviteCodes.unused_codes} 个邀请码可用` : '加载中...'}
            metric={status.metrics.inviteUsageRate}
          />

          {/* 缓存性能状态 */}
          {cacheMetrics && (
            <StatusIndicator
              status={cacheMetrics.performanceLevel === 'excellent' ? 'healthy' :
                      cacheMetrics.performanceLevel === 'good' ? 'healthy' :
                      cacheMetrics.performanceLevel === 'fair' ? 'warning' : 'critical'}
              label="缓存性能"
              description={`命中率 ${cacheMetrics.hitRatePercentage}% · 响应时间 ${cacheMetrics.avgResponseTimeMs}ms`}
              metric={cacheMetrics.hitRatePercentage}
            />
          )}
        </div>

        {/* 性能指标 */}
        {overview && (
          <PerformanceMetrics overview={overview} cacheMetrics={cacheMetrics} />
        )}

        {/* 系统健康详情 */}
        {systemHealth && (
          <SystemHealthDetails systemHealth={systemHealth} />
        )}
      </CardContent>
    </Card>
  )
})

// 性能指标组件
const PerformanceMetrics = React.memo<{ 
  overview: DashboardOverview
  cacheMetrics?: any 
}>(function PerformanceMetrics({ overview, cacheMetrics }) {
  const metrics = React.useMemo(() => [
    {
      label: "用户活跃率",
      value: (overview.users.active_users / overview.users.total_users) * 100,
      color: "bg-blue-500"
    },
    {
      label: "订单转化率", 
      value: overview.orders.conversion_rate * 100,
      color: "bg-green-500"
    },
    {
      label: "邀请码使用率",
      value: (overview.inviteCodes.used_codes / overview.inviteCodes.total_codes) * 100,
      color: "bg-purple-500"
    },
    ...(cacheMetrics ? [{
      label: "缓存命中率",
      value: cacheMetrics.hitRatePercentage,
      color: "bg-orange-500"
    }] : [])
  ], [overview, cacheMetrics])

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <Database className="h-4 w-4" />
        性能指标
      </h4>
      <div className="space-y-3">
        {metrics.map((metric, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{metric.label}</span>
              <span className="font-mono">{metric.value.toFixed(1)}%</span>
            </div>
            <Progress 
              value={metric.value} 
              className="h-2"
            />
          </div>
        ))}
      </div>
    </div>
  )
})

// 系统健康详情组件
const SystemHealthDetails = React.memo<{ systemHealth: any }>(function SystemHealthDetails({ systemHealth }) {
  if (!systemHealth.circuitBreakerSummary) return null

  const { total, open, closed, halfOpen } = systemHealth.circuitBreakerSummary

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <Activity className="h-4 w-4" />
        电路熔断器状态
      </h4>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">总数:</span>
          <span className="font-medium">{total}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">正常:</span>
          <span className="font-medium text-green-600">{closed}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">熔断:</span>
          <span className="font-medium text-red-600">{open}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">半开:</span>
          <span className="font-medium text-yellow-600">{halfOpen}</span>
        </div>
      </div>
    </div>
  )
})