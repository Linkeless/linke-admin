/**
 * 使用量统计卡片组件
 */

'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Users, 
  Database, 
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle,
  Minus
} from 'lucide-react'

interface StatisticsData {
  totalUsage: number
  totalUsageTrend: number
  activeUsers: number
  activeUsersTrend: number
  peakUsage: number
  peakUsageTrend: number
  avgUsagePerUser: number
  avgUsagePerUserTrend: number
  systemLoad: number
  systemLoadTrend: number
  errorRate: number
  errorRateTrend: number
  responseTime: number
  responseTimeTrend: number
  capacityUtilization: number
  capacityUtilizationTrend: number
}

interface StatisticsCardsProps {
  data: StatisticsData | null
  loading?: boolean
  timeRange?: string
}

const StatisticsCards: React.FC<StatisticsCardsProps> = ({
  data,
  loading = false,
  timeRange = '24h'
}) => {
  const cards = useMemo(() => {
    if (!data) return []

    return [
      {
        id: 'total-usage',
        title: '总使用量',
        value: data.totalUsage.toLocaleString(),
        unit: 'MB',
        trend: data.totalUsageTrend,
        icon: Database,
        color: 'blue',
        description: `${timeRange === '24h' ? '今日' : timeRange === '7d' ? '本周' : '本月'}总流量消耗`
      },
      {
        id: 'active-users',
        title: '活跃用户',
        value: data.activeUsers.toLocaleString(),
        unit: '人',
        trend: data.activeUsersTrend,
        icon: Users,
        color: 'green',
        description: `${timeRange === '24h' ? '今日' : timeRange === '7d' ? '本周' : '本月'}活跃用户数`
      },
      {
        id: 'peak-usage',
        title: '峰值使用',
        value: data.peakUsage.toLocaleString(),
        unit: 'MB/h',
        trend: data.peakUsageTrend,
        icon: TrendingUp,
        color: 'orange',
        description: '单小时最高使用量'
      },
      {
        id: 'avg-usage-per-user',
        title: '人均使用',
        value: data.avgUsagePerUser.toFixed(1),
        unit: 'MB',
        trend: data.avgUsagePerUserTrend,
        icon: Activity,
        color: 'purple',
        description: '平均每用户使用量'
      },
      {
        id: 'system-load',
        title: '系统负载',
        value: data.systemLoad.toFixed(1),
        unit: '%',
        trend: data.systemLoadTrend,
        icon: Zap,
        color: data.systemLoad > 80 ? 'red' : data.systemLoad > 60 ? 'orange' : 'green',
        description: '当前系统负载水平'
      },
      {
        id: 'error-rate',
        title: '错误率',
        value: data.errorRate.toFixed(2),
        unit: '%',
        trend: data.errorRateTrend,
        icon: AlertTriangle,
        color: data.errorRate > 5 ? 'red' : data.errorRate > 1 ? 'orange' : 'green',
        description: '请求错误率'
      },
      {
        id: 'response-time',
        title: '响应时间',
        value: data.responseTime.toFixed(0),
        unit: 'ms',
        trend: data.responseTimeTrend,
        icon: Clock,
        color: data.responseTime > 1000 ? 'red' : data.responseTime > 500 ? 'orange' : 'green',
        description: '平均响应时间'
      },
      {
        id: 'capacity-utilization',
        title: '容量利用率',
        value: data.capacityUtilization.toFixed(1),
        unit: '%',
        trend: data.capacityUtilizationTrend,
        icon: Database,
        color: data.capacityUtilization > 90 ? 'red' : data.capacityUtilization > 70 ? 'orange' : 'green',
        description: '系统容量使用率'
      }
    ]
  }, [data, timeRange])

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          icon: 'text-blue-600 bg-blue-50',
          border: 'border-l-blue-500'
        }
      case 'green':
        return {
          icon: 'text-green-600 bg-green-50',
          border: 'border-l-green-500'
        }
      case 'orange':
        return {
          icon: 'text-orange-600 bg-orange-50',
          border: 'border-l-orange-500'
        }
      case 'purple':
        return {
          icon: 'text-purple-600 bg-purple-50',
          border: 'border-l-purple-500'
        }
      case 'red':
        return {
          icon: 'text-red-600 bg-red-50',
          border: 'border-l-red-500'
        }
      default:
        return {
          icon: 'text-gray-600 bg-gray-50',
          border: 'border-l-gray-500'
        }
    }
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 1) return TrendingUp
    if (trend < -1) return TrendingDown
    return Minus
  }

  const getTrendColor = (trend: number, isNegativeGood = false) => {
    if (Math.abs(trend) <= 1) return 'text-gray-500'
    
    const isPositive = trend > 0
    if (isNegativeGood) {
      return isPositive ? 'text-red-500' : 'text-green-500'
    } else {
      return isPositive ? 'text-green-500' : 'text-red-500'
    }
  }

  const getStatusBadge = (id: string, value: number) => {
    switch (id) {
      case 'system-load':
        if (value > 80) return <Badge variant="destructive">高负载</Badge>
        if (value > 60) return <Badge variant="secondary">中负载</Badge>
        return <Badge variant="default" className="bg-green-100 text-green-800">正常</Badge>
      
      case 'error-rate':
        if (value > 5) return <Badge variant="destructive">高错误</Badge>
        if (value > 1) return <Badge variant="secondary">有错误</Badge>
        return <Badge variant="default" className="bg-green-100 text-green-800">正常</Badge>
      
      case 'response-time':
        if (value > 1000) return <Badge variant="destructive">响应慢</Badge>
        if (value > 500) return <Badge variant="secondary">响应较慢</Badge>
        return <Badge variant="default" className="bg-green-100 text-green-800">响应快</Badge>
      
      case 'capacity-utilization':
        if (value > 90) return <Badge variant="destructive">容量紧张</Badge>
        if (value > 70) return <Badge variant="secondary">容量较高</Badge>
        return <Badge variant="default" className="bg-green-100 text-green-800">容量充足</Badge>
      
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
                <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">暂无统计数据</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        const TrendIcon = getTrendIcon(card.trend)
        const colorClasses = getColorClasses(card.color)
        const trendColor = getTrendColor(
          card.trend, 
          ['error-rate', 'response-time', 'system-load'].includes(card.id)
        )
        const statusBadge = getStatusBadge(card.id, parseFloat(card.value.replace(/,/g, '')))

        return (
          <Card key={card.id} className={`${colorClasses.border} border-l-4`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${colorClasses.icon}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex items-center space-x-1">
                  <TrendIcon className={`h-3 w-3 ${trendColor}`} />
                  <span className={`text-xs font-medium ${trendColor}`}>
                    {Math.abs(card.trend).toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-bold">{card.value}</span>
                    <span className="text-sm text-muted-foreground">{card.unit}</span>
                  </div>
                  {statusBadge}
                </div>
                
                <div>
                  <p className="text-sm font-medium">{card.title}</p>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </div>

                {/* 容量类指标显示进度条 */}
                {(['system-load', 'capacity-utilization'].includes(card.id)) && (
                  <div className="mt-3">
                    <Progress 
                      value={parseFloat(card.value.replace(/,/g, ''))} 
                      className="h-2"
                    />
                  </div>
                )}

                {/* 错误率和响应时间的健康状态指示 */}
                {(['error-rate', 'response-time'].includes(card.id)) && (
                  <div className="mt-2 flex items-center space-x-1">
                    {parseFloat(card.value.replace(/,/g, '')) <= (card.id === 'error-rate' ? 1 : 500) ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 text-orange-500" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {parseFloat(card.value.replace(/,/g, '')) <= (card.id === 'error-rate' ? 1 : 500) ? '健康' : '需关注'}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export default StatisticsCards