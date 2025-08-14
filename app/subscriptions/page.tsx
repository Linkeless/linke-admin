// 订阅管理主页面

'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Package, 
  Users, 
  Plus, 
  BarChart3, 
  Settings,
  ArrowRight,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from 'lucide-react'
import { 
  useSubscriptionPlans, 
  useUserSubscriptions,
  useExpiringSubscriptions
} from '@/hooks/queries/use-subscription'

export default function SubscriptionsPage() {
  const router = useRouter()

  // 使用React Query hooks获取统计数据
  const { data: plansData, isLoading: plansLoading, refetch: refetchPlans } = useSubscriptionPlans({
    limit: 100, // 获取所有计划用于统计
    enabled: true
  })
  
  const { data: subscriptionsData, isLoading: subscriptionsLoading, refetch: refetchSubscriptions } = useUserSubscriptions({
    limit: 100, // 获取更多数据用于统计
    enabled: true
  })
  
  const { data: expiringData, isLoading: expiringLoading, refetch: refetchExpiring } = useExpiringSubscriptions({
    limit: 50,
    enabled: true
  })

  // 计算实时统计数据
  const plans = plansData?.data?.items || []
  const subscriptions = subscriptionsData?.data?.items || []
  const expiringSubscriptions = expiringData?.data?.items || []
  
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active')
  const activePlans = plans.filter(p => p.status === 'active')
  
  // 计算总收入 (模拟计算)
  const totalRevenue = activeSubscriptions.reduce((sum, sub) => sum + (sub.price || 0), 0)
  
  // 计算支付成功率 (模拟数据)
  const successRate = Math.round((activeSubscriptions.length / Math.max(subscriptions.length, 1)) * 100 * 100) / 100

  // 统计数据是否正在加载
  const isStatsLoading = plansLoading || subscriptionsLoading || expiringLoading

  // 刷新所有数据
  const handleRefreshAll = () => {
    refetchPlans()
    refetchSubscriptions()
    refetchExpiring()
  }

  const navigationCards = [
    {
      title: '订阅计划管理',
      description: '创建和管理订阅套餐，配置价格、流量、计费周期等',
      icon: Package,
      href: '/subscriptions/plans',
      color: 'bg-blue-50 text-blue-600',
      actions: [
        { label: '管理计划', href: '/subscriptions/plans' },
        { label: '创建计划', href: '/subscriptions/plans/create' }
      ]
    },
    {
      title: '用户订阅管理',
      description: '管理用户订阅状态，处理续费、取消等操作',
      icon: Users,
      href: '/subscriptions/users',
      color: 'bg-green-50 text-green-600',
      actions: [
        { label: '查看订阅', href: '/subscriptions/users' },
        { label: '创建订阅', href: '/subscriptions/users/create' }
      ]
    },
    {
      title: '订单管理',
      description: '管理订阅相关的订单，包括支付状态、订单详情等',
      icon: ShoppingCart,
      href: '/subscriptions/orders',
      color: 'bg-indigo-50 text-indigo-600',
      actions: [
        { label: '查看订单', href: '/subscriptions/orders' },
        { label: '订单分析', href: '/subscriptions/analytics/orders' }
      ]
    },
    {
      title: '订阅告警',
      description: '监控订阅相关的告警信息，及时处理系统异常和用户问题',
      icon: AlertTriangle,
      href: '/subscriptions/alerts',
      color: 'bg-red-50 text-red-600',
      actions: [
        { label: '查看告警', href: '/subscriptions/alerts' },
        { label: '批量处理', href: '/subscriptions/alerts' }
      ]
    },
    {
      title: '订阅分析',
      description: '查看订阅数据统计和分析报告，了解业务趋势',
      icon: BarChart3,
      href: '/subscriptions/analytics',
      color: 'bg-purple-50 text-purple-600',
      actions: [
        { label: '数据报告', href: '/subscriptions/analytics' },
        { label: '收入统计', href: '/subscriptions/analytics' }
      ]
    },
    {
      title: '系统设置',
      description: '配置订阅相关的系统参数和业务规则',
      icon: Settings,
      href: '/subscriptions/settings',
      color: 'bg-orange-50 text-orange-600',
      actions: [
        { label: '基础设置', href: '/subscriptions/settings' },
        { label: '计费设置', href: '/subscriptions/billing-settings' }
      ]
    }
  ]

  // 基于真实数据的快速统计
  const quickStats = [
    { 
      label: '活跃订阅', 
      value: isStatsLoading ? '...' : activeSubscriptions.length.toLocaleString(), 
      change: '+12%', 
      color: 'text-green-600',
      icon: Users,
      loading: subscriptionsLoading
    },
    { 
      label: '总计划数', 
      value: isStatsLoading ? '...' : plans.length.toString(), 
      change: `活跃${activePlans.length}个`, 
      color: 'text-blue-600',
      icon: Package,
      loading: plansLoading
    },
    { 
      label: '本月收入', 
      value: isStatsLoading ? '...' : `¥${totalRevenue.toLocaleString()}`, 
      change: '+8.5%', 
      color: 'text-purple-600',
      icon: TrendingUp,
      loading: subscriptionsLoading
    },
    { 
      label: '即将过期', 
      value: isStatsLoading ? '...' : expiringSubscriptions.length.toString(), 
      change: '7天内', 
      color: expiringSubscriptions.length > 10 ? 'text-red-600' : 'text-orange-600',
      icon: AlertTriangle,
      loading: expiringLoading
    },
    { 
      label: '总订阅数', 
      value: isStatsLoading ? '...' : subscriptions.length.toLocaleString(), 
      change: '+15%', 
      color: 'text-indigo-600',
      icon: BarChart3,
      loading: subscriptionsLoading
    },
    { 
      label: '激活成功率', 
      value: isStatsLoading ? '...' : `${successRate}%`, 
      change: '+1.2%', 
      color: successRate > 90 ? 'text-emerald-600' : 'text-orange-600',
      icon: successRate > 90 ? TrendingUp : TrendingDown,
      loading: subscriptionsLoading
    }
  ]

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">订阅管理</h1>
          <p className="text-muted-foreground mt-2">
            管理订阅计划、用户订阅状态，监控业务数据和系统运行状态
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefreshAll}
          disabled={isStatsLoading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isStatsLoading ? 'animate-spin' : ''}`} />
          刷新数据
        </Button>
      </div>

      {/* 快速统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {quickStats.map((stat, index) => {
          const IconComponent = stat.icon
          return (
            <Card key={index} className={stat.loading ? 'animate-pulse' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <IconComponent className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`text-sm font-medium ${stat.color}`}>
                    {stat.change}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 主要功能模块 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {navigationCards.map((card, index) => {
          const IconComponent = card.icon
          return (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${card.color}`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl">{card.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {card.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {card.actions.map((action, actionIndex) => (
                      <Button
                        key={actionIndex}
                        variant={actionIndex === 0 ? "default" : "outline"}
                        size="sm"
                        onClick={() => router.push(action.href)}
                      >
                        {actionIndex === 0 && <Plus className="mr-2 h-4 w-4" />}
                        {action.label}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(card.href)}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 快速操作区域 */}
      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
          <CardDescription>
            常用的订阅管理操作，帮助您快速处理日常任务
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => router.push('/subscriptions/plans/create')}
            >
              <Plus className="h-5 w-5" />
              <span>创建新计划</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => router.push('/subscriptions/users/create')}
            >
              <Users className="h-5 w-5" />
              <span>创建用户订阅</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => router.push('/subscriptions/orders')}
            >
              <ShoppingCart className="h-5 w-5" />
              <span>查看订单</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => router.push('/subscriptions/alerts')}
            >
              <AlertTriangle className="h-5 w-5" />
              <span>处理告警</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => router.push('/subscriptions/analytics')}
            >
              <BarChart3 className="h-5 w-5" />
              <span>查看数据报告</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}