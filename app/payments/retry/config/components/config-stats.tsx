/**
 * 重试配置统计组件
 */

'use client'

import { useMemo } from 'react'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock, 
  AlertCircle, 
  Target,
  Zap,
  Database
} from 'lucide-react'

import { useRetryConfigManagement } from '@/hooks/use-retry-config'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function ConfigStats() {
  const { stats, loading } = useRetryConfigManagement()

  const performanceMetrics = useMemo(() => {
    if (!stats) return []
    
    return [
      {
        name: '成功率',
        value: stats.successRate || 0,
        trend: stats.successRateTrend || 0,
        icon: Target,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      {
        name: '平均重试次数',
        value: stats.avgRetries || 0,
        trend: stats.avgRetriesTrend || 0,
        icon: Activity,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      },
      {
        name: '平均延迟',
        value: `${stats.avgDelay || 0}ms`,
        trend: stats.avgDelayTrend || 0,
        icon: Clock,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      },
      {
        name: '熔断触发次数',
        value: stats.circuitBreakerTriggers || 0,
        trend: stats.circuitBreakerTrend || 0,
        icon: AlertCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      }
    ]
  }, [stats])

  const retryDistribution = useMemo(() => {
    if (!stats?.retryDistribution) return []
    
    return Object.entries(stats.retryDistribution).map(([retries, count]) => ({
      retries: `${retries}次`,
      count: count as number,
      percentage: ((count as number) / stats.totalRetries * 100).toFixed(1)
    }))
  }, [stats])

  const timeSeriesData = useMemo(() => {
    if (!stats?.timeSeries) return []
    
    return stats.timeSeries.map(item => ({
      time: new Date(item.timestamp).toLocaleDateString(),
      success: item.successCount,
      failure: item.failureCount,
      avgDelay: item.avgDelay
    }))
  }, [stats])

  const statusDistribution = useMemo(() => {
    if (!stats?.statusDistribution) return []
    
    return Object.entries(stats.statusDistribution).map(([status, count]) => ({
      name: status,
      value: count as number
    }))
  }, [stats])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">暂无统计数据</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 性能指标卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {performanceMetrics.map((metric) => {
          const Icon = metric.icon
          const isPositiveTrend = metric.trend > 0
          const TrendIcon = isPositiveTrend ? TrendingUp : TrendingDown
          
          return (
            <Card key={metric.name} className={`${metric.borderColor} border-l-4`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                    <Icon className={`h-4 w-4 ${metric.color}`} />
                  </div>
                  <div className="flex items-center space-x-1">
                    <TrendIcon className={`h-3 w-3 ${isPositiveTrend ? 'text-green-600' : 'text-red-600'}`} />
                    <span className={`text-xs font-medium ${isPositiveTrend ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(metric.trend).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <p className="text-sm text-muted-foreground">{metric.name}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Separator />

      {/* 图表区域 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 时间序列趋势 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              重试趋势分析
            </CardTitle>
            <CardDescription>
              最近30天的重试成功/失败趋势
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="success" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="成功次数"
                />
                <Line 
                  type="monotone" 
                  dataKey="failure" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  name="失败次数"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 重试次数分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="mr-2 h-5 w-5" />
              重试次数分布
            </CardTitle>
            <CardDescription>
              不同重试次数的频率分布
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={retryDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="retries" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value} (${retryDistribution.find(item => item.count === value)?.percentage}%)`,
                    '支付次数'
                  ]}
                />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 延迟分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              延迟分布趋势
            </CardTitle>
            <CardDescription>
              平均重试延迟的时间变化
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}ms`, '平均延迟']} />
                <Area 
                  type="monotone" 
                  dataKey="avgDelay" 
                  stroke="#F59E0B" 
                  fill="#FEF3C7" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 状态分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              支付状态分布
            </CardTitle>
            <CardDescription>
              不同支付状态的占比情况
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 详细统计信息 */}
      <Card>
        <CardHeader>
          <CardTitle>详细统计信息</CardTitle>
          <CardDescription>
            当前配置下的系统运行统计
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">总重试次数</p>
              <p className="text-2xl font-bold">{stats.totalRetries?.toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">总处理时间</p>
              <p className="text-2xl font-bold">{stats.totalProcessingTime?.toLocaleString()}ms</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">死信队列大小</p>
              <p className="text-2xl font-bold">{stats.deadLetterCount?.toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">活跃连接数</p>
              <p className="text-2xl font-bold">{stats.activeConnections}</p>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex flex-wrap gap-2">
            <Badge variant={stats.systemStatus === 'healthy' ? 'default' : 'destructive'}>
              系统状态: {stats.systemStatus === 'healthy' ? '健康' : '异常'}
            </Badge>
            <Badge variant="secondary">
              配置版本: v{stats.configVersion}
            </Badge>
            <Badge variant="outline">
              最后更新: {new Date(stats.lastUpdated || Date.now()).toLocaleString()}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}