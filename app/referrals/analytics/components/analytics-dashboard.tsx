'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ReferralAnalytics } from '../../types'
import { TrendingUp, TrendingDown, Minus, DollarSign, Users, Target, BarChart3 } from 'lucide-react'

interface AnalyticsDashboardProps {
  analytics: ReferralAnalytics
  loading?: boolean
}

export function AnalyticsDashboard({ analytics, loading = false }: AnalyticsDashboardProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        {/* 概览卡片骨架 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-16 bg-gray-100 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* 其他内容骨架 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-100 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-gray-100 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const overviewStats = [
    {
      label: '总推荐数',
      value: analytics.overview.total_referrals.toLocaleString(),
      icon: Users,
      color: 'text-blue-600'
    },
    {
      label: '总转化数',
      value: analytics.overview.total_conversions.toLocaleString(),
      icon: Target,
      color: 'text-green-600'
    },
    {
      label: '总收入',
      value: `¥${analytics.overview.total_revenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-purple-600'
    },
    {
      label: '平均转化价值',
      value: `¥${analytics.overview.average_conversion_value.toFixed(2)}`,
      icon: BarChart3,
      color: 'text-orange-600'
    }
  ]

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-600" />
  }

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600'
    if (current < previous) return 'text-red-600'
    return 'text-gray-600'
  }

  const getTrendText = (current: number, previous: number) => {
    const change = ((current - previous) / previous * 100)
    if (isNaN(change)) return '0%'
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
  }

  return (
    <div className="space-y-6">
      {/* 概览统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewStats.map((stat, index) => {
          const IconComponent = stat.icon
          return (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg bg-gray-50`}>
                      <IconComponent className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 趋势分析 */}
        <Card>
          <CardHeader>
            <CardTitle>趋势分析</CardTitle>
            <CardDescription>
              推荐数据的时间趋势变化
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.trends.slice(0, 6).map((trend, index) => {
                const previous = analytics.trends[index + 1]
                return (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex-1">
                      <div className="font-medium">{trend.period}</div>
                      <div className="text-sm text-muted-foreground">
                        {trend.referrals} 推荐 · {trend.conversions} 转化
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">¥{trend.revenue.toLocaleString()}</div>
                      {previous && (
                        <div className={`text-sm flex items-center ${getTrendColor(trend.revenue, previous.revenue)}`}>
                          {getTrendIcon(trend.revenue, previous.revenue)}
                          <span className="ml-1">{getTrendText(trend.revenue, previous.revenue)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* 渠道分析 */}
        <Card>
          <CardHeader>
            <CardTitle>渠道分析</CardTitle>
            <CardDescription>
              不同推荐渠道的表现对比
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.channels.map((channel, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{channel.channel}</div>
                    <Badge variant="outline">{(channel.conversion_rate * 100).toFixed(1)}%</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{channel.referrals} 推荐</span>
                    <span>{channel.conversions} 转化</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ 
                        width: `${Math.min(100, (channel.conversion_rate * 100))}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 活动表现 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>活动表现</CardTitle>
            <CardDescription>
              各个推荐活动的详细表现数据
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">活动名称</th>
                    <th className="text-left py-2">推荐数</th>
                    <th className="text-left py-2">转化数</th>
                    <th className="text-left py-2">收入</th>
                    <th className="text-left py-2">ROI</th>
                    <th className="text-left py-2">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.campaigns.map((campaign, index) => (
                    <tr key={index} className="border-b last:border-b-0">
                      <td className="py-3">
                        <div>
                          <div className="font-medium">{campaign.campaign.name}</div>
                          <div className="text-xs text-muted-foreground">{campaign.campaign.code}</div>
                        </div>
                      </td>
                      <td className="py-3">{campaign.performance.referrals}</td>
                      <td className="py-3">{campaign.performance.conversions}</td>
                      <td className="py-3">¥{campaign.performance.revenue.toLocaleString()}</td>
                      <td className="py-3">
                        <Badge 
                          variant={campaign.performance.roi > 0 ? "default" : "secondary"}
                          className={campaign.performance.roi > 0 ? "bg-green-100 text-green-800" : ""}
                        >
                          {campaign.performance.roi.toFixed(1)}x
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Badge 
                          variant={campaign.campaign.status === 'active' ? "default" : "secondary"}
                          className={
                            campaign.campaign.status === 'active' 
                              ? "bg-green-100 text-green-800" 
                              : campaign.campaign.status === 'paused'
                              ? "bg-orange-100 text-orange-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {campaign.campaign.status === 'active' ? '进行中' :
                           campaign.campaign.status === 'paused' ? '已暂停' :
                           campaign.campaign.status === 'ended' ? '已结束' : '草稿'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}