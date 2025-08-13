'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { 
  BarChart3, 
  TrendingUp, 
  Clock,
  Users,
  Monitor,
  Smartphone
} from 'lucide-react'

import type { JwtAnalytics as JwtAnalyticsType } from '../types'

// 模拟JWT分析数据
const mockJwtAnalytics: JwtAnalyticsType = {
  total_active_tokens: 2847,
  tokens_issued_24h: 342,
  tokens_revoked_24h: 18,
  blacklisted_tokens: 25,
  avg_token_lifetime: 7.2,
  top_devices: [
    { device_type: 'desktop', count: 1245 },
    { device_type: 'mobile', count: 987 },
    { device_type: 'tablet', count: 426 },
    { device_type: 'unknown', count: 189 }
  ],
  hourly_usage: [
    { hour: '00:00', active_tokens: 156 },
    { hour: '01:00', active_tokens: 134 },
    { hour: '02:00', active_tokens: 112 },
    { hour: '03:00', active_tokens: 98 },
    { hour: '04:00', active_tokens: 87 },
    { hour: '05:00', active_tokens: 95 },
    { hour: '06:00', active_tokens: 123 },
    { hour: '07:00', active_tokens: 187 },
    { hour: '08:00', active_tokens: 245 },
    { hour: '09:00', active_tokens: 298 },
    { hour: '10:00', active_tokens: 324 },
    { hour: '11:00', active_tokens: 356 },
    { hour: '12:00', active_tokens: 378 },
    { hour: '13:00', active_tokens: 389 },
    { hour: '14:00', active_tokens: 367 },
    { hour: '15:00', active_tokens: 345 },
    { hour: '16:00', active_tokens: 334 },
    { hour: '17:00', active_tokens: 312 },
    { hour: '18:00', active_tokens: 289 },
    { hour: '19:00', active_tokens: 267 },
    { hour: '20:00', active_tokens: 234 },
    { hour: '21:00', active_tokens: 212 },
    { hour: '22:00', active_tokens: 189 },
    { hour: '23:00', active_tokens: 167 }
  ]
}

export function JwtAnalytics() {
  const [analytics, setAnalytics] = useState<JwtAnalyticsType>(mockJwtAnalytics)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000))
        setAnalytics(mockJwtAnalytics)
      } catch (error) {
        console.error('加载JWT分析数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-6 bg-muted animate-pulse rounded" />
                <div className="h-3 bg-muted animate-pulse rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-5 w-5 text-blue-600" />
      case 'desktop':
        return <Monitor className="h-5 w-5 text-green-600" />
      default:
        return <Monitor className="h-5 w-5 text-gray-600" />
    }
  }

  const getDeviceName = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return '移动设备'
      case 'desktop':
        return '桌面设备'
      case 'tablet':
        return '平板设备'
      default:
        return '未知设备'
    }
  }

  const maxHourlyUsage = Math.max(...analytics.hourly_usage.map(h => h.active_tokens))

  return (
    <div className="space-y-6">
      {/* 关键指标 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均令牌生存周期</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avg_token_lifetime} 天</div>
            <p className="text-xs text-muted-foreground">
              从签发到过期的平均时间
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">令牌使用率</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {((analytics.total_active_tokens / (analytics.total_active_tokens + analytics.blacklisted_tokens)) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              活跃令牌占总令牌的比例
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">撤销率</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {((analytics.tokens_revoked_24h / analytics.tokens_issued_24h) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              24小时内撤销的令牌比例
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* 设备类型分析 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              设备类型分析
            </CardTitle>
            <CardDescription>不同设备类型的令牌使用情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.top_devices.map((device, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getDeviceIcon(device.device_type)}
                    <div>
                      <div className="font-medium">{getDeviceName(device.device_type)}</div>
                      <div className="text-sm text-muted-foreground">
                        {((device.count / analytics.total_active_tokens) * 100).toFixed(1)}% 使用率
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{device.count}</div>
                    <div className="text-xs text-muted-foreground">令牌数</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 令牌健康度 */}
        <Card>
          <CardHeader>
            <CardTitle>令牌健康度评估</CardTitle>
            <CardDescription>基于使用模式的健康度分析</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>安全性评分</span>
                  <span className="font-medium text-green-600">92/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }} />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>使用效率</span>
                  <span className="font-medium text-blue-600">87/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '87%' }} />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>管理规范</span>
                  <span className="font-medium text-purple-600">95/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '95%' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 24小时使用模式 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            24小时使用模式
          </CardTitle>
          <CardDescription>每小时活跃令牌数量变化</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-1 grid-cols-12 lg:grid-cols-24">
            {analytics.hourly_usage.map((hour, index) => (
              <div key={index} className="text-center space-y-2">
                <div className="text-xs text-muted-foreground">
                  {hour.hour.split(':')[0]}
                </div>
                <div className="h-24 bg-gray-100 rounded flex items-end justify-center p-1">
                  <div 
                    className="w-full bg-blue-400 rounded-sm" 
                    style={{ height: `${(hour.active_tokens / maxHourlyUsage) * 100}%` }}
                  />
                </div>
                <div className="text-xs font-medium">{hour.active_tokens}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            峰值时段：13:00 ({maxHourlyUsage} 个活跃令牌)
          </div>
        </CardContent>
      </Card>
    </div>
  )
}