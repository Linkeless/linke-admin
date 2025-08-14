'use client'

import { useState, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { BarChart3, RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnalyticsDashboard } from "./components/analytics-dashboard"
import { SubscriptionTrends } from "./components/subscription-trends"
import { PlanDistribution } from "./components/plan-distribution"
import { RevenueMetrics } from "./components/revenue-metrics"
import { useSubscriptionAnalytics, useOrderAnalytics, analyticsQueryUtils } from "@/hooks/queries/use-analytics"

export default function SubscriptionAnalyticsPage() {
  const [dateRange, setDateRange] = useState(() => analyticsQueryUtils.getDefaultDateRange())

  // 格式化日期范围为API参数
  const formattedDateRange = analyticsQueryUtils.formatDateRange(dateRange.from, dateRange.to)

  // 使用React Query hooks
  const { 
    data: subscriptionAnalytics, 
    isLoading: subscriptionLoading, 
    error: subscriptionError,
    refetch: refetchSubscription 
  } = useSubscriptionAnalytics({
    ...formattedDateRange,
    enabled: true
  })

  const { 
    data: orderAnalytics, 
    isLoading: orderLoading, 
    error: orderError,
    refetch: refetchOrder 
  } = useOrderAnalytics({
    ...formattedDateRange,
    enabled: true
  })

  // 统一的加载状态
  const loading = subscriptionLoading || orderLoading
  const hasError = subscriptionError || orderError

  // 刷新所有数据
  const handleRefreshData = useCallback(() => {
    refetchSubscription()
    refetchOrder()
  }, [refetchSubscription, refetchOrder])

  // 错误处理
  if (hasError) {
    return (
      <div className="flex flex-col">
        <PageHeader 
          title="订阅分析" 
          description="订阅业务数据分析和趋势报告"
        />
        <main className="flex-1 p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-destructive mb-4">加载分析数据失败</p>
                <Button onClick={handleRefreshData} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  重试
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // 加载状态
  if (loading && !subscriptionAnalytics && !orderAnalytics) {
    return (
      <div className="flex flex-col">
        <PageHeader 
          title="订阅分析" 
          description="订阅业务数据分析和趋势报告"
        />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <p>加载中...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="订阅分析" 
        description="订阅业务数据分析和趋势报告"
      >
        <Button 
          variant="outline" 
          onClick={handleRefreshData}
          disabled={loading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          刷新数据
        </Button>
      </PageHeader>
      
      <main className="flex-1 p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" disabled={loading}>概览</TabsTrigger>
            <TabsTrigger value="trends" disabled={loading}>趋势分析</TabsTrigger>
            <TabsTrigger value="plans" disabled={loading}>计划分布</TabsTrigger>
            <TabsTrigger value="revenue" disabled={loading}>收入分析</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {loading && !subscriptionAnalytics ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <p>加载概览数据中...</p>
                </div>
              </div>
            ) : subscriptionAnalytics ? (
              <AnalyticsDashboard 
                analytics={subscriptionAnalytics}
                orderAnalytics={orderAnalytics}
                loading={loading}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            {loading && !subscriptionAnalytics ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <p>加载趋势数据中...</p>
                </div>
              </div>
            ) : subscriptionAnalytics ? (
              <SubscriptionTrends 
                trends={subscriptionAnalytics.trends}
                userMetrics={subscriptionAnalytics.user_metrics}
                loading={loading}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="plans" className="space-y-6">
            {loading && !subscriptionAnalytics ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <p>加载计划分布数据中...</p>
                </div>
              </div>
            ) : subscriptionAnalytics ? (
              <PlanDistribution 
                distribution={subscriptionAnalytics.plan_distribution}
                overview={subscriptionAnalytics.overview}
                loading={loading}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            {loading && (!subscriptionAnalytics || !orderAnalytics) ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <p>加载收入分析数据中...</p>
                </div>
              </div>
            ) : subscriptionAnalytics && orderAnalytics ? (
              <RevenueMetrics 
                subscriptionAnalytics={subscriptionAnalytics}
                orderAnalytics={orderAnalytics}
                loading={loading}
              />
            ) : null}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}