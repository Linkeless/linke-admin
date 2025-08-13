"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { SubscriptionAnalytics, OrderAnalytics } from "@/lib/subscription-types"
import { DollarSign, CreditCard, Globe, TrendingUp } from "lucide-react"

interface RevenueMetricsProps {
  subscriptionAnalytics: SubscriptionAnalytics
  orderAnalytics: OrderAnalytics
}

export function RevenueMetrics({ subscriptionAnalytics, orderAnalytics }: RevenueMetricsProps) {
  // 格式化货币
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(amount)
  }

  // 计算总收入
  const totalOrderRevenue = orderAnalytics.payment_methods.reduce((sum, method) => sum + method.revenue, 0)

  return (
    <div className="space-y-6">
      {/* 收入概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">订阅总收入</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(subscriptionAnalytics.overview.total_revenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              所有订阅收入
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">订单总收入</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(orderAnalytics.overview.total_revenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              所有订单收入
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均订单价值</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(orderAnalytics.overview.average_order_value)}
            </div>
            <p className="text-xs text-muted-foreground">
              AOV
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">订单转化率</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orderAnalytics.overview.conversion_rate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              支付成功率
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 支付方式分布 */}
        <Card>
          <CardHeader>
            <CardTitle>支付方式收入分布</CardTitle>
            <CardDescription>不同支付方式的收入贡献情况</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {orderAnalytics.payment_methods.map((method, index) => (
              <div key={method.method} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={index === 0 ? "default" : "outline"}>
                      {method.method}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {method.count} 笔订单
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(method.revenue)}</div>
                    <div className="text-xs text-muted-foreground">
                      {method.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <Progress value={method.percentage} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  平均单笔: {formatCurrency(method.revenue / method.count)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 地理分布 */}
        <Card>
          <CardHeader>
            <CardTitle>地理收入分布</CardTitle>
            <CardDescription>不同地区的订单收入分布</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {orderAnalytics.geographic_distribution.map((geo, index) => (
              <div key={geo.country} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={index === 0 ? "default" : "outline"}>
                      {geo.country}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {geo.order_count} 笔订单
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(geo.revenue)}</div>
                    <div className="text-xs text-muted-foreground">
                      {geo.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <Progress value={geo.percentage} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  平均单笔: {formatCurrency(geo.revenue / geo.order_count)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* 收入趋势对比 */}
      <Card>
        <CardHeader>
          <CardTitle>每日收入趋势</CardTitle>
          <CardDescription>订阅收入和订单收入的每日变化对比</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {subscriptionAnalytics.trends.map((subTrend, index) => {
              const orderTrend = orderAnalytics.trends[index]
              if (!orderTrend) return null
              
              const date = new Date(subTrend.date)
              const dateStr = date.toLocaleDateString('zh-CN', { 
                month: '1-digit', 
                day: '1-digit',
                weekday: 'short'
              })
              
              return (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium">{dateStr}</div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-muted-foreground">
                        活跃用户: {subTrend.active_users.toLocaleString()}
                      </div>
                      <div className="text-muted-foreground">
                        转化率: {orderTrend.conversion_rate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-600">订阅收入</span>
                        <span className="font-medium">{formatCurrency(subTrend.revenue)}</span>
                      </div>
                      <Progress 
                        value={(subTrend.revenue / Math.max(...subscriptionAnalytics.trends.map(t => t.revenue))) * 100} 
                        className="h-2"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">订单收入</span>
                        <span className="font-medium">{formatCurrency(orderTrend.revenue)}</span>
                      </div>
                      <Progress 
                        value={(orderTrend.revenue / Math.max(...orderAnalytics.trends.map(t => t.revenue))) * 100} 
                        className="h-2"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-muted-foreground">
                    订单数量: {orderTrend.order_count} | 新增订阅: {subTrend.new_subscriptions} | 取消订阅: {subTrend.cancelled_subscriptions}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 收入指标总结 */}
      <Card>
        <CardHeader>
          <CardTitle>收入指标总结</CardTitle>
          <CardDescription>关键收入指标的汇总统计</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(subscriptionAnalytics.overview.monthly_recurring_revenue)}
              </div>
              <div className="text-sm text-muted-foreground">月度经常性收入 (MRR)</div>
            </div>
            
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(subscriptionAnalytics.overview.annual_recurring_revenue)}
              </div>
              <div className="text-sm text-muted-foreground">年度经常性收入 (ARR)</div>
            </div>
            
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(subscriptionAnalytics.overview.average_revenue_per_user)}
              </div>
              <div className="text-sm text-muted-foreground">平均每用户收入 (ARPU)</div>
            </div>
            
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(subscriptionAnalytics.user_metrics.lifetime_value)}
              </div>
              <div className="text-sm text-muted-foreground">客户生命周期价值 (CLV)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}