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
import { Settings, Shield, Users, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import Link from 'next/link'

import { ProviderTable, EventLog } from './components'

// 模拟OAuth统计数据
const mockOAuthStats = {
  total_providers: 3,
  active_providers: 3,
  total_oauth_users: 1247,
  oauth_registrations_24h: 28,
  oauth_logins_24h: 156,
  oauth_incidents_24h: 2
}

export default function OAuthPage() {
  const [stats, setStats] = useState(mockOAuthStats)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      setStats(mockOAuthStats)
    } catch (error) {
      console.error('加载OAuth数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="OAuth管理" 
        description="管理第三方登录提供商和监控OAuth认证事件"
      >
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/auth/management/oauth/providers">
              <Settings className="h-4 w-4 mr-2" />
              提供商管理
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/auth/management/oauth/events">
              <AlertTriangle className="h-4 w-4 mr-2" />
              事件日志
            </Link>
          </Button>
        </div>
      </PageHeader>
      
      <main className="flex-1 p-6">
        <div className="space-y-6">
          {/* OAuth统计概览 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">OAuth提供商</CardTitle>
                <Settings className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {loading ? '...' : `${stats.active_providers}/${stats.total_providers}`}
                </div>
                <p className="text-xs text-muted-foreground">
                  活跃/总数
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">OAuth用户</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {loading ? '...' : stats.total_oauth_users.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  使用OAuth的用户总数
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">24h OAuth登录</CardTitle>
                <Shield className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {loading ? '...' : stats.oauth_logins_24h}
                </div>
                <p className="text-xs text-muted-foreground">
                  今日OAuth登录次数
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">OAuth事件</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {loading ? '...' : stats.oauth_incidents_24h}
                </div>
                <p className="text-xs text-muted-foreground">
                  24小时内的异常事件
                </p>
              </CardContent>
            </Card>
          </div>

          {/* OAuth提供商状态 */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-blue-600 rounded-full" />
                  Google OAuth
                </CardTitle>
                <CardDescription>Google 第三方登录服务</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>状态</span>
                    <span className="text-green-600 font-medium">正常</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>用户数</span>
                    <span className="font-medium">847</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>24h注册</span>
                    <span className="font-medium">18</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-gray-800 rounded-full" />
                  GitHub OAuth
                </CardTitle>
                <CardDescription>GitHub 第三方登录服务</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>状态</span>
                    <span className="text-green-600 font-medium">正常</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>用户数</span>
                    <span className="font-medium">289</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>24h注册</span>
                    <span className="font-medium">7</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-blue-400 rounded-full" />
                  Telegram OAuth
                </CardTitle>
                <CardDescription>Telegram 第三方登录服务</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>状态</span>
                    <span className="text-green-600 font-medium">正常</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>用户数</span>
                    <span className="font-medium">111</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>24h注册</span>
                    <span className="font-medium">3</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* OAuth管理选项卡 */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">系统概览</TabsTrigger>
              <TabsTrigger value="providers">提供商管理</TabsTrigger>
              <TabsTrigger value="events">事件监控</TabsTrigger>
              <TabsTrigger value="analytics">使用分析</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>OAuth使用趋势</CardTitle>
                    <CardDescription>过去7天的OAuth登录趋势</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Google OAuth</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">68%</span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '68%' }} />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">GitHub OAuth</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">23%</span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-gray-800 h-2 rounded-full" style={{ width: '23%' }} />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Telegram OAuth</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">9%</span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-400 h-2 rounded-full" style={{ width: '9%' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>OAuth健康状态</CardTitle>
                    <CardDescription>各提供商的服务状态评估</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">服务可用性</span>
                        <span className="text-sm font-medium text-green-600">99.9%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">认证成功率</span>
                        <span className="text-sm font-medium text-green-600">98.7%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">平均响应时间</span>
                        <span className="text-sm font-medium">1.2秒</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">错误率</span>
                        <span className="text-sm font-medium text-orange-600">1.3%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="providers" className="space-y-4">
              <ProviderTable onProviderUpdated={loadData} />
            </TabsContent>

            <TabsContent value="events" className="space-y-4">
              <EventLog />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>用户偏好分析</CardTitle>
                    <CardDescription>用户选择OAuth提供商的偏好</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">68%</div>
                        <div className="text-sm text-muted-foreground">首选Google</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-gray-800">23%</div>
                        <div className="text-sm text-muted-foreground">首选GitHub</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-400">9%</div>
                        <div className="text-sm text-muted-foreground">首选Telegram</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>转换率分析</CardTitle>
                    <CardDescription>OAuth登录到注册的转换情况</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">OAuth尝试</span>
                        <span className="text-sm font-medium">234</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">成功认证</span>
                        <span className="text-sm font-medium text-green-600">231</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">新用户注册</span>
                        <span className="text-sm font-medium text-blue-600">28</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">转换率</span>
                        <span className="text-sm font-medium text-purple-600">12.1%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}