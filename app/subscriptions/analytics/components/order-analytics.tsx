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
import { OrderAnalytics } from "@/lib/subscription-types"

interface OrderAnalyticsComponentProps {
  analytics: OrderAnalytics
}

export function OrderAnalyticsComponent({ analytics }: OrderAnalyticsComponentProps) {
  // 格式化货币
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(amount)
  }

  // 计算订单状态分布
  const { overview } = analytics
  const failureRate = (overview.failed_orders / overview.total_orders) * 100
  const pendingRate = (overview.pending_orders / overview.total_orders) * 100

  return (
    <div className="space-y-6">
      {/* 订单状态分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>订单状态分布</CardTitle>
            <CardDescription>不同状态订单的数量和占比</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>已完成订单</span>
                <span className="font-medium">{overview.completed_orders.toLocaleString()} ({((overview.completed_orders / overview.total_orders) * 100).toFixed(1)}%)</span>
              </div>
              <Progress value={(overview.completed_orders / overview.total_orders) * 100} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>待处理订单</span>
                <span className="font-medium">{overview.pending_orders.toLocaleString()} ({pendingRate.toFixed(1)}%)</span>
              </div>
              <Progress value={pendingRate} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>失败订单</span>
                <span className="font-medium">{overview.failed_orders.toLocaleString()} ({failureRate.toFixed(1)}%)</span>
              </div>
              <Progress value={failureRate} className="h-2" />
            </div>

            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium">关键指标</div>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">成功率</span>
                  <span className="font-medium">{overview.conversion_rate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">失败率</span>
                  <span className="font-medium">{failureRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">平均订单价值</span>
                  <span className="font-medium">{formatCurrency(overview.average_order_value)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 每日趋势 */}
        <Card>
          <CardHeader>
            <CardTitle>每日订单趋势</CardTitle>
            <CardDescription>过去7天的订单数量和收入变化</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.trends.map((item, index) => {
                const date = new Date(item.date)
                const dateStr = date.toLocaleDateString('zh-CN', { 
                  month: '1-digit', 
                  day: '1-digit',
                  weekday: 'short'
                })
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-16 text-sm font-medium">{dateStr}</div>
                      <div className="text-lg font-bold">{item.order_count}</div>
                      <div className="text-sm text-muted-foreground">订单</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(item.revenue)}</div>
                      <div className="text-xs text-muted-foreground">
                        成功率 {item.conversion_rate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 支付方式分析 */}
      <Card>
        <CardHeader>
          <CardTitle>支付方式分析</CardTitle>
          <CardDescription>不同支付方式的使用情况和收入贡献</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.payment_methods.map((method, index) => (
              <div key={method.method} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={index === 0 ? "default" : "outline"}>
                      {method.method}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {method.count.toLocaleString()} 笔
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(method.revenue)}</div>
                    <div className="text-xs text-muted-foreground">
                      {method.percentage.toFixed(1)}% 占比
                    </div>
                  </div>
                </div>
                <Progress value={method.percentage} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>平均单笔: {formatCurrency(method.revenue / method.count)}</span>
                  <span>使用频率: {((method.count / overview.total_orders) * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 地理分布分析 */}
      <Card>
        <CardHeader>
          <CardTitle>地理分布分析</CardTitle>
          <CardDescription>不同国家/地区的订单分布和收入情况</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.geographic_distribution.map((geo, index) => (
              <div key={geo.country} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={index === 0 ? "default" : "outline"}>
                      {geo.country}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {geo.order_count.toLocaleString()} 笔订单
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(geo.revenue)}</div>
                    <div className="text-xs text-muted-foreground">
                      {geo.percentage.toFixed(1)}% 占比
                    </div>
                  </div>
                </div>
                <Progress value={geo.percentage} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>平均订单: {formatCurrency(geo.revenue / geo.order_count)}</span>
                  <span>市场份额: {((geo.order_count / overview.total_orders) * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 综合统计表格 */}
      <Card>
        <CardHeader>
          <CardTitle>支付方式详细对比</CardTitle>
          <CardDescription>所有支付方式的详细性能指标</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">支付方式</th>
                  <th className="text-right py-2">订单数量</th>
                  <th className="text-right py-2">总收入</th>
                  <th className="text-right py-2">平均单价</th>
                  <th className="text-right py-2">收入占比</th>
                  <th className="text-right py-2">使用率</th>
                </tr>
              </thead>
              <tbody>
                {analytics.payment_methods.map((method) => {
                  const usageRate = (method.count / overview.total_orders) * 100
                  const avgValue = method.revenue / method.count
                  
                  return (
                    <tr key={method.method} className="border-b">
                      <td className="py-3">
                        <Badge variant="outline">{method.method}</Badge>
                      </td>
                      <td className="text-right py-3">
                        {method.count.toLocaleString()}
                      </td>
                      <td className="text-right py-3">
                        {formatCurrency(method.revenue)}
                      </td>
                      <td className="text-right py-3">
                        {formatCurrency(avgValue)}
                      </td>
                      <td className="text-right py-3">
                        <Badge variant="outline">
                          {method.percentage.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="text-right py-3">
                        <Badge variant="secondary">
                          {usageRate.toFixed(1)}%
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