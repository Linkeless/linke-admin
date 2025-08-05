'use client'

/**
 * 重试概览组件
 * 显示实时重试状态和最近活动
 */

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { useRetryOverview } from '@/hooks/use-retry-config'
import { cn } from '@/lib/utils'

interface ActivityItemProps {
  type: 'retry_started' | 'retry_success' | 'retry_failed' | 'strategy_updated'
  message: string
  timestamp: string
  paymentId?: string
  strategyId?: string
}

function ActivityItem({ type, message, timestamp, paymentId }: ActivityItemProps) {
  const getIcon = () => {
    switch (type) {
      case 'retry_started':
        return <RefreshCw className="h-3 w-3 text-blue-500" />
      case 'retry_success':
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case 'retry_failed':
        return <XCircle className="h-3 w-3 text-red-500" />
      case 'strategy_updated':
        return <AlertTriangle className="h-3 w-3 text-orange-500" />
      default:
        return <Clock className="h-3 w-3 text-gray-500" />
    }
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return '刚刚'
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}小时前`
    return `${Math.floor(diffInMinutes / 1440)}天前`
  }

  return (
    <div className="flex items-start space-x-3 py-2">
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{message}</p>
        <div className="flex items-center space-x-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {getTimeAgo(timestamp)}
          </span>
          {paymentId && (
            <Badge variant="outline" className="text-xs">
              {paymentId.slice(-8)}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusIndicator({ 
  label, 
  value, 
  variant = 'default',
  pulse = false 
}: { 
  label: string
  value: string | number
  variant?: 'default' | 'success' | 'warning' | 'destructive'
  pulse?: boolean
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'warning':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'destructive':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  return (
    <div className={cn(
      'flex items-center justify-between px-3 py-2 rounded-lg border',
      getVariantStyles()
    )}>
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center space-x-1">
        {pulse && (
          <div className={cn(
            'w-2 h-2 rounded-full animate-pulse',
            variant === 'success' ? 'bg-green-500' :
            variant === 'warning' ? 'bg-orange-500' :
            variant === 'destructive' ? 'bg-red-500' : 'bg-blue-500'
          )} />
        )}
        <span className="text-sm font-bold">{value}</span>
      </div>
    </div>
  )
}

export function RetryOverview() {
  const { 
    overview, 
    loading, 
    error, 
    lastUpdated, 
    refreshOverview, 
    toggleAutoRefresh,
    getActivitySummary 
  } = useRetryOverview(true, 30000) // 30秒自动刷新

  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)

  const handleToggleAutoRefresh = () => {
    const newState = !autoRefreshEnabled
    setAutoRefreshEnabled(newState)
    toggleAutoRefresh(newState)
  }

  const activitySummary = getActivitySummary()

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <XCircle className="h-8 w-8 text-red-500 mb-2" />
        <p className="text-sm font-medium text-red-600 mb-2">加载失败</p>
        <p className="text-xs text-muted-foreground mb-4">{error}</p>
        <Button onClick={refreshOverview} size="sm" variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          重试
        </Button>
      </div>
    )
  }

  if (loading && !overview) {
    return (
      <div className="space-y-4">
        <div className="grid gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
        <Separator />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start space-x-3">
              <div className="w-3 h-3 bg-gray-100 rounded-full animate-pulse" />
              <div className="flex-1 space-y-1">
                <div className="h-4 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 bg-gray-100 rounded w-24 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 控制按钮 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            onClick={refreshOverview}
            size="sm"
            variant="ghost"
            disabled={loading}
          >
            <RefreshCw className={cn("mr-2 h-3 w-3", loading && "animate-spin")} />
            刷新
          </Button>
          <Button
            onClick={handleToggleAutoRefresh}
            size="sm"
            variant="ghost"
            className={autoRefreshEnabled ? 'text-green-600' : 'text-gray-600'}
          >
            <div className={cn(
              "mr-2 h-2 w-2 rounded-full",
              autoRefreshEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            )} />
            自动刷新
          </Button>
        </div>
        {lastUpdated && (
          <span className="text-xs text-muted-foreground">
            {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* 状态指标 */}
      <div className="grid gap-2">
        <StatusIndicator
          label="活跃重试"
          value={overview?.active_retries || 0}
          variant="default"
          pulse={!!overview?.active_retries}
        />
        <StatusIndicator
          label="等待处理"
          value={overview?.pending_retries || 0}
          variant="warning"
        />
        <StatusIndicator
          label="今日失败"
          value={overview?.failed_retries_today || 0}
          variant="destructive"
        />
        <StatusIndicator
          label="今日成功率"
          value={overview?.success_rate_today 
            ? `${(overview.success_rate_today * 100).toFixed(1)}%`
            : '0%'
          }
          variant={
            !overview?.success_rate_today ? 'default' :
            overview.success_rate_today >= 0.9 ? 'success' :
            overview.success_rate_today >= 0.7 ? 'warning' : 'destructive'
          }
        />
      </div>

      <Separator />

      {/* 最近活动 */}
      <div>
        <h4 className="text-sm font-medium mb-3 flex items-center">
          <Clock className="mr-2 h-4 w-4" />
          最近活动
        </h4>
        <ScrollArea className="h-48">
          {overview?.recent_activities && overview.recent_activities.length > 0 ? (
            <div className="space-y-1">
              {overview.recent_activities.map((activity, index) => (
                <ActivityItem
                  key={`${activity.id}-${index}`}
                  type={activity.type}
                  message={activity.message}
                  timestamp={activity.timestamp}
                  paymentId={activity.payment_id}
                  strategyId={activity.strategy_id}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Clock className="h-6 w-6 text-gray-400 mb-2" />
              <p className="text-sm text-muted-foreground">暂无最近活动</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* 系统健康状态 */}
      {activitySummary && (
        <>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-medium">系统状态</h4>
            <div className={cn(
              'p-3 rounded-lg text-sm',
              activitySummary.systemHealth === 'good' ? 'bg-green-50 text-green-700 border border-green-200' :
              activitySummary.systemHealth === 'warning' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
              activitySummary.systemHealth === 'critical' ? 'bg-red-50 text-red-700 border border-red-200' :
              'bg-gray-50 text-gray-700 border border-gray-200'
            )}>
              <div className="flex items-center space-x-2">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  activitySummary.systemHealth === 'good' ? 'bg-green-500' :
                  activitySummary.systemHealth === 'warning' ? 'bg-yellow-500' :
                  activitySummary.systemHealth === 'critical' ? 'bg-red-500' :
                  'bg-gray-500'
                )} />
                <span className="font-medium">
                  {activitySummary.systemHealth === 'good' ? '系统运行正常' :
                   activitySummary.systemHealth === 'warning' ? '系统运行异常' :
                   activitySummary.systemHealth === 'critical' ? '系统存在严重问题' :
                   '系统状态未知'}
                </span>
              </div>
              <div className="mt-2 text-xs space-y-1">
                <div>活跃任务: {activitySummary.totalActive}</div>
                <div>问题数量: {activitySummary.criticalIssues}</div>
                <div>近期成功: {activitySummary.recentSuccesses}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}