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
import { SubscriptionAnalytics } from "@/lib/subscription-types"
import { Package, TrendingUp, Users } from "lucide-react"

interface PlanDistributionProps {
  distribution: SubscriptionAnalytics['plan_distribution']
  overview: SubscriptionAnalytics['overview']
}

export function PlanDistribution({ distribution, overview }: PlanDistributionProps) {
  // 格式化货币
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(amount)
  }

  // 按收入排序
  const sortedByRevenue = [...distribution].sort((a, b) => b.revenue - a.revenue)
  
  // 按订阅数量排序
  const sortedByCount = [...distribution].sort((a, b) => b.subscription_count - a.subscription_count)

  // 计算总收入
  const totalRevenue = distribution.reduce((sum, item) => sum + item.revenue, 0)

  return (
    <div className="space-y-6">
      {/* 计划概览统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">计划总数</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{distribution.length}</div>
            <p className="text-xs text-muted-foreground">
              活跃的订阅计划
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总订阅数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {distribution.reduce((sum, item) => sum + item.subscription_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              所有计划的订阅总数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总收入贡献</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              所有计划的收入总和
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 按收入排序的计划分布 */}
        <Card>
          <CardHeader>
            <CardTitle>按收入排序的计划表现</CardTitle>
            <CardDescription>各订阅计划的收入贡献排名</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sortedByRevenue.map((plan, index) => (
              <div key={plan.plan_id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={index === 0 ? "default" : "outline"}>
                      #{index + 1}
                    </Badge>
                    <span className="font-medium">{plan.plan_name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(plan.revenue)}</div>
                    <div className="text-xs text-muted-foreground">
                      {plan.percentage.toFixed(1)}% 占比
                    </div>
                  </div>
                </div>
                <Progress value={plan.percentage} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{plan.subscription_count} 个订阅</span>
                  <span>平均单价: {formatCurrency(plan.revenue / plan.subscription_count)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 按订阅数量排序的计划分布 */}
        <Card>
          <CardHeader>
            <CardTitle>按订阅数量排序的计划热度</CardTitle>
            <CardDescription>各订阅计划的受欢迎程度排名</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sortedByCount.map((plan, index) => {
              const totalSubscriptions = distribution.reduce((sum, item) => sum + item.subscription_count, 0)
              const countPercentage = (plan.subscription_count / totalSubscriptions) * 100
              
              return (
                <div key={plan.plan_id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={index === 0 ? "default" : "outline"}>
                        #{index + 1}
                      </Badge>
                      <span className="font-medium">{plan.plan_name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{plan.subscription_count} 订阅</div>
                      <div className="text-xs text-muted-foreground">
                        {countPercentage.toFixed(1)}% 占比
                      </div>
                    </div>
                  </div>
                  <Progress value={countPercentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>收入: {formatCurrency(plan.revenue)}</span>
                    <span>ARPU: {formatCurrency(plan.revenue / plan.subscription_count)}</span>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* 计划性能对比表格 */}
      <Card>
        <CardHeader>
          <CardTitle>计划性能对比</CardTitle>
          <CardDescription>所有订阅计划的详细性能指标</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">计划名称</th>
                  <th className="text-right py-2">订阅数</th>
                  <th className="text-right py-2">收入</th>
                  <th className="text-right py-2">平均单价</th>
                  <th className="text-right py-2">收入占比</th>
                  <th className="text-right py-2">用户占比</th>
                </tr>
              </thead>
              <tbody>
                {distribution.map((plan) => {
                  const totalSubscriptions = distribution.reduce((sum, item) => sum + item.subscription_count, 0)
                  const userPercentage = (plan.subscription_count / totalSubscriptions) * 100
                  const avgPrice = plan.revenue / plan.subscription_count
                  
                  return (
                    <tr key={plan.plan_id} className="border-b">
                      <td className="py-3">
                        <div className="font-medium">{plan.plan_name}</div>
                      </td>
                      <td className="text-right py-3">
                        {plan.subscription_count.toLocaleString()}
                      </td>
                      <td className="text-right py-3">
                        {formatCurrency(plan.revenue)}
                      </td>
                      <td className="text-right py-3">
                        {formatCurrency(avgPrice)}
                      </td>
                      <td className="text-right py-3">
                        <Badge variant="outline">
                          {plan.percentage.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="text-right py-3">
                        <Badge variant="secondary">
                          {userPercentage.toFixed(1)}%
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}