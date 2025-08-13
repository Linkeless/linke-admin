"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Clock,
  UserCheck,
  UserX
} from "lucide-react"
import { SubscriptionAnalytics, OrderAnalytics } from "@/lib/subscription-types"

interface AnalyticsDashboardProps {
  analytics: SubscriptionAnalytics
  orderAnalytics?: OrderAnalytics | null
}

export function AnalyticsDashboard({ analytics, orderAnalytics }: AnalyticsDashboardProps) {
  const { overview } = analytics

  // 计算转化率
  const conversionRate = overview.total_subscriptions > 0 
    ? ((overview.active_subscriptions / overview.total_subscriptions) * 100).toFixed(1)
    : "0.0"

  // 格式化货币
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(amount)
  }

  // 格式化百分比
  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  return (
    <div className="space-y-6">
      {/* 核心指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总订阅数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.total_subscriptions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              活跃率 {conversionRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">月度经常性收入</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overview.monthly_recurring_revenue)}</div>
            <p className="text-xs text-muted-foreground">
              增长率 {formatPercentage(overview.growth_rate)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均每用户收入</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overview.average_revenue_per_user)}</div>
            <p className="text-xs text-muted-foreground">
              客户生命周期价值预估
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">流失率</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.churn_rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              月度流失率
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 订阅状态分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>订阅状态分布</CardTitle>
            <CardDescription>各种订阅状态的数量和占比</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-green-600" />
                <span className="text-sm">活跃订阅</span>
              </div>
              <div className="text-right">
                <div className="font-medium">{overview.active_subscriptions}</div>
                <div className="text-xs text-muted-foreground">
                  {((overview.active_subscriptions / overview.total_subscriptions) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
            <Progress 
              value={(overview.active_subscriptions / overview.total_subscriptions) * 100} 
              className="h-2"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm">试用中</span>
              </div>
              <div className="text-right">
                <div className="font-medium">{overview.trial_subscriptions}</div>
                <div className="text-xs text-muted-foreground">
                  {((overview.trial_subscriptions / overview.total_subscriptions) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
            <Progress 
              value={(overview.trial_subscriptions / overview.total_subscriptions) * 100} 
              className="h-2"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">已过期</span>
              </div>
              <div className="text-right">
                <div className="font-medium">{overview.expired_subscriptions}</div>
                <div className="text-xs text-muted-foreground">
                  {((overview.expired_subscriptions / overview.total_subscriptions) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
            <Progress 
              value={(overview.expired_subscriptions / overview.total_subscriptions) * 100} 
              className="h-2"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserX className="h-4 w-4 text-red-600" />
                <span className="text-sm">已取消</span>
              </div>
              <div className="text-right">
                <div className="font-medium">{overview.cancelled_subscriptions}</div>
                <div className="text-xs text-muted-foreground">
                  {((overview.cancelled_subscriptions / overview.total_subscriptions) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
            <Progress 
              value={(overview.cancelled_subscriptions / overview.total_subscriptions) * 100} 
              className="h-2"
            />
          </CardContent>
        </Card>

        {/* 收入概览 */}
        <Card>
          <CardHeader>
            <CardTitle>收入概览</CardTitle>
            <CardDescription>收入相关的关键指标</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <div className="font-medium">总收入</div>
                <div className="text-sm text-muted-foreground">所有时间</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{formatCurrency(overview.total_revenue)}</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">月度经常性收入</div>
                <div className="text-sm text-muted-foreground">MRR</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{formatCurrency(overview.monthly_recurring_revenue)}</div>
                <div className="text-xs text-green-600">{formatPercentage(overview.growth_rate)}</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">年度经常性收入</div>
                <div className="text-sm text-muted-foreground">ARR</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{formatCurrency(overview.annual_recurring_revenue)}</div>
              </div>
            </div>

            {orderAnalytics && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">平均订单价值</div>
                  <div className="text-sm text-muted-foreground">AOV</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{formatCurrency(orderAnalytics.overview.average_order_value)}</div>
                  <div className="text-xs text-muted-foreground">
                    转化率 {orderAnalytics.overview.conversion_rate.toFixed(1)}%
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}