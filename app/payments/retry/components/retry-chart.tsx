'use client'

/**
 * 重试图表组件
 * 显示重试趋势和统计图表
 */

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'
import { useRetryStats } from '@/hooks/use-retry-config'
import { cn } from '@/lib/utils'

// 自定义Tooltip组件
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium">{`日期: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {`${entry.dataKey === 'success_rate' ? '成功率' : 
               entry.dataKey === 'total_retries' ? '总重试' : 
               entry.dataKey === 'success_count' ? '成功次数' : 
               entry.dataKey === 'failure_count' ? '失败次数' : entry.dataKey}: ${
               entry.dataKey === 'success_rate' ? 
               (entry.value * 100).toFixed(1) + '%' : entry.value
             }`}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// 错误分布饼图
function ErrorDistributionChart({ data }: { data: Array<{ error_type: string; count: number; percentage: number }> }) {
  const COLORS = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', 
    '#ff00ff', '#00ffff', '#ffff00', '#ff0000'
  ]

  const chartData = data.map(item => ({
    name: item.error_type,
    value: item.count,
    percentage: item.percentage
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}

// 策略性能对比图
function StrategyPerformanceChart({ 
  data 
}: { 
  data: Array<{
    strategy_id: string;
    strategy_name: string;
    total_retries: number;
    success_rate: number;
    average_attempts: number;
  }> 
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="strategy_name" 
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis />
        <Tooltip 
          formatter={(value, name) => [
            name === 'success_rate' ? `${(value as number * 100).toFixed(1)}%` : value,
            name === 'success_rate' ? '成功率' : 
            name === 'total_retries' ? '总重试数' : '平均尝试次数'
          ]}
        />
        <Bar dataKey="success_rate" fill="#82ca9d" name="success_rate" />
        <Bar dataKey="average_attempts" fill="#8884d8" name="average_attempts" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function RetryChart() {
  const [timeRange, setTimeRange] = useState<number>(30)
  const { 
    stats, 
    loading, 
    error, 
    changeDateRange, 
    refreshStats,
    getSuccessRateTrend,
    getTopPerformingStrategy,
    getMostCommonError
  } = useRetryStats(timeRange)

  const [activeTab, setActiveTab] = useState('trend')

  const handleTimeRangeChange = (value: string) => {
    const days = parseInt(value)
    setTimeRange(days)
    changeDateRange(days)
  }

  const successRateTrend = getSuccessRateTrend()
  const topStrategy = getTopPerformingStrategy()
  const commonError = getMostCommonError()

  if (loading && !stats) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">加载图表数据...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-64 flex flex-col items-center justify-center">
        <p className="text-sm font-medium text-red-600 mb-2">图表加载失败</p>
        <p className="text-xs text-muted-foreground mb-4">{error}</p>
        <Button onClick={refreshStats} size="sm" variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          重试
        </Button>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">暂无数据</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 控制栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Select value={timeRange.toString()} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">最近7天</SelectItem>
              <SelectItem value="30">最近30天</SelectItem>
              <SelectItem value="90">最近90天</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={refreshStats}
            size="sm"
            variant="ghost"
            disabled={loading}
          >
            <RefreshCw className={cn("mr-2 h-3 w-3", loading && "animate-spin")} />
            刷新
          </Button>
        </div>

        {/* 关键指标 */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <span className="text-muted-foreground">总成功率:</span>
            <span className="font-medium">
              {(stats.success_rate * 100).toFixed(1)}%
            </span>
            {successRateTrend !== 0 && (
              <span className={cn(
                "flex items-center text-xs",
                successRateTrend > 0 ? "text-green-600" : "text-red-600"
              )}>
                {successRateTrend > 0 ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                {Math.abs(successRateTrend).toFixed(1)}%
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-muted-foreground">平均尝试:</span>
            <span className="font-medium">{stats.average_attempts.toFixed(1)}次</span>
          </div>
        </div>
      </div>

      {/* 图表标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trend">趋势分析</TabsTrigger>
          <TabsTrigger value="errors">错误分布</TabsTrigger>
          <TabsTrigger value="strategies">策略对比</TabsTrigger>
        </TabsList>

        <TabsContent value="trend" className="space-y-4">
          {/* 趋势图 */}
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={stats.daily_stats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="success_rate" 
                stroke="#82ca9d" 
                strokeWidth={2}
                dot={{ fill: '#82ca9d', strokeWidth: 2, r: 4 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="total_retries" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* 关键指标卡片 */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">最佳表现策略</CardTitle>
              </CardHeader>
              <CardContent>
                {topStrategy ? (
                  <div>
                    <p className="font-medium">{topStrategy.strategy_name}</p>
                    <p className="text-sm text-muted-foreground">
                      成功率: {(topStrategy.success_rate * 100).toFixed(1)}%
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">暂无数据</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">最常见错误</CardTitle>
              </CardHeader>
              <CardContent>
                {commonError ? (
                  <div>
                    <p className="font-medium">{commonError.error_type}</p>
                    <p className="text-sm text-muted-foreground">
                      占比: {commonError.percentage.toFixed(1)}% ({commonError.count}次)
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">暂无数据</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors">
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              错误类型分布 (总计 {stats.total_retries} 次重试)
            </div>
            {stats.most_common_errors.length > 0 ? (
              <>
                <ErrorDistributionChart data={stats.most_common_errors} />
                <div className="grid grid-cols-2 gap-2">
                  {stats.most_common_errors.slice(0, 6).map((error, index) => (
                    <div key={error.error_type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{error.error_type}</span>
                      <Badge variant="outline">
                        {error.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">暂无错误数据</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="strategies">
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              策略性能对比 (共 {stats.strategy_stats.length} 个策略)
            </div>
            {stats.strategy_stats.length > 0 ? (
              <>
                <StrategyPerformanceChart data={stats.strategy_stats} />
                <div className="grid grid-cols-1 gap-3">
                  {stats.strategy_stats.map((strategy) => (
                    <div key={strategy.strategy_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{strategy.strategy_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {strategy.total_retries} 次重试 • 平均 {strategy.average_attempts.toFixed(1)} 次尝试
                        </p>
                      </div>
                      <Badge 
                        variant={strategy.success_rate >= 0.8 ? 'default' : 'secondary'}
                        className={strategy.success_rate >= 0.8 ? 'bg-green-100 text-green-800' : ''}
                      >
                        {(strategy.success_rate * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">暂无策略数据</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}