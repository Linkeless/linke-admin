'use client'

import { useEffect, useState } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { dashboardService } from "@/lib/dashboard-service"
import { RevenueTrendData, ChartDataPoint, StatsPeriod } from "@/lib/stats-types"

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
}

export function DashboardRevenueChart({ period = 'month' }: DashboardRevenueChartProps) {
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<StatsPeriod>(period)
  const isMobile = useIsMobile()

  useEffect(() => {
    loadChartData()
  }, [selectedPeriod])

  const loadChartData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const trendData = await dashboardService.getRevenueTrend({ period: selectedPeriod })
      
      let chartData: ChartDataPoint[] = []
      switch (selectedPeriod) {
        case 'week':
        case 'today':
          chartData = trendData.daily
          break
        case 'month':
          chartData = trendData.weekly
          break
        case 'quarter':
        case 'year':
          chartData = trendData.monthly
          break
        default:
          chartData = trendData.monthly
      }
      
      setData(chartData)
    } catch (err) {
      console.error('加载收入趋势数据失败:', err)
      setError(err instanceof Error ? err.message : '加载图表数据失败')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
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
  }

  const getPeriodLabel = (period: StatsPeriod) => {
    const labels = {
      today: '今日',
      week: '本周',
      month: '本月', 
      quarter: '本季度',
      year: '本年',
      all: '全部'
    }
    return labels[period] || period
  }

  const totalRevenue = data.reduce((sum, item) => sum + item.value, 0)
  const avgRevenue = data.length > 0 ? totalRevenue / data.length : 0

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">图表加载失败</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>收入趋势</CardTitle>
          <CardDescription>
            {getPeriodLabel(selectedPeriod)}收入变化趋势
          </CardDescription>
        </div>
        <div className="flex">
          <CardAction className="flex items-center gap-2 px-6 py-4">
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
            data={data}
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
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
        
        {/* 统计信息 */}
        <div className="flex items-center justify-between border-t pt-4 text-sm">
          <div className="text-muted-foreground">
            {getPeriodLabel(selectedPeriod)}总收入: <span className="font-medium text-foreground">{formatCurrency(totalRevenue)}</span>
          </div>
          <div className="text-muted-foreground">
            平均收入: <span className="font-medium text-foreground">{formatCurrency(avgRevenue)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}