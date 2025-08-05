'use client'

/**
 * 重试记录统计组件
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

import { useRetryRecordManagement } from '@/hooks/use-retry-records'
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
              {trend.isPositive ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {trend.isPositive ? '+' : ''}{trend.value}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function RecordsStats() {
  const { records, loading, error } = useRetryRecordManagement()

  if (loading && records.length === 0) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
  const totalRecords = records.length
  const pendingRecords = records.filter(r => r.status === 'pending').length
  const inProgressRecords = records.filter(r => r.status === 'in_progress').length
  const successRecords = records.filter(r => r.status === 'success').length
  const failedRecords = records.filter(r => r.status === 'failed').length
  const successRate = totalRecords > 0 ? ((successRecords / totalRecords) * 100).toFixed(1) : '0.0'

  // 模拟趋势数据
  const trends = {
    success: { value: 5.2, isPositive: true },
    failed: { value: 2.1, isPositive: false },
    pending: { value: 12.3, isPositive: false }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title="总记录数"
        value={totalRecords}
        description="今日重试记录总数"
        icon={Activity}
        variant="default"
      />

      <StatCard
        title="等待重试"
        value={pendingRecords}
        description="等待下次重试的记录"
        icon={Clock}
        trend={trends.pending}
        variant="warning"
      />

      <StatCard
        title="正在重试"
        value={inProgressRecords}
        description="当前正在执行的重试"
        icon={Activity}
        variant="default"
      />

      <StatCard
        title="重试成功"
        value={successRecords}
        description="成功完成的重试"
        icon={CheckCircle}
        trend={trends.success}
        variant="success"
      />

      <StatCard
        title="重试失败"
        value={failedRecords}
        description="最终失败的重试"
        icon={XCircle}
        trend={trends.failed}
        variant="destructive"
      />
    </div>
  )
}