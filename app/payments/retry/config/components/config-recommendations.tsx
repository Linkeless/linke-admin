/**
 * 重试配置优化建议组件
 */

'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Lightbulb, 
  TrendingUp, 
  Settings, 
  Zap, 
  Shield, 
  Database,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  Target,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'

import { useRetryConfigManagement } from '@/hooks/use-retry-config'

interface Recommendation {
  id: string
  type: 'performance' | 'reliability' | 'cost' | 'maintenance'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  currentValue?: string
  recommendedValue?: string
  impact: string
  effort: 'low' | 'medium' | 'high'
  estimatedImprovement: number
  category: string
}

export function ConfigRecommendations() {
  const { stats, config, updateConfig, loading } = useRetryConfigManagement()
  const [applyingRecommendation, setApplyingRecommendation] = useState<string | null>(null)

  const recommendations = useMemo<Recommendation[]>(() => {
    if (!stats || !config) return []

    const recs: Recommendation[] = []

    // 基于成功率的建议
    if (stats.successRate < 85) {
      recs.push({
        id: 'increase-max-retries',
        type: 'performance',
        priority: 'high',
        title: '增加最大重试次数',
        description: '当前成功率较低，建议适当增加最大重试次数以提高成功率',
        currentValue: `${config.maxRetries}次`,
        recommendedValue: `${Math.min(config.maxRetries + 2, 8)}次`,
        impact: '预计可提高成功率3-5%',
        effort: 'low',
        estimatedImprovement: 4,
        category: '性能优化'
      })
    }

    // 基于平均重试次数的建议
    if (stats.avgRetries > 2.5) {
      recs.push({
        id: 'optimize-initial-delay',
        type: 'performance',
        priority: 'medium',
        title: '优化初始延迟时间',
        description: '平均重试次数较高，建议调整初始延迟以减少不必要的重试',
        currentValue: `${config.initialDelay}ms`,
        recommendedValue: `${Math.max(config.initialDelay - 200, 500)}ms`,
        impact: '减少平均重试次数0.3-0.5次',
        effort: 'low',
        estimatedImprovement: 3,
        category: '延迟优化'
      })
    }

    // 基于延迟的建议
    if (stats.avgDelay > 15000) {
      recs.push({
        id: 'reduce-backoff-multiplier',
        type: 'performance',
        priority: 'medium',
        title: '调整退避倍数',
        description: '平均延迟时间过长，建议降低退避倍数以提高响应速度',
        currentValue: `${config.backoffMultiplier}x`,
        recommendedValue: `${Math.max(config.backoffMultiplier - 0.3, 1.2).toFixed(1)}x`,
        impact: '减少平均延迟20-30%',
        effort: 'low',
        estimatedImprovement: 6,
        category: '延迟优化'
      })
    }

    // 熔断器建议
    if (!config.enableCircuitBreaker && stats.circuitBreakerTriggers > 10) {
      recs.push({
        id: 'enable-circuit-breaker',
        type: 'reliability',
        priority: 'high',
        title: '启用熔断器保护',
        description: '检测到频繁的系统异常，建议启用熔断器以保护系统稳定性',
        currentValue: '未启用',
        recommendedValue: '启用熔断器',
        impact: '提高系统稳定性，减少资源浪费',
        effort: 'medium',
        estimatedImprovement: 8,
        category: '可靠性提升'
      })
    }

    // 死信队列建议
    if (!config.enableDeadLetter && stats.deadLetterCount > 50) {
      recs.push({
        id: 'enable-dead-letter',
        type: 'maintenance',
        priority: 'medium',
        title: '启用死信队列',
        description: '有较多失败记录未得到处理，建议启用死信队列进行后续分析',
        currentValue: '未启用',
        recommendedValue: '启用死信队列',
        impact: '便于问题分析和数据恢复',
        effort: 'low',
        estimatedImprovement: 5,
        category: '数据管理'
      })
    }

    // 监控建议
    if (!config.enableMetrics) {
      recs.push({
        id: 'enable-metrics',
        type: 'maintenance',
        priority: 'low',
        title: '启用指标收集',
        description: '建议启用指标收集以获得更详细的性能分析数据',
        currentValue: '未启用',
        recommendedValue: '启用指标收集',
        impact: '提供详细的监控和分析能力',
        effort: 'low',
        estimatedImprovement: 3,
        category: '监控改进'
      })
    }

    // 抖动机制建议
    if (!config.jitterEnabled && stats.totalRetries > 1000) {
      recs.push({
        id: 'enable-jitter',
        type: 'performance',
        priority: 'medium',
        title: '启用抖动机制',
        description: '高并发场景下建议启用抖动机制以避免惊群效应',
        currentValue: '未启用',
        recommendedValue: '启用抖动',
        impact: '减少系统负载波动，提高稳定性',
        effort: 'low',
        estimatedImprovement: 4,
        category: '并发优化'
      })
    }

    // 超时设置建议
    if (config.timeoutThreshold < 10000 && stats.avgDelay > 8000) {
      recs.push({
        id: 'increase-timeout',
        type: 'reliability',
        priority: 'medium',
        title: '调整超时阈值',
        description: '当前超时设置可能过于严格，建议适当增加超时时间',
        currentValue: `${config.timeoutThreshold}ms`,
        recommendedValue: `${config.timeoutThreshold + 5000}ms`,
        impact: '减少因超时导致的失败',
        effort: 'low',
        estimatedImprovement: 3,
        category: '超时优化'
      })
    }

    return recs.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority] || 
             b.estimatedImprovement - a.estimatedImprovement
    })
  }, [stats, config])

  const getTypeIcon = (type: Recommendation['type']) => {
    switch (type) {
      case 'performance': return TrendingUp
      case 'reliability': return Shield
      case 'cost': return BarChart3
      case 'maintenance': return Database
      default: return Settings
    }
  }

  const getTypeColor = (type: Recommendation['type']) => {
    switch (type) {
      case 'performance': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'reliability': return 'text-green-600 bg-green-50 border-green-200'
      case 'cost': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'maintenance': return 'text-purple-600 bg-purple-50 border-purple-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getPriorityColor = (priority: Recommendation['priority']) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  const getEffortColor = (effort: Recommendation['effort']) => {
    switch (effort) {
      case 'low': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'high': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const handleApplyRecommendation = async (recommendation: Recommendation) => {
    setApplyingRecommendation(recommendation.id)
    
    try {
      let updates: Partial<typeof config> = {}
      
      switch (recommendation.id) {
        case 'increase-max-retries':
          updates.maxRetries = Math.min((config?.maxRetries || 3) + 2, 8)
          break
        case 'optimize-initial-delay':
          updates.initialDelay = Math.max((config?.initialDelay || 1000) - 200, 500)
          break
        case 'reduce-backoff-multiplier':
          updates.backoffMultiplier = Math.max((config?.backoffMultiplier || 2) - 0.3, 1.2)
          break
        case 'enable-circuit-breaker':
          updates.enableCircuitBreaker = true
          break
        case 'enable-dead-letter':
          updates.enableDeadLetter = true
          break
        case 'enable-metrics':
          updates.enableMetrics = true
          break
        case 'enable-jitter':
          updates.jitterEnabled = true
          break
        case 'increase-timeout':
          updates.timeoutThreshold = (config?.timeoutThreshold || 30000) + 5000
          break
      }

      const result = await updateConfig(updates)
      
      if (result.success) {
        toast.success('建议已应用', {
          description: `${recommendation.title}已成功应用到配置中`
        })
      } else {
        toast.error('应用建议失败', {
          description: result.error || '应用配置时发生错误'
        })
      }
    } catch (error) {
      toast.error('应用建议失败', {
        description: '请稍后重试'
      })
    } finally {
      setApplyingRecommendation(null)
    }
  }

  if (loading) {
    return (
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
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <CheckCircle className="h-12 w-12 text-green-600" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">配置已优化</h3>
            <p className="text-muted-foreground">
              当前配置表现良好，暂无优化建议
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const highPriorityCount = recommendations.filter(r => r.priority === 'high').length
  const totalImprovement = recommendations.reduce((sum, r) => sum + r.estimatedImprovement, 0)

  return (
    <div className="space-y-6">
      {/* 优化总览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="mr-2 h-5 w-5" />
            优化建议总览
          </CardTitle>
          <CardDescription>
            基于当前系统运行数据生成的个性化优化建议
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{recommendations.length}</div>
              <div className="text-sm text-muted-foreground">优化建议</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{highPriorityCount}</div>
              <div className="text-sm text-muted-foreground">高优先级</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalImprovement}%</div>
              <div className="text-sm text-muted-foreground">预期提升</div>
            </div>
          </div>
          
          {highPriorityCount > 0 && (
            <>
              <Separator className="my-4" />
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  检测到 {highPriorityCount} 个高优先级问题需要立即处理，建议优先解决这些问题以提升系统性能。
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>

      {/* 建议列表 */}
      <div className="space-y-4">
        {recommendations.map((recommendation) => {
          const TypeIcon = getTypeIcon(recommendation.type)
          const typeColorClass = getTypeColor(recommendation.type)
          const isApplying = applyingRecommendation === recommendation.id

          return (
            <Card key={recommendation.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${typeColorClass}`}>
                      <TypeIcon className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                        <Badge variant={getPriorityColor(recommendation.priority)}>
                          {recommendation.priority === 'high' ? '高优先级' : 
                           recommendation.priority === 'medium' ? '中优先级' : '低优先级'}
                        </Badge>
                        <Badge variant="outline">
                          {recommendation.category}
                        </Badge>
                      </div>
                      <CardDescription>
                        {recommendation.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleApplyRecommendation(recommendation)}
                    disabled={isApplying}
                  >
                    <Zap className={`mr-2 h-4 w-4 ${isApplying ? 'animate-pulse' : ''}`} />
                    {isApplying ? '应用中...' : '应用建议'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 当前值 vs 建议值 */}
                  {recommendation.currentValue && recommendation.recommendedValue && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">当前配置</p>
                        <p className="text-sm">{recommendation.currentValue}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">建议配置</p>
                        <p className="text-sm font-medium text-blue-600">{recommendation.recommendedValue}</p>
                      </div>
                    </div>
                  )}

                  {/* 影响和工作量 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">预期影响:</span>
                      <span className="font-medium">{recommendation.impact}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">实施工作量:</span>
                      <span className={`font-medium ${getEffortColor(recommendation.effort)}`}>
                        {recommendation.effort === 'low' ? '低' : 
                         recommendation.effort === 'medium' ? '中' : '高'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">预期提升:</span>
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={recommendation.estimatedImprovement} 
                          className="w-20 h-2"
                        />
                        <span className="font-medium text-green-600">
                          {recommendation.estimatedImprovement}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 实施指导 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="mr-2 h-5 w-5" />
            实施指导
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-red-500" />
              <span>建议按照优先级从高到低的顺序实施优化</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span>配置更改后请观察系统运行情况1-2小时</span>
            </div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <span>定期查看统计数据以评估优化效果</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span>在生产环境实施前建议先在测试环境验证</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}