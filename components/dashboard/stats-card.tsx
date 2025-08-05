'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// 加载中的骨架屏组件 - 使用React.memo优化
const StatsCardSkeleton = React.memo(function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
        <div className="h-4 w-4 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
        <div className="h-3 w-24 bg-muted animate-pulse rounded" />
      </CardContent>
    </Card>
  )
})

// 统计卡片组件接口定义
interface StatsCardProps {
  title: string
  value: string | number
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: React.ElementType
  loading?: boolean
  trend?: number | null
  subtitle?: string
}

// 统计卡片组件 - 使用React.memo优化
export const StatsCard = React.memo<StatsCardProps>(function StatsCard({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon,
  loading = false,
  trend,
  subtitle
}: {
  title: string
  value: string | number
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: React.ElementType
  loading?: boolean
  trend?: number | null
  subtitle?: string
}) {
  if (loading) {
    return <StatsCardSkeleton />
  }

  const getTrendIcon = () => {
    if (!trend) return null
    
    if (trend > 0.7) {
      return <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
    } else if (trend > 0.4) {
      return <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
    } else {
      return <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
    }
  }

  return (
    <Card className="transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {getTrendIcon()}
        </div>
        <Icon className={`h-4 w-4 transition-colors ${
          changeType === 'positive' ? 'text-green-500' : 
          changeType === 'negative' ? 'text-red-500' : 
          'text-muted-foreground'
        }`} />
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="space-y-1">
          <p className={`text-xs font-medium ${
            changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 
            changeType === 'negative' ? 'text-red-600 dark:text-red-400' : 
            'text-muted-foreground'
          }`}>
            {change}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
})