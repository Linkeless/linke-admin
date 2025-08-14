'use client'

import { 
  TrendingDown, 
  TrendingUp, 
  Users, 
  UserPlus, 
  UserCheck,
  Chrome,
  Github,
  MessageCircle,
  User
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useUserStats } from "@/hooks/queries/use-users"
import { userService } from "@/lib/user-service"

interface UserStatsCardsProps {
  className?: string
}

export function UserStatsCards({ className }: UserStatsCardsProps) {
  // 使用React Query hook获取统计数据
  const { data: statsResponse, isLoading, error } = useUserStats()
  
  // 提取统计数据
  const data = statsResponse?.code === 0 ? statsResponse.data : null

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('zh-CN').format(num)
  }

  const calculateGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous * 100).toFixed(1)
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return <Chrome className="size-4" />
      case 'github':
        return <Github className="size-4" />
      case 'telegram':
        return <MessageCircle className="size-4" />
      default:
        return <User className="size-4" />
    }
  }

  const getProviderName = (provider: string) => {
    const providerNames: { [key: string]: string } = {
      google: 'Google',
      github: 'GitHub',
      telegram: 'Telegram',
      local: '本地账号'
    }
    return providerNames[provider] || provider
  }

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 ${className}`}>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24" />
            </CardHeader>
            <CardFooter>
              <Skeleton className="h-4 w-32" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">加载数据失败</CardTitle>
            <CardDescription>{error?.message || '获取用户统计数据失败'}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!data) return null

  // 计算增长率（使用模拟数据，实际应该从API获取历史数据）
  const monthlyGrowth = calculateGrowthRate(data.new_users_this_month || 0, (data.new_users_this_month || 0) * 0.8)
  const activeRate = data.total_users > 0 ? ((data.active_users / data.total_users) * 100).toFixed(1) : '0'

  // 获取主要OAuth提供商
  const topProviders = Object.entries(data.users_by_provider || {})
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)

  return (
    <div className={`*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 ${className}`}>
      {/* 总用户数 */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>总用户数</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(data.total_users || 0)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Users />
              活跃率 {activeRate}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <UserCheck className="size-4" />
            活跃用户 {formatNumber(data.active_users || 0)} 人
          </div>
          <div className="text-muted-foreground">
            {Object.entries(data.users_by_role || {}).map(([role, count]) => 
              `${role === 'admin' ? '管理员' : role === 'user' ? '普通用户' : role} ${count}人`
            ).join(' / ')}
          </div>
        </CardFooter>
      </Card>

      {/* 本月新增 */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>本月新增用户</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(data.new_users_this_month || 0)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {parseFloat(monthlyGrowth) >= 0 ? <TrendingUp /> : <TrendingDown />}
              {parseFloat(monthlyGrowth) >= 0 ? '+' : ''}{monthlyGrowth}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <UserPlus className="size-4" />
            今日新增 {data.new_users_today || 0} 人
          </div>
          <div className="text-muted-foreground">
            本周新增 {data.new_users_this_week || 0} 人
          </div>
        </CardFooter>
      </Card>

      {/* 用户状态分布 */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>用户状态</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber((data.users_by_status && data.users_by_status.active) || 0)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <UserCheck />
              活跃
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex justify-between w-full">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              未激活 {(data.users_by_status && data.users_by_status.inactive) || 0}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              已封禁 {(data.users_by_status && data.users_by_status.banned) || 0}
            </span>
          </div>
          <div className="text-muted-foreground">
            暂停用户 {(data.users_by_status && data.users_by_status.suspended) || 0} 人
          </div>
        </CardFooter>
      </Card>

      {/* 登录方式分布 */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>登录方式</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {topProviders.length > 0 ? formatNumber(topProviders[0][1]) : '0'}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {topProviders.length > 0 && getProviderIcon(String(topProviders[0][0]))}
              {topProviders.length > 0 ? getProviderName(String(topProviders[0][0])) : 'N/A'}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="space-y-1 w-full">
            {topProviders.slice(1, 3).map(([provider, count]) => (
              <div key={provider} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {getProviderIcon(String(provider))}
                  {getProviderName(String(provider))}
                </span>
                <span className="font-medium">{formatNumber(count)}</span>
              </div>
            ))}
          </div>
          {topProviders.length === 0 && (
            <div className="text-muted-foreground">
              暂无登录数据
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}