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
import { Shield, AlertTriangle, TrendingUp, Eye } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'

import { LoginAttempts, FailedLogins, SecurityAnalytics } from './components'

// 模拟实时数据
const mockSecurityStats = {
  total_attempts_24h: 12483,
  failed_attempts_24h: 287,
  blocked_ips_24h: 23,
  security_incidents: 5,
  avg_response_time: 1.2,
  threat_level: 'medium' as const
}

export default function SecurityPage() {
  const [stats, setStats] = useState(mockSecurityStats)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      setStats(mockSecurityStats)
    } catch (error) {
      console.error('加载安全数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    
    // 设置定时刷新
    const interval = setInterval(loadData, 30000) // 每30秒刷新一次
    return () => clearInterval(interval)
  }, [loadData])

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-green-600'
      case 'medium':
        return 'text-yellow-600'
      case 'high':
        return 'text-orange-600'
      case 'critical':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getThreatLevelText = (level: string) => {
    switch (level) {
      case 'low':
        return '低风险'
      case 'medium':
        return '中等风险'
      case 'high':
        return '高风险'
      case 'critical':
        return '严重威胁'
      default:
        return '未知'
    }
  }

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="安全监控" 
        description="实时监控系统安全状态和登录活动"
      >
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <TrendingUp className="h-4 w-4 mr-2" />
            {loading ? '刷新中...' : '刷新数据'}
          </Button>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            实时监控
          </Button>
        </div>
      </PageHeader>
      
      <main className="flex-1 p-6">
        <div className="space-y-6">
          {/* 实时安全统计 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">24h登录尝试</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_attempts_24h.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  成功率 {((stats.total_attempts_24h - stats.failed_attempts_24h) / stats.total_attempts_24h * 100).toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">失败尝试</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.failed_attempts_24h}</div>
                <p className="text-xs text-muted-foreground">
                  失败率 {(stats.failed_attempts_24h / stats.total_attempts_24h * 100).toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">阻止IP</CardTitle>
                <Shield className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.blocked_ips_24h}</div>
                <p className="text-xs text-muted-foreground">
                  自动拦截可疑IP
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">威胁等级</CardTitle>
                <AlertTriangle className={`h-4 w-4 ${getThreatLevelColor(stats.threat_level)}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getThreatLevelColor(stats.threat_level)}`}>
                  {getThreatLevelText(stats.threat_level)}
                </div>
                <p className="text-xs text-muted-foreground">
                  当前系统状态
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 安全监控选项卡 */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">安全概览</TabsTrigger>
              <TabsTrigger value="login-attempts">登录尝试</TabsTrigger>
              <TabsTrigger value="failed-logins">失败登录</TabsTrigger>
              <TabsTrigger value="analytics">安全分析</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>实时威胁监控</CardTitle>
                    <CardDescription>最近30分钟的安全事件</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                          <div>
                            <p className="text-sm font-medium">暴力破解尝试</p>
                            <p className="text-xs text-muted-foreground">IP: 192.168.1.100</p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">2分钟前</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="h-2 w-2 bg-yellow-500 rounded-full" />
                          <div>
                            <p className="text-sm font-medium">异常地理位置登录</p>
                            <p className="text-xs text-muted-foreground">用户: john@example.com</p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">5分钟前</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="h-2 w-2 bg-blue-500 rounded-full" />
                          <div>
                            <p className="text-sm font-medium">多设备并发登录</p>
                            <p className="text-xs text-muted-foreground">用户: admin@example.com</p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">8分钟前</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>系统响应性能</CardTitle>
                    <CardDescription>认证系统性能指标</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>平均响应时间</span>
                          <span className="font-medium">{stats.avg_response_time}秒</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${Math.min(100, (3 - stats.avg_response_time) / 3 * 100)}%` }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>系统可用性</span>
                          <span className="font-medium text-green-600">99.9%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: '99.9%' }} />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>安全检查覆盖率</span>
                          <span className="font-medium text-blue-600">96.5%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '96.5%' }} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="login-attempts" className="space-y-4">
              <LoginAttempts />
            </TabsContent>

            <TabsContent value="failed-logins" className="space-y-4">
              <FailedLogins />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <SecurityAnalytics />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}