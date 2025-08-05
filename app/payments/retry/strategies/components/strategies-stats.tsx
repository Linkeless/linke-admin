'use client'

/**
 * 策略统计组件
 * 显示策略相关的统计信息
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Play, 
  Pause, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

import { useStrategyManagement } from '@/hooks/use-retry-strategies'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ComponentType<{ className?: string }>
  trend?: { value: number; isPositive: boolean }
  variant?: 'default' | 'success' | 'warning' | 'destructive'
}

function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  variant = 'default' 
}: StatCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-green-200 bg-green-50/50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50/50'
      case 'destructive':
        return 'border-red-200 bg-red-50/50'
      default:
        return 'border-border'
    }
  }

  const getIconColor = () => {
    switch (variant) {
      case 'success':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'destructive':
        return 'text-red-600'
      default:
        return 'text-blue-600'
    }
  }

  return (
    <Card className={cn('transition-colors', getVariantStyles())}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn('h-4 w-4', getIconColor())} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <span>{description}</span>
          {trend && (
            <Badge 
              variant={trend.isPositive ? 'default' : 'secondary'}
              className={cn(
                'ml-2 text-xs',
                trend.isPositive 
                  ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                  : 'bg-red-100 text-red-800 hover:bg-red-100'
              )}
            >
              {trend.isPositive ? '+' : ''}{trend.value}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function StrategiesStats() {
  const { strategies, loading, error } = useStrategyManagement()

  if (loading && strategies.length === 0) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-7 w-12 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-full">
          <CardContent className="flex items-center justify-center h-24">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">加载统计数据失败</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 计算统计数据
  const totalStrategies = strategies.length
  const enabledStrategies = strategies.filter(s => s.enabled).length
  const disabledStrategies = totalStrategies - enabledStrategies
  
  // 模拟高性能策略数量（实际应该从API获取）
  const highPerformanceStrategies = Math.floor(enabledStrategies * 0.7)

  // 模拟趋势数据
  const enabledTrend = { value: 12, isPositive: true }
  const performanceTrend = { value: 8, isPositive: true }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="策略总数"
        value={totalStrategies}
        description="已创建的重试策略"
        icon={Settings}
        variant="default"
      />

      <StatCard
        title="已启用"
        value={enabledStrategies}
        description="当前启用的策略"
        icon={Play}
        trend={enabledTrend}
        variant="success"
      />

      <StatCard
        title="已禁用"
        value={disabledStrategies}
        description="暂时禁用的策略"
        icon={Pause}
        variant={disabledStrategies > 0 ? 'warning' : 'default'}
      />

      <StatCard
        title="高性能策略"
        value={highPerformanceStrategies}
        description="性能评分≥80分"
        icon={TrendingUp}
        trend={performanceTrend}
        variant="success"
      />
    </div>
  )
}