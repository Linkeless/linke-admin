'use client'

import React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { useIsMobile } from "@/hooks/use-mobile"
import { useRevenueTrend } from "@/hooks/queries/use-dashboard"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, TrendingUp, TrendingDown, BarChart3 } from "lucide-react"
import { ChartDataPoint, StatsPeriod } from "@/lib/stats-types"
import { cn } from "@/lib/utils"

const chartConfig = {
  revenue: {
    label: "收入",
    color: "hsl(var(--chart-1))",
  },
  orders: {
    label: "订单数",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

interface DashboardRevenueChartProps {
  period?: StatsPeriod
  className?: string
}

export const DashboardRevenueChart = React.memo<DashboardRevenueChartProps>(function DashboardRevenueChart({ 
  period = 'month',
  className
}) {
  const [selectedPeriod, setSelectedPeriod] = React.useState<StatsPeriod>(period)
  const isMobile = useIsMobile()

  // 使用React Query获取收入趋势数据
  const { 
    data: trendData, 
    isLoading, 
    error, 
    refetch,
    isRefetching,
    dataUpdatedAt
  } = useRevenueTrend({ 
    period: selectedPeriod,
    enabled: true
  })

  // 图表数据处理 - 使用useMemo缓存计算结果
  const chartData = React.useMemo(() => {
    if (!trendData?.trendData) return []
    return trendData.trendData
  }, [trendData])

  // 统计信息计算 - 使用useMemo缓存
  const statistics = React.useMemo(() => {
    if (!trendData) {
      return {
        totalRevenue: 0,
        averageDaily: 0,
        growthTrend: 0,
        formattedData: []
      }
    }

    return {
      totalRevenue: trendData.totalRevenue || 0,
      averageDaily: trendData.averageDaily || 0,
      growthTrend: trendData.growthTrend || 0,
      formattedData: trendData.formattedData || []
    }
  }, [trendData])

  // 格式化函数 - 使用useCallback缓存
  const formatCurrency = React.useCallback((value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }, [])

  const formatDate = React.useCallback((dateStr: string) => {
    const date = new Date(dateStr)
    switch (selectedPeriod) {
      case 'today':
      case 'week':
        return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
      case 'month':
        return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
      case 'quarter':
      case 'year':
        return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' })
      default:
        return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    }
  }, [selectedPeriod])

  const getPeriodLabel = React.useCallback((period: StatsPeriod) => {
    const labels = {
      today: '今日',
      week: '本周',
      month: '本月', 
      quarter: '本季度',
      year: '本年',
      all: '全部'
    }
    return labels[period] || period
  }, [])

  // 手动刷新处理函数
  const handleRefresh = React.useCallback(() => {
    refetch()
  }, [refetch])

  // 最后更新时间格式化
  const lastUpdated = React.useMemo(() => {
    if (!dataUpdatedAt) return null
    return new Date(dataUpdatedAt).toLocaleTimeString('zh-CN')
  }, [dataUpdatedAt])

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-9 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                图表加载失败
              </CardTitle>
              <CardDescription>{error?.message || '收入趋势数据获取失败'}</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefetching}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              重试
            </Button>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            收入趋势
            {statistics.growthTrend !== 0 && (
              <Badge variant={statistics.growthTrend > 0 ? "default" : "secondary"} className="ml-2">
                {statistics.growthTrend > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {Math.abs(statistics.growthTrend).toFixed(1)}%
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {getPeriodLabel(selectedPeriod)}收入变化趋势
            {lastUpdated && (
              <span className="ml-2 text-xs text-muted-foreground">
                · 更新于 {lastUpdated}
              </span>
            )}
          </CardDescription>
        </div>
        <div className="flex">
          <CardAction className="flex items-center gap-2 px-6 py-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefetching}
              className="mr-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
            <Select
              value={selectedPeriod}
              onValueChange={(value: StatsPeriod) => setSelectedPeriod(value)}
            >
              <SelectTrigger
                className="w-[160px] rounded-lg sm:ml-auto"
                aria-label="选择时间周期"
              >
                <SelectValue placeholder="选择周期" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="today" className="rounded-lg">
                  今日
                </SelectItem>
                <SelectItem value="week" className="rounded-lg">
                  本周
                </SelectItem>
                <SelectItem value="month" className="rounded-lg">
                  本月
                </SelectItem>
                <SelectItem value="quarter" className="rounded-lg">
                  本季度
                </SelectItem>
                <SelectItem value="year" className="rounded-lg">
                  本年
                </SelectItem>
              </SelectContent>
            </Select>
          </CardAction>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={formatDate}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatCurrency}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    const date = new Date(value as string)
                    return date.toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  }}
                  formatter={(value) => [
                    formatCurrency(value as number),
                    '收入'
                  ]}
                />
              }
            />
            <Area
              dataKey="value"
              type="natural"
              fill="var(--color-revenue)"
              fillOpacity={0.4}
              stroke="var(--color-revenue)"
              strokeWidth={2}
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
        
        {/* 增强的统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 text-sm">
          <div className="text-center">
            <div className="text-muted-foreground">
              {getPeriodLabel(selectedPeriod)}总收入
            </div>
            <div className="font-medium text-lg text-foreground">
              {formatCurrency(statistics.totalRevenue)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">
              平均收入
            </div>
            <div className="font-medium text-lg text-foreground">
              {formatCurrency(statistics.averageDaily)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">
              增长趋势
            </div>
            <div className={cn(
              "font-medium text-lg flex items-center justify-center gap-1",
              statistics.growthTrend > 0 ? "text-green-600" : 
              statistics.growthTrend < 0 ? "text-red-600" : "text-foreground"
            )}>
              {statistics.growthTrend > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : statistics.growthTrend < 0 ? (
                <TrendingDown className="h-4 w-4" />
              ) : null}
              {statistics.growthTrend > 0 ? '+' : ''}{statistics.growthTrend.toFixed(1)}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})