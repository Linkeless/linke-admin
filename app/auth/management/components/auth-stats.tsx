'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Users, Shield, AlertTriangle, Key } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// 模拟数据 - 实际项目中应该从API获取
const mockStats = {
  total_users: 15847,
  active_sessions: 2341,
  failed_logins_24h: 127,
  locked_accounts: 8,
  security_incidents: 3,
  avg_security_score: 8.7,
  password_resets_24h: 23,
  new_registrations_24h: 42
}

export function AuthStats() {
  const [stats, setStats] = useState(mockStats)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 模拟API加载
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const getSecurityScoreColor = (score: number) => {
    if (score >= 9) return 'text-green-600'
    if (score >= 7) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSecurityScoreBadge = (score: number) => {
    if (score >= 9) return <Badge variant="default" className="bg-green-100 text-green-800">优秀</Badge>
    if (score >= 7) return <Badge variant="default" className="bg-yellow-100 text-yellow-800">良好</Badge>
    return <Badge variant="destructive">需要改进</Badge>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">总用户数</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_users.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            今日新增 +{stats.new_registrations_24h}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">活跃会话</CardTitle>
          <Key className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.active_sessions.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            当前在线用户数量
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">安全评分</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getSecurityScoreColor(stats.avg_security_score)}`}>
            {stats.avg_security_score.toFixed(1)}/10
          </div>
          <div className="flex items-center space-x-2">
            {getSecurityScoreBadge(stats.avg_security_score)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">安全事件</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.security_incidents}</div>
          <p className="text-xs text-muted-foreground">
            24小时内需关注
          </p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">登录统计</CardTitle>
          <CardDescription>最近24小时</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">失败登录</div>
              <div className="text-xl font-bold text-red-600">{stats.failed_logins_24h}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">密码重置</div>
              <div className="text-xl font-bold">{stats.password_resets_24h}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">账户状态</CardTitle>
          <CardDescription>当前状态分布</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">锁定账户</div>
              <div className="text-xl font-bold text-orange-600">{stats.locked_accounts}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">正常账户</div>
              <div className="text-xl font-bold text-green-600">
                {(stats.total_users - stats.locked_accounts).toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}