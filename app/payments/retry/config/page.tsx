/**
 * 重试配置管理页面
 * 全局重试配置和系统参数设置
 */

'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  BarChart3, 
  List,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'

import { ConfigForm } from './components/config-form'
import { ConfigStats } from './components/config-stats'
import { ConfigRecommendations } from './components/config-recommendations'
import { useRetryConfig } from '@/hooks/queries/use-payments'

export default function ConfigPage() {
  // 使用 React Query 获取重试配置
  const { 
    data: configResponse, 
    isLoading, 
    error, 
    refetch 
  } = useRetryConfig({
    enabled: true
  })
  
  const config = configResponse?.data
  const loading = isLoading

  const [activeTab, setActiveTab] = useState('settings')
  const [isOptimizing, setIsOptimizing] = useState(false)

  // TODO: 实现系统健康检查和建议功能
  const systemHealth = null // getSystemHealth()
  const recommendations = [] // getConfigRecommendations()

  const handleOptimizeConfig = async () => {
    setIsOptimizing(true)
    try {
      // TODO: 实现配置优化功能
      toast.info('配置优化功能开发中...')
      /*
      const result = await optimizeConfig()
      if (result.success) {
        toast.success('配置优化成功', {
          description: result.message || '系统配置已根据历史数据自动优化'
        })
      } else {
        toast.error('配置优化失败', {
          description: result.error || '优化过程中发生错误'
        })
      }
      */
    } catch (error) {
      toast.error('配置优化失败', {
        description: '请稍后重试'
      })
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleRefreshAll = async () => {
    await refetch()
    toast.success('数据已刷新')
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">重试配置</h2>
          <p className="text-muted-foreground">
            管理全局重试配置参数，优化系统重试策略
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefreshAll} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新数据
          </Button>
          <Button 
            variant="outline" 
            onClick={handleOptimizeConfig}
            disabled={isOptimizing}
          >
            <Zap className={`mr-2 h-4 w-4 ${isOptimizing ? 'animate-pulse' : ''}`} />
            {isOptimizing ? '优化中...' : '一键优化'}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/payments/retry/strategies">
              <List className="mr-2 h-4 w-4" />
              策略管理
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/payments/retry">
              <BarChart3 className="mr-2 h-4 w-4" />
              统计分析
            </Link>
          </Button>
        </div>
      </div>

      <Separator />

      {/* 系统状态提醒 */}
      {systemHealth && (
        <Alert 
          variant={systemHealth.status === 'critical' ? 'destructive' : 'default'}
          className={
            systemHealth.status === 'good' ? 'border-green-200 bg-green-50' :
            systemHealth.status === 'warning' ? 'border-yellow-200 bg-yellow-50' : ''
          }
        >
          {systemHealth.status === 'good' ? (
            <CheckCircle className="h-4 w-4" />
          ) : systemHealth.status === 'warning' ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertDescription className="flex items-center justify-between">
            <span>{systemHealth.message}</span>
            <Badge 
              variant={
                systemHealth.status === 'good' ? 'default' :
                systemHealth.status === 'warning' ? 'secondary' : 'destructive'
              }
              className={
                systemHealth.status === 'good' ? 'bg-green-100 text-green-800' :
                systemHealth.status === 'warning' ? 'bg-yellow-100 text-yellow-800' : ''
              }
            >
              {systemHealth.status === 'good' ? '运行正常' :
               systemHealth.status === 'warning' ? '需要关注' : '严重问题'}
            </Badge>
          </AlertDescription>
        </Alert>
      )}

      {/* 配置建议 */}
      {recommendations && recommendations.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">配置优化建议:</div>
              <ul className="list-disc list-inside space-y-1">
                {recommendations.slice(0, 3).map((rec, index) => (
                  <li key={index} className="text-sm">{rec}</li>
                ))}
              </ul>
              {recommendations.length > 3 && (
                <div className="text-sm text-muted-foreground">
                  还有 {recommendations.length - 3} 条建议...
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            加载配置数据失败: {error instanceof Error ? error.message : '未知错误'}
          </AlertDescription>
        </Alert>
      )}

      {/* 主要内容 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            系统设置
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center">
            <BarChart3 className="mr-2 h-4 w-4" />
            统计分析
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center">
            <Info className="mr-2 h-4 w-4" />
            优化建议
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>全局重试配置</CardTitle>
              <CardDescription>
                配置系统级别的重试参数，影响所有重试策略的行为
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={
                <div className="space-y-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
                      <div className="h-10 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              }>
                <ConfigForm />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <Suspense fallback={
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 bg-gray-200 rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          }>
            <ConfigStats />
          </Suspense>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Suspense fallback={
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          }>
            <ConfigRecommendations />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}