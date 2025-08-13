"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { SubscriptionAnalytics } from "@/lib/subscription-types"

interface SubscriptionTrendsProps {
  trends: SubscriptionAnalytics['trends']
  userMetrics: SubscriptionAnalytics['user_metrics']
}

export function SubscriptionTrends({ trends, userMetrics }: SubscriptionTrendsProps) {
  // 计算总体趋势
  const totalNewSubscriptions = trends.reduce((sum, item) => sum + item.new_subscriptions, 0)
  const totalCancelledSubscriptions = trends.reduce((sum, item) => sum + item.cancelled_subscriptions, 0)
  const netGrowth = totalNewSubscriptions - totalCancelledSubscriptions

  // 格式化货币
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* 趋势概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">新增订阅</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalNewSubscriptions}</div>
            <p className="text-xs text-muted-foreground">过去7天</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">取消订阅</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalCancelledSubscriptions}</div>
            <p className="text-xs text-muted-foreground">过去7天</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">净增长</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netGrowth >= 0 ? '+' : ''}{netGrowth}
            </div>
            <p className="text-xs text-muted-foreground">新增 - 取消</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 每日趋势数据 */}
        <Card>
          <CardHeader>
            <CardTitle>每日订阅趋势</CardTitle>
            <CardDescription>过去7天的订阅变化情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trends.map((item, index) => {
                const date = new Date(item.date)
                const dateStr = date.toLocaleDateString('zh-CN', { 
                  month: '1-digit', 
                  day: '1-digit' 
                })
                const netChange = item.new_subscriptions - item.cancelled_subscriptions
                
                return (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-4">
                      <div className="w-16 text-sm font-medium">{dateStr}</div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-green-600">+{item.new_subscriptions}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-red-600">-{item.cancelled_subscriptions}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`text-sm font-medium ${netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {netChange >= 0 ? '+' : ''}{netChange}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(item.revenue)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* 用户留存率 */}
        <Card>
          <CardHeader>
            <CardTitle>用户留存率</CardTitle>
            <CardDescription>不同时间段的用户留存情况</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userMetrics.retention_rate.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{item.period}</span>
                  <span className="font-medium">{item.rate.toFixed(1)}%</span>
                </div>
                <Progress value={item.rate} className="h-2" />
              </div>
            ))}
            
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">平均订阅时长</div>
                  <div className="font-medium">{userMetrics.average_subscription_duration} 个月</div>
                </div>
                <div>
                  <div className="text-muted-foreground">客户生命周期价值</div>
                  <div className="font-medium">{formatCurrency(userMetrics.lifetime_value)}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 活跃用户趋势 */}
      <Card>
        <CardHeader>
          <CardTitle>活跃用户趋势</CardTitle>
          <CardDescription>每日活跃用户数量变化</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trends.map((item, index) => {
              const date = new Date(item.date)
              const dateStr = date.toLocaleDateString('zh-CN', { 
                month: '1-digit', 
                day: '1-digit',
                weekday: 'short'
              })
              const prevActiveUsers = index > 0 ? trends[index - 1].active_users : item.active_users
              const growth = item.active_users - prevActiveUsers
              
              return (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-20 text-sm font-medium">{dateStr}</div>
                    <div className="text-lg font-bold">{item.active_users.toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    {index > 0 && (
                      <div className={`text-sm ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {growth >= 0 ? '+' : ''}{growth}
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(item.revenue)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}