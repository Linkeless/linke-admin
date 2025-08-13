'use client'

import { useEffect, useState, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  SubscriptionAnalytics, 
  OrderAnalytics 
} from "@/lib/subscription-types"
import { AnalyticsDashboard } from "./components/analytics-dashboard"
import { SubscriptionTrends } from "./components/subscription-trends"
import { PlanDistribution } from "./components/plan-distribution"
import { RevenueMetrics } from "./components/revenue-metrics"

export default function SubscriptionAnalyticsPage() {
  const [subscriptionAnalytics, setSubscriptionAnalytics] = useState<SubscriptionAnalytics | null>(null)
  const [orderAnalytics, setOrderAnalytics] = useState<OrderAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30天前
    to: new Date()
  })

  // 模拟数据加载
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 模拟订阅分析数据
      const mockSubscriptionAnalytics: SubscriptionAnalytics = {
        overview: {
          total_subscriptions: 1248,
          active_subscriptions: 987,
          trial_subscriptions: 156,
          expired_subscriptions: 78,
          cancelled_subscriptions: 27,
          total_revenue: 245680,
          monthly_recurring_revenue: 18950,
          annual_recurring_revenue: 227400,
          average_revenue_per_user: 248.95,
          churn_rate: 2.8,
          growth_rate: 12.5
        },
        trends: [
          { date: '2024-01-01', new_subscriptions: 45, cancelled_subscriptions: 8, revenue: 15420, active_users: 920 },
          { date: '2024-01-02', new_subscriptions: 52, cancelled_subscriptions: 6, revenue: 16890, active_users: 966 },
          { date: '2024-01-03', new_subscriptions: 38, cancelled_subscriptions: 12, revenue: 14230, active_users: 992 },
          { date: '2024-01-04', new_subscriptions: 61, cancelled_subscriptions: 4, revenue: 18750, active_users: 1049 },
          { date: '2024-01-05', new_subscriptions: 47, cancelled_subscriptions: 9, revenue: 16340, active_users: 1087 },
          { date: '2024-01-06', new_subscriptions: 55, cancelled_subscriptions: 7, revenue: 17680, active_users: 1135 },
          { date: '2024-01-07', new_subscriptions: 43, cancelled_subscriptions: 11, revenue: 15920, active_users: 1167 }
        ],
        plan_distribution: [
          { plan_id: 1, plan_name: '基础版月付', subscription_count: 456, revenue: 45600, percentage: 18.6 },
          { plan_id: 2, plan_name: '专业版月付', subscription_count: 312, revenue: 93600, percentage: 38.1 },
          { plan_id: 3, plan_name: '企业版月付', subscription_count: 189, revenue: 75600, percentage: 30.8 },
          { plan_id: 4, plan_name: '基础版年付', subscription_count: 156, revenue: 18720, percentage: 7.6 },
          { plan_id: 5, plan_name: '专业版年付', subscription_count: 98, revenue: 35280, percentage: 14.4 },
          { plan_id: 6, plan_name: '企业版年付', subscription_count: 37, revenue: 17760, percentage: 7.2 }
        ],
        user_metrics: {
          lifetime_value: 892.45,
          average_subscription_duration: 8.7,
          retention_rate: [
            { period: '1个月', rate: 94.2 },
            { period: '3个月', rate: 87.6 },
            { period: '6个月', rate: 79.3 },
            { period: '12个月', rate: 68.9 }
          ]
        }
      }

      // 模拟订单分析数据
      const mockOrderAnalytics: OrderAnalytics = {
        overview: {
          total_orders: 2156,
          completed_orders: 2034,
          pending_orders: 87,
          failed_orders: 35,
          total_revenue: 287340,
          average_order_value: 133.28,
          conversion_rate: 94.3
        },
        trends: [
          { date: '2024-01-01', order_count: 67, revenue: 8940, conversion_rate: 92.5 },
          { date: '2024-01-02', order_count: 73, revenue: 9730, conversion_rate: 95.1 },
          { date: '2024-01-03', order_count: 54, revenue: 7210, conversion_rate: 91.2 },
          { date: '2024-01-04', order_count: 89, revenue: 11860, conversion_rate: 96.8 },
          { date: '2024-01-05', order_count: 76, revenue: 10140, conversion_rate: 93.7 },
          { date: '2024-01-06', order_count: 82, revenue: 10930, conversion_rate: 95.4 },
          { date: '2024-01-07', order_count: 69, revenue: 9200, conversion_rate: 92.8 }
        ],
        payment_methods: [
          { method: '支付宝', count: 867, revenue: 115620, percentage: 40.3 },
          { method: '微信支付', count: 642, revenue: 85630, percentage: 29.8 },
          { method: '信用卡', count: 398, revenue: 53070, percentage: 18.5 },
          { method: 'PayPal', count: 187, revenue: 24930, percentage: 8.7 },
          { method: '银行转账', count: 62, revenue: 8090, percentage: 2.8 }
        ],
        geographic_distribution: [
          { country: '中国', order_count: 1543, revenue: 205820, percentage: 71.6 },
          { country: '美国', order_count: 234, revenue: 31220, percentage: 10.9 },
          { country: '日本', order_count: 167, revenue: 22290, percentage: 7.8 },
          { country: '韩国', order_count: 123, revenue: 16410, percentage: 5.7 },
          { country: '其他', order_count: 89, revenue: 11600, percentage: 4.0 }
        ]
      }

      setSubscriptionAnalytics(mockSubscriptionAnalytics)
      setOrderAnalytics(mockOrderAnalytics)
    } catch (error) {
      console.error('加载分析数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="flex flex-col">
        <PageHeader 
          title="订阅分析" 
          description="订阅业务数据分析和趋势报告"
        />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">加载中...</p>
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
        <Button variant="outline" onClick={loadData}>
          刷新数据
        </Button>
      </PageHeader>
      
      <main className="flex-1 p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="trends">趋势分析</TabsTrigger>
            <TabsTrigger value="plans">计划分布</TabsTrigger>
            <TabsTrigger value="revenue">收入分析</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {subscriptionAnalytics && (
              <AnalyticsDashboard 
                analytics={subscriptionAnalytics}
                orderAnalytics={orderAnalytics}
              />
            )}
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            {subscriptionAnalytics && (
              <SubscriptionTrends 
                trends={subscriptionAnalytics.trends}
                userMetrics={subscriptionAnalytics.user_metrics}
              />
            )}
          </TabsContent>

          <TabsContent value="plans" className="space-y-6">
            {subscriptionAnalytics && (
              <PlanDistribution 
                distribution={subscriptionAnalytics.plan_distribution}
                overview={subscriptionAnalytics.overview}
              />
            )}
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            {subscriptionAnalytics && orderAnalytics && (
              <RevenueMetrics 
                subscriptionAnalytics={subscriptionAnalytics}
                orderAnalytics={orderAnalytics}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}