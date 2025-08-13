'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Shield,
  Globe,
  Clock,
  Target
} from 'lucide-react'

import type { SecurityPattern } from '../types'

// 模拟安全分析数据
const mockSecurityPatterns: SecurityPattern[] = [
  {
    pattern_type: 'login_time',
    risk_level: 'medium',
    description: '检测到异常登录时间模式，多个用户在深夜时段登录',
    affected_users: 23,
    first_detected: '2024-01-14T22:00:00Z',
    last_seen: '2024-01-15T03:30:00Z'
  },
  {
    pattern_type: 'location',
    risk_level: 'high',
    description: '发现多个账户从同一IP地址在短时间内登录',
    affected_users: 8,
    first_detected: '2024-01-15T08:15:00Z',
    last_seen: '2024-01-15T09:45:00Z'
  },
  {
    pattern_type: 'device',
    risk_level: 'low',
    description: '新设备类型登录增加，可能是用户升级设备',
    affected_users: 156,
    first_detected: '2024-01-12T10:00:00Z',
    last_seen: '2024-01-15T16:20:00Z'
  },
  {
    pattern_type: 'behavior',
    risk_level: 'critical',
    description: '检测到自动化工具登录模式，可能存在机器人攻击',
    affected_users: 5,
    first_detected: '2024-01-15T09:00:00Z',
    last_seen: '2024-01-15T10:15:00Z'
  }
]

const mockAnalyticsData = {
  threat_trends: {
    daily_threats: [
      { date: '1/10', count: 23 },
      { date: '1/11', count: 18 },
      { date: '1/12', count: 31 },
      { date: '1/13', count: 27 },
      { date: '1/14', count: 35 },
      { date: '1/15', count: 29 }
    ],
    threat_change: -17, // 相比昨天的变化百分比
  },
  geographic_analysis: [
    { country: '中国', attacks: 145, percentage: 45.2 },
    { country: '美国', attacks: 89, percentage: 27.8 },
    { country: '俄罗斯', attacks: 52, percentage: 16.2 },
    { country: '其他', attacks: 35, percentage: 10.8 }
  ],
  attack_vectors: [
    { method: '暴力破解', count: 156, trend: 12 },
    { method: '字典攻击', count: 89, trend: -8 },
    { method: '凭据填充', count: 67, trend: 23 },
    { method: '社会工程', count: 34, trend: -5 }
  ]
}

export function SecurityAnalytics() {
  const [patterns, setPatterns] = useState<SecurityPattern[]>([])
  const [analytics, setAnalytics] = useState(mockAnalyticsData)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000))
        setPatterns(mockSecurityPatterns)
        setAnalytics(mockAnalyticsData)
      } catch (error) {
        console.error('加载安全分析数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const getRiskLevelBadge = (level: string) => {
    switch (level) {
      case 'low':
        return <Badge className="bg-blue-100 text-blue-800">低风险</Badge>
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">中风险</Badge>
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">高风险</Badge>
      case 'critical':
        return <Badge variant="destructive">严重</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }

  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'login_time':
        return <Clock className="h-4 w-4" />
      case 'location':
        return <Globe className="h-4 w-4" />
      case 'device':
        return <Shield className="h-4 w-4" />
      case 'behavior':
        return <Target className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0) {
      return <TrendingUp className="h-3 w-3 text-red-500" />
    } else if (trend < 0) {
      return <TrendingDown className="h-3 w-3 text-green-500" />
    }
    return null
  }

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

  return (
    <div className="space-y-6">
      {/* 安全模式检测 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            安全模式检测
          </CardTitle>
          <CardDescription>
            自动识别的异常行为模式和潜在威胁
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {patterns.map((pattern, index) => (
              <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex items-start space-x-3">
                  {getPatternIcon(pattern.pattern_type)}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      {getRiskLevelBadge(pattern.risk_level)}
                      <span className="text-sm font-medium">
                        {pattern.pattern_type === 'login_time' && '异常登录时间'}
                        {pattern.pattern_type === 'location' && '地理位置异常'}
                        {pattern.pattern_type === 'device' && '设备模式变化'}
                        {pattern.pattern_type === 'behavior' && '行为异常'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{pattern.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>影响用户: {pattern.affected_users}</span>
                      <span>首次发现: {new Date(pattern.first_detected).toLocaleString('zh-CN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* 地理分析 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              地理位置分析
            </CardTitle>
            <CardDescription>攻击来源地区分布</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.geographic_analysis.map((geo, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{geo.country}</span>
                    <span className="font-medium">{geo.attacks} 次 ({geo.percentage}%)</span>
                  </div>
                  <Progress value={geo.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 攻击向量分析 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              攻击方式分析
            </CardTitle>
            <CardDescription>不同攻击方式的统计和趋势</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.attack_vectors.map((vector, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium text-sm">{vector.method}</div>
                    <div className="text-xs text-muted-foreground">{vector.count} 次尝试</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">
                      {Math.abs(vector.trend)}%
                    </span>
                    {getTrendIcon(vector.trend)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 威胁趋势 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            威胁趋势分析
          </CardTitle>
          <CardDescription>
            过去7天的威胁活动趋势
            <span className={`ml-2 text-sm font-medium ${
              analytics.threat_trends.threat_change > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              ({analytics.threat_trends.threat_change > 0 ? '+' : ''}{analytics.threat_trends.threat_change}%)
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-6">
            {analytics.threat_trends.daily_threats.map((day, index) => (
              <div key={index} className="text-center space-y-2">
                <div className="text-xs text-muted-foreground">{day.date}</div>
                <div className="h-20 bg-gray-100 rounded flex items-end justify-center p-1">
                  <div 
                    className="w-full bg-red-400 rounded-sm" 
                    style={{ height: `${(day.count / 35) * 100}%` }}
                  />
                </div>
                <div className="text-xs font-medium">{day.count}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}