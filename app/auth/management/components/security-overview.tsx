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
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, Shield, TrendingUp, Users, Eye } from 'lucide-react'

// 模拟安全数据
const mockSecurityData = {
  overall_score: 8.7,
  user_behavior_score: 9.2,
  authentication_score: 8.1,
  system_security_score: 8.9,
  recommendations: [
    '建议启用更多用户的双因素认证',
    '检查异常登录模式用户',
    '更新密码策略以提高安全性'
  ],
  last_updated: '2024-01-15T10:30:00Z',
  recent_threats: [
    {
      type: 'bruteforce',
      severity: 'high',
      description: '检测到暴力破解尝试',
      affected_users: 3,
      time: '2小时前'
    },
    {
      type: 'suspicious_location',
      severity: 'medium', 
      description: '异常地理位置登录',
      affected_users: 8,
      time: '6小时前'
    }
  ],
  security_trends: {
    score_trend: '+0.3',
    threat_trend: '-12%',
    user_adoption: '+15%'
  }
}

export function SecurityOverview() {
  const [data, setData] = useState(mockSecurityData)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 模拟API加载
    const timer = setTimeout(() => {
      setLoading(false)
    }, 800)

    return () => clearTimeout(timer)
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

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'text-green-600'
    if (score >= 7) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadge = (score: number) => {
    if (score >= 9) return <Badge className="bg-green-100 text-green-800">优秀</Badge>
    if (score >= 7) return <Badge className="bg-yellow-100 text-yellow-800">良好</Badge>
    return <Badge variant="destructive">需要改进</Badge>
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">高风险</Badge>
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">中风险</Badge>
      case 'low':
        return <Badge className="bg-blue-100 text-blue-800">低风险</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* 安全评分总览 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">综合安全评分</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(data.overall_score)}`}>
              {data.overall_score.toFixed(1)}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              {getScoreBadge(data.overall_score)}
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                {data.security_trends.score_trend}
              </div>
            </div>
            <Progress value={data.overall_score * 10} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">用户行为评分</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(data.user_behavior_score)}`}>
              {data.user_behavior_score.toFixed(1)}
            </div>
            <Progress value={data.user_behavior_score * 10} className="mt-4" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">认证安全评分</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(data.authentication_score)}`}>
              {data.authentication_score.toFixed(1)}
            </div>
            <Progress value={data.authentication_score * 10} className="mt-4" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">系统安全评分</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(data.system_security_score)}`}>
              {data.system_security_score.toFixed(1)}
            </div>
            <Progress value={data.system_security_score * 10} className="mt-4" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* 安全威胁监控 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              最近安全威胁
            </CardTitle>
            <CardDescription>需要关注的安全事件</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recent_threats.map((threat, index) => (
                <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(threat.severity)}
                      <span className="text-sm font-medium">{threat.description}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {threat.affected_users} 用户受影响
                      </span>
                      <span>{threat.time}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="h-3 w-3 mr-1" />
                    查看
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 安全建议 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              安全建议
            </CardTitle>
            <CardDescription>基于当前安全状态的建议</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="h-2 w-2 bg-blue-500 rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="text-sm">{recommendation}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    执行
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 安全趋势 */}
      <Card>
        <CardHeader>
          <CardTitle>安全趋势分析</CardTitle>
          <CardDescription>过去30天的安全指标变化</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {data.security_trends.score_trend}
              </div>
              <div className="text-sm text-muted-foreground">安全评分变化</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {data.security_trends.threat_trend}
              </div>
              <div className="text-sm text-muted-foreground">威胁事件变化</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {data.security_trends.user_adoption}
              </div>
              <div className="text-sm text-muted-foreground">2FA采用率变化</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}