'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Target, BarChart3, TrendingUp, Users } from 'lucide-react'
import { toast } from 'sonner'

import { ReferralCampaignResponse, CampaignQueryParams } from '../types'
import { CampaignTable } from './components'

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<ReferralCampaignResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)
  
  // 分页状态
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  // 模拟数据加载函数 - 实际使用时需要替换为真实的API调用
  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true)
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 模拟数据 - 实际使用时从API获取
      const mockCampaigns: ReferralCampaignResponse[] = [
        {
          id: 1,
          name: '夏季推荐特惠',
          code: 'SUMMER2024',
          description: '夏季特惠推荐活动，推荐好友获得双倍奖励',
          campaign_type: 'seasonal',
          status: 'active',
          created_at: '2024-06-01T00:00:00Z',
          updated_at: '2024-06-01T00:00:00Z',
          starts_at: '2024-06-01T00:00:00Z',
          ends_at: '2024-08-31T23:59:59Z',
          referrer_reward_type: 'fixed',
          referrer_reward_amount: 100,
          referrer_reward_currency: 'CNY',
          referrer_reward_cap: 1000,
          referee_reward_type: 'fixed',
          referee_reward_amount: 50,
          referee_reward_currency: 'CNY',
          max_referrals: 10,
          requires_approval: true,
          total_referrals: 156,
          conversion_rate: 0.23,
          created_by_id: 1,
          created_by: {
            id: 1,
            username: 'admin',
            email: 'admin@example.com',
            full_name: '系统管理员'
          }
        },
        {
          id: 2,
          name: '常规推荐计划',
          code: 'EVERGREEN',
          description: '长期有效的推荐奖励计划',
          campaign_type: 'evergreen',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          referrer_reward_type: 'percentage',
          referrer_reward_amount: 10,
          referrer_reward_currency: 'CNY',
          requires_approval: false,
          total_referrals: 892,
          conversion_rate: 0.31,
          created_by_id: 1,
          created_by: {
            id: 1,
            username: 'admin',
            email: 'admin@example.com',
            full_name: '系统管理员'
          }
        },
        {
          id: 3,
          name: '新用户限时活动',
          code: 'NEWUSER2024',
          description: '专为新用户推出的限时推荐活动',
          campaign_type: 'limited',
          status: 'paused',
          created_at: '2024-03-01T00:00:00Z',
          updated_at: '2024-03-15T00:00:00Z',
          starts_at: '2024-03-01T00:00:00Z',
          ends_at: '2024-12-31T23:59:59Z',
          referrer_reward_type: 'tiered',
          referrer_reward_amount: 50,
          referrer_reward_currency: 'CNY',
          max_referrals: 5,
          requires_approval: true,
          total_referrals: 67,
          conversion_rate: 0.18,
          created_by_id: 1,
          created_by: {
            id: 1,
            username: 'admin',
            email: 'admin@example.com',
            full_name: '系统管理员'
          }
        }
      ]
      
      setCampaigns(mockCampaigns)
      setTotalItems(mockCampaigns.length)
    } catch (error) {
      console.error('加载营销活动失败:', error)
      toast.error('加载营销活动失败，请重试')
      setCampaigns([])
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }, [pagination.pageIndex, pagination.pageSize])

  // 查看活动详情
  const handleViewDetail = useCallback((campaignId: number) => {
    router.push(`/referrals/campaigns/${campaignId}`)
  }, [router])

  // 编辑活动
  const handleEdit = useCallback((campaignId: number) => {
    router.push(`/referrals/campaigns/${campaignId}/edit`)
  }, [router])

  // 切换活动状态
  const handleToggleStatus = useCallback(async (campaignId: number, status: 'active' | 'paused') => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      
      toast.success(`活动已${status === 'active' ? '恢复' : '暂停'}`)
      loadCampaigns()
    } catch (error) {
      console.error('更新活动状态失败:', error)
      toast.error('更新活动状态失败，请重试')
    }
  }, [loadCampaigns])

  // 结束活动
  const handleEndCampaign = useCallback(async (campaignId: number) => {
    if (!confirm('确定要结束此活动吗？此操作不可撤销。')) return

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      
      toast.success('活动已结束')
      loadCampaigns()
    } catch (error) {
      console.error('结束活动失败:', error)
      toast.error('结束活动失败，请重试')
    }
  }, [loadCampaigns])

  // 活动更新后的回调
  const handleCampaignUpdated = useCallback(() => {
    loadCampaigns()
  }, [loadCampaigns])

  // 初始加载
  useEffect(() => {
    loadCampaigns()
  }, [loadCampaigns])

  // 统计数据（模拟）
  const stats = [
    {
      label: '总活动数',
      value: campaigns.length.toString(),
      change: '+2',
      color: 'text-blue-600',
      icon: Target,
      description: '所有推荐活动总数'
    },
    {
      label: '进行中',
      value: campaigns.filter(c => c.status === 'active').length.toString(),
      change: '+1',
      color: 'text-green-600',
      icon: TrendingUp,
      description: '正在进行的活动'
    },
    {
      label: '总推荐数',
      value: campaigns.reduce((sum, c) => sum + c.total_referrals, 0).toString(),
      change: '+156',
      color: 'text-purple-600',
      icon: Users,
      description: '所有活动的推荐总数'
    },
    {
      label: '平均转化率',
      value: `${(campaigns.reduce((sum, c) => sum + c.conversion_rate, 0) / campaigns.length * 100).toFixed(1)}%`,
      change: '+2.3%',
      color: 'text-orange-600',
      icon: BarChart3,
      description: '所有活动的平均转化率'
    }
  ]

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">营销活动管理</h1>
          <p className="text-muted-foreground">
            创建和管理推荐营销活动，配置奖励规则和活动参数
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline"
            onClick={() => router.push('/referrals/analytics')}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            查看数据分析
          </Button>
          <Button onClick={() => router.push('/referrals/campaigns/create')}>
            <Plus className="mr-2 h-4 w-4" />
            创建活动
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
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

      {/* 活动列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">活动列表</CardTitle>
          <CardDescription>
            共 {totalItems} 个营销活动
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CampaignTable
            data={campaigns}
            loading={loading}
            onViewDetail={handleViewDetail}
            onEdit={handleEdit}
            onToggleStatus={handleToggleStatus}
            onEndCampaign={handleEndCampaign}
            onCampaignUpdated={handleCampaignUpdated}
          />
          
          {/* 分页控制 */}
          {totalItems > pagination.pageSize && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-muted-foreground">
                共 {totalItems} 个活动，当前显示第 {pagination.pageIndex + 1} 页
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({
                    ...prev,
                    pageIndex: Math.max(0, prev.pageIndex - 1)
                  }))}
                  disabled={pagination.pageIndex <= 0}
                >
                  上一页
                </Button>
                <span className="px-3 py-1 text-sm">
                  {pagination.pageIndex + 1} / {Math.ceil(totalItems / pagination.pageSize)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({
                    ...prev,
                    pageIndex: Math.min(Math.ceil(totalItems / pagination.pageSize) - 1, prev.pageIndex + 1)
                  }))}
                  disabled={pagination.pageIndex >= Math.ceil(totalItems / pagination.pageSize) - 1}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}