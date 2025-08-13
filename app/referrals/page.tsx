// 推荐系统概览页面

'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  TrendingUp, 
  Gift, 
  BarChart3, 
  Plus, 
  ArrowRight,
  DollarSign,
  Target,
  Award
} from 'lucide-react'

export default function ReferralsPage() {
  const router = useRouter()

  const navigationCards = [
    {
      title: '推荐记录管理',
      description: '查看和管理所有推荐记录，处理审批和支付流程',
      icon: Users,
      href: '/referrals/records',
      color: 'bg-blue-50 text-blue-600',
      actions: [
        { label: '查看记录', href: '/referrals/records' },
        { label: '批量操作', href: '/referrals/records?tab=bulk' }
      ]
    },
    {
      title: '营销活动管理',
      description: '创建和管理推荐营销活动，配置奖励规则和活动参数',
      icon: Target,
      href: '/referrals/campaigns',
      color: 'bg-green-50 text-green-600',
      actions: [
        { label: '管理活动', href: '/referrals/campaigns' },
        { label: '创建活动', href: '/referrals/campaigns/create' }
      ]
    },
    {
      title: '数据分析',
      description: '查看推荐系统的详细分析报告和统计数据',
      icon: BarChart3,
      href: '/referrals/analytics',
      color: 'bg-purple-50 text-purple-600',
      actions: [
        { label: '分析报告', href: '/referrals/analytics' },
        { label: '统计概览', href: '/referrals/analytics/overview' }
      ]
    },
    {
      title: '邀请码管理',
      description: '管理推荐邀请码的生成、分发和使用情况',
      icon: Gift,
      href: '/referrals/invite-codes',
      color: 'bg-orange-50 text-orange-600',
      actions: [
        { label: '管理邀请码', href: '/referrals/invite-codes' },
        { label: '批量生成', href: '/referrals/invite-codes?action=batch-create' }
      ]
    }
  ]

  // 快速统计数据（模拟数据，实际使用时需要从API获取）
  const quickStats = [
    { 
      label: '总推荐数', 
      value: '2,847', 
      change: '+15.2%', 
      color: 'text-blue-600',
      icon: Users,
      description: '所有推荐记录总数'
    },
    { 
      label: '待审核', 
      value: '156', 
      change: '+8', 
      color: 'text-orange-600',
      icon: Award,
      description: '等待审核的推荐'
    },
    { 
      label: '本月奖励', 
      value: '¥38,920', 
      change: '+12.8%', 
      color: 'text-green-600',
      icon: DollarSign,
      description: '本月发放的奖励总额'
    },
    { 
      label: '转化率', 
      value: '23.4%', 
      change: '+2.1%', 
      color: 'text-purple-600',
      icon: TrendingUp,
      description: '推荐转化成功率'
    }
  ]

  // 最近活动数据（模拟数据）
  const recentActivities = [
    {
      type: 'approval',
      title: '批准了 12 个推荐记录',
      description: '来自 Summer Campaign 的推荐奖励',
      time: '2 分钟前',
      amount: '¥2,400'
    },
    {
      type: 'campaign',
      title: '创建了新的推广活动',
      description: '秋季特惠推荐活动已上线',
      time: '1 小时前',
      amount: null
    },
    {
      type: 'payout',
      title: '处理了推荐奖励支付',
      description: '�� 8 位推荐人发放奖励',
      time: '3 小时前',
      amount: '¥5,600'
    },
    {
      type: 'referral',
      title: '新增推荐记录',
      description: '用户 john@example.com 推荐成功',
      time: '5 小时前',
      amount: '¥200'
    }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'approval': return Award
      case 'campaign': return Target
      case 'payout': return DollarSign
      case 'referral': return Users
      default: return Users
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'approval': return 'text-green-600'
      case 'campaign': return 'text-blue-600'
      case 'payout': return 'text-purple-600'
      case 'referral': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">推荐系统</h1>
        <p className="text-muted-foreground mt-2">
          管理推荐营销活动、处理推荐奖励，监控推荐系统运行状态和数据分析
        </p>
      </div>

      {/* 快速统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
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
                      <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                    </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 主要功能模块 */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        <CardTitle className="text-lg">{card.title}</CardTitle>
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
        </div>

        {/* 最近活动 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>最近活动</CardTitle>
              <CardDescription>
                推荐系统的最新动态和操作记录
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => {
                  const IconComponent = getActivityIcon(activity.type)
                  const iconColor = getActivityColor(activity.type)
                  
                  return (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-gray-50 mt-1`}>
                        <IconComponent className={`h-4 w-4 ${iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                          {activity.amount && (
                            <p className={`text-xs font-medium ${iconColor}`}>
                              {activity.amount}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 快速操作区域 */}
      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
          <CardDescription>
            常用的推荐系统管理操作，帮助您快速处理日常任务
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => router.push('/referrals/campaigns/create')}
            >
              <Target className="h-5 w-5" />
              <span>创建推广活动</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => router.push('/referrals/records?status=pending')}
            >
              <Award className="h-5 w-5" />
              <span>审核推荐记录</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => router.push('/referrals/records?action=payout')}
            >
              <DollarSign className="h-5 w-5" />
              <span>处理奖励支付</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => router.push('/referrals/analytics')}
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