'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Key, AlertTriangle, BarChart3, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import Link from 'next/link'

import { JwtTable, JwtAnalytics } from './components'

// 模拟JWT统计数据
const mockJwtStats = {
  total_active_tokens: 2847,
  tokens_issued_24h: 342,
  tokens_revoked_24h: 18,
  blacklisted_tokens: 25,
  avg_token_lifetime: 7.2,
  top_devices: [
    { device_type: 'desktop', count: 1245 },
    { device_type: 'mobile', count: 987 },
    { device_type: 'tablet', count: 426 },
    { device_type: 'unknown', count: 189 }
  ]
}

export default function JwtPage() {
  const [stats, setStats] = useState(mockJwtStats)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      setStats(mockJwtStats)
    } catch (error) {
      console.error('加载JWT数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleBulkRevoke = async () => {
    try {
      // 模拟批量撤销过期令牌
      console.log('批量撤销过期令牌')
      await new Promise(resolve => setTimeout(resolve, 1000))
      loadData() // 重新加载数据
    } catch (error) {
      console.error('批量撤销失败:', error)
    }
  }

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="JWT管理" 
        description="管理JWT令牌、监控活跃会话和控制访问权限"
      >
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/auth/management/jwt/blacklist">
              <Trash2 className="h-4 w-4 mr-2" />
              黑名单管理
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleBulkRevoke}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            清理过期令牌
          </Button>
        </div>
      </PageHeader>
      
      <main className="flex-1 p-6">
        <div className="space-y-6">
          {/* JWT统计概览 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">活跃令牌</CardTitle>
                <Key className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {loading ? '...' : stats.total_active_tokens.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  当前有效的JWT令牌数量
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">24h签发</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {loading ? '...' : stats.tokens_issued_24h}
                </div>
                <p className="text-xs text-muted-foreground">
                  今日新签发的令牌数量
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">24h撤销</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {loading ? '...' : stats.tokens_revoked_24h}
                </div>
                <p className="text-xs text-muted-foreground">
                  今日撤销的令牌数量
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">黑名单</CardTitle>
                <Trash2 className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {loading ? '...' : stats.blacklisted_tokens}
                </div>
                <p className="text-xs text-muted-foreground">
                  已加入黑名单的令牌
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 设备分布统计 */}
          <Card>
            <CardHeader>
              <CardTitle>设备类型分布</CardTitle>
              <CardDescription>不同设备类型的令牌使用情况</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                {stats.top_devices.map((device, index) => (
                  <div key={index} className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{device.count}</div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {device.device_type === 'desktop' && '桌面端'}
                      {device.device_type === 'mobile' && '移动端'}
                      {device.device_type === 'tablet' && '平板端'}
                      {device.device_type === 'unknown' && '未知设备'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {((device.count / stats.total_active_tokens) * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* JWT管理选项卡 */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">令牌概览</TabsTrigger>
              <TabsTrigger value="active-tokens">活跃令牌</TabsTrigger>
              <TabsTrigger value="analytics">使用分析</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>令牌健康状态</CardTitle>
                    <CardDescription>JWT系统的整体健康状况</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">令牌有效率</span>
                        <span className="text-sm font-medium text-green-600">
                          {((stats.total_active_tokens / (stats.total_active_tokens + stats.blacklisted_tokens)) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">平均生存周期</span>
                        <span className="text-sm font-medium">{stats.avg_token_lifetime} 天</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">撤销率</span>
                        <span className="text-sm font-medium text-orange-600">
                          {((stats.tokens_revoked_24h / stats.tokens_issued_24h) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>快速操作</CardTitle>
                    <CardDescription>常用的JWT管理操作</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        asChild
                      >
                        <Link href="/auth/management/jwt/blacklist">
                          <Trash2 className="h-4 w-4 mr-2" />
                          管理黑名单
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={handleBulkRevoke}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        批量撤销过期令牌
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={loadData}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        刷新统计数据
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="active-tokens" className="space-y-4">
              <JwtTable onTokenRevoked={loadData} />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <JwtAnalytics />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}