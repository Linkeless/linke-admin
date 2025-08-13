'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarIcon, Download, Filter, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import { ReferralAnalytics } from '../types'
import { AnalyticsDashboard } from './components'

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<ReferralAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [refreshing, setRefreshing] = useState(false)

  // 模拟数据加载函数
  const loadAnalytics = async () => {
    try {
      setLoading(true)
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 模拟分析数据
      const mockAnalytics: ReferralAnalytics = {
        overview: {
          total_referrals: 2847,
          total_conversions: 692,
          total_revenue: 87350,
          average_conversion_value: 126.23
        },
        trends: [
          { period: '本周', referrals: 156, conversions: 38, revenue: 4800 },
          { period: '上周', referrals: 142, conversions: 35, revenue: 4410 },
          { period: '两周前', referrals: 168, conversions: 41, revenue: 5170 },
          { period: '三周前', referrals: 134, conversions: 32, revenue: 4040 },
          { period: '四周前', referrals: 149, conversions: 36, revenue: 4540 },
          { period: '五周前', referrals: 138, conversions: 33, revenue: 4160 }
        ],
        channels: [
          { channel: '网站', referrals: 1245, conversions: 312, conversion_rate: 0.251 },
          { channel: '社交媒体', referrals: 892, conversions: 198, conversion_rate: 0.222 },
          { channel: '邮件', referrals: 456, conversions: 123, conversion_rate: 0.270 },
          { channel: '移动应用', referrals: 254, conversions: 59, conversion_rate: 0.232 }
        ],
        campaigns: [
          {
            campaign: {
              id: 1,
              name: '夏季推荐特惠',
              code: 'SUMMER2024',
              description: '夏季特惠推荐活动',
              campaign_type: 'seasonal',
              status: 'active',
              created_at: '2024-06-01T00:00:00Z',
              updated_at: '2024-06-01T00:00:00Z',
              referrer_reward_type: 'fixed',
              referrer_reward_amount: 100,
              referrer_reward_currency: 'CNY',
              requires_approval: true,
              total_referrals: 156,
              conversion_rate: 0.23,
              created_by_id: 1
            },
            performance: {
              referrals: 156,
              conversions: 36,
              revenue: 4536,
              roi: 2.8
            }
          },
          {
            campaign: {
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
              created_by_id: 1
            },
            performance: {
              referrals: 892,
              conversions: 276,
              revenue: 34872,
              roi: 4.2
            }
          },
          {
            campaign: {
              id: 3,
              name: '新用户限时活动',
              code: 'NEWUSER2024',
              description: '专为新用户推出的限时推荐活动',
              campaign_type: 'limited',
              status: 'paused',
              created_at: '2024-03-01T00:00:00Z',
              updated_at: '2024-03-15T00:00:00Z',
              referrer_reward_type: 'tiered',
              referrer_reward_amount: 50,
              referrer_reward_currency: 'CNY',
              requires_approval: true,
              total_referrals: 67,
              conversion_rate: 0.18,
              created_by_id: 1
            },
            performance: {
              referrals: 67,
              conversions: 12,
              revenue: 1512,
              roi: 1.8
            }
          }
        ]
      }
      
      setAnalytics(mockAnalytics)
    } catch (error) {
      console.error('加载分析数据失败:', error)
      toast.error('加载分析数据失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 刷新数据
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAnalytics()
    setRefreshing(false)
    toast.success('数据已刷新')
  }

  // 导出数据
  const handleExport = () => {
    toast.success('正在准备导出文件...')
    // 实际实现时，这里会调用导出API
  }

  // 时间范围变化
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value)
    loadAnalytics() // 重新加载数据
  }

  // 初始加载
  useEffect(() => {
    loadAnalytics()
  }, [])

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">推荐数据分析</h1>
          <p className="text-muted-foreground">
            查看推荐系统的详细分析报告和统计数据
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="选择时间" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">最近7天</SelectItem>
              <SelectItem value="30d">最近30天</SelectItem>
              <SelectItem value="90d">最近90天</SelectItem>
              <SelectItem value="1y">最近1年</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            导出报告
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      {/* 快速筛选 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">数据筛选</CardTitle>
          <CardDescription>
            根据不同条件筛选和分析推荐数据
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="选择活动" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有活动</SelectItem>
                <SelectItem value="summer2024">夏季推荐特惠</SelectItem>
                <SelectItem value="evergreen">常规推荐计划</SelectItem>
                <SelectItem value="newuser2024">新用户限时活动</SelectItem>
              </SelectContent>
            </Select>
            
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="选择渠道" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有渠道</SelectItem>
                <SelectItem value="website">网站</SelectItem>
                <SelectItem value="social">社交媒体</SelectItem>
                <SelectItem value="email">邮件</SelectItem>
                <SelectItem value="app">移动应用</SelectItem>
              </SelectContent>
            </Select>
            
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="转化状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="converted">已转化</SelectItem>
                <SelectItem value="pending">待转化</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="w-full">
              <Filter className="mr-2 h-4 w-4" />
              应用筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 分析仪表板 */}
      {analytics ? (
        <AnalyticsDashboard analytics={analytics} loading={loading} />
      ) : (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-muted-foreground">加载分析数据中...</div>
          </div>
        </div>
      )}
    </div>
  )
}