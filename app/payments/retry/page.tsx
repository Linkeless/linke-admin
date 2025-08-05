/**
 * 支付重试管理主页面
 * 提供重试概览、统计仪表板和快速操作入口
 */

import { Suspense } from 'react'
import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Settings, 
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

import { RetryOverview } from './components/retry-overview'
import { RetryChart } from './components/retry-chart'

export const metadata: Metadata = {
  title: '支付重试管理',
  description: '管理支付重试策略、监控重试记录和配置重试参数',
}

// 统计卡片组件
function StatsCard({ 
  title, 
  value, 
  description, 
  trend, 
  icon: Icon,
  variant = 'default'
}: {
  title: string
  value: string | number
  description: string
  trend?: { value: number; isPositive: boolean }
  icon: React.ComponentType<{ className?: string }>
  variant?: 'default' | 'success' | 'warning' | 'destructive'
}) {
  const getTrendColor = () => {
    if (!trend) return ''
    return trend.isPositive ? 'text-green-600' : 'text-red-600'
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'destructive':
        return 'border-red-200 bg-red-50'
      default:
        return ''
    }
  }

  return (
    <Card className={getVariantStyles()}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center text-xs text-muted-foreground">
          {description}
          {trend && (
            <span className={`ml-2 flex items-center ${getTrendColor()}`}>
              {trend.isPositive ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {Math.abs(trend.value)}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// 快速操作卡片组件
function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
  badge
}: {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: { text: string; variant?: 'default' | 'secondary' | 'destructive' | 'outline' }
}) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <Link href={href}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon className="h-5 w-5" />
              <CardTitle className="text-base">{title}</CardTitle>
            </div>
            {badge && (
              <Badge variant={badge.variant}>{badge.text}</Badge>
            )}
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Link>
    </Card>
  )
}

// 加载骨架组件
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* 统计卡片骨架 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 图表骨架 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function PaymentRetryPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">支付重试管理</h2>
          <p className="text-muted-foreground">
            管理支付重试策略，监控重试记录，优化支付成功率
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新数据
          </Button>
          <Button asChild>
            <Link href="/payments/retry/strategies/new">
              创建策略
            </Link>
          </Button>
        </div>
      </div>

      <Separator />

      {/* 主要内容 */}
      <Suspense fallback={<DashboardSkeleton />}>
        <div className="space-y-6">
          {/* 统计概览 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Suspense fallback={<Skeleton className="h-32" />}>
              <StatsCard
                title="活跃重试"
                value="24"
                description="正在进行的重试任务"
                icon={RefreshCw}
                variant="default"
              />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-32" />}>
              <StatsCard
                title="今日成功率"
                value="87.5%"
                description="今日重试成功率"
                trend={{ value: 2.5, isPositive: true }}
                icon={CheckCircle}
                variant="success"
              />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-32" />}>
              <StatsCard
                title="待处理"
                value="12"
                description="等待重试的支付"
                icon={Clock}
                variant="warning"
              />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-32" />}>
              <StatsCard
                title="失败重试"
                value="8"
                description="今日失败的重试"
                trend={{ value: 1.2, isPositive: false }}
                icon={XCircle}
                variant="destructive"
              />
            </Suspense>
          </div>

          {/* 图表和概览 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  重试趋势分析
                </CardTitle>
                <CardDescription>
                  过去30天的重试成功率和失败率趋势
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                  <RetryChart />
                </Suspense>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5" />
                  实时概览
                </CardTitle>
                <CardDescription>
                  当前系统状态和最近活动
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                  <RetryOverview />
                </Suspense>
              </CardContent>
            </Card>
          </div>

          {/* 快速操作 */}
          <div>
            <h3 className="text-lg font-medium mb-4">快速操作</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <QuickActionCard
                title="重试策略"
                description="管理和配置支付重试策略"
                href="/payments/retry/strategies"
                icon={Settings}
                badge={{ text: "5个策略", variant: "secondary" }}
              />
              <QuickActionCard
                title="重试记录"
                description="查看和分析重试历史记录"
                href="/payments/retry/records"
                icon={Activity}
                badge={{ text: "156条记录", variant: "secondary" }}
              />
              <QuickActionCard
                title="系统配置"
                description="调整全局重试配置参数"
                href="/payments/retry/config"
                icon={Settings}
              />
            </div>
          </div>

          {/* 系统状态和警告 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5" />
                系统状态
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">重试系统运行正常</span>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    正常
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium">部分支付网关响应较慢</span>
                  </div>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                    警告
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Suspense>
    </div>
  )
}