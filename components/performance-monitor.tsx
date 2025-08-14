'use client'

/**
 * 性能监控组件
 * 
 * 基于任务36要求，提供运行时性能监控和可视化
 * 
 * 特性：
 * - 实时性能指标监控
 * - NFR-1合规性检查
 * - 可视化性能面板
 * - 自动告警机制
 * - 性能优化建议
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Network, 
  Zap,
  TrendingUp,
  TrendingDown,
  Info
} from 'lucide-react'
import { PERFORMANCE_CONFIG, checkNFRCompliance } from '@/lib/performance-config'
import { toast } from 'sonner'

// ==================== 类型定义 ====================

interface PerformanceMetrics {
  cacheHitRate: number
  averageResponseTime: number
  cacheHitResponseTime: number
  memoryUsage: number
  networkRequests: number
  networkRequestsSaved: number
  activeQueries: number
  staleQueries: number
  errorQueries: number
  errorRate: number
  lastUpdated: number
  collectionStartTime: number
}

interface PerformanceAlert {
  id: string
  type: 'info' | 'warning' | 'error'
  category: string
  message: string
  timestamp: number
  resolved: boolean
}

interface NFRCompliance {
  cacheHitResponseTime: boolean
  memoryUsage: boolean
  cacheHitRate: boolean
  networkReduction: boolean
  overall: boolean
  score: number
}

// ==================== 性能监控Hook ====================

const usePerformanceMonitor = () => {
  const queryClient = useQueryClient()
  const [isActive, setIsActive] = useState(false)
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cacheHitRate: 0,
    averageResponseTime: 0,
    cacheHitResponseTime: 0,
    memoryUsage: 0,
    networkRequests: 0,
    networkRequestsSaved: 0,
    activeQueries: 0,
    staleQueries: 0,
    errorQueries: 0,
    errorRate: 0,
    lastUpdated: Date.now(),
    collectionStartTime: Date.now(),
  })
  
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const [compliance, setCompliance] = useState<NFRCompliance>({
    cacheHitResponseTime: true,
    memoryUsage: true,
    cacheHitRate: true,
    networkReduction: true,
    overall: true,
    score: 100,
  })
  
  // 性能数据收集
  const hitCount = useRef(0)
  const missCount = useRef(0)
  const responseTimes = useRef<number[]>([])
  const networkCount = useRef(0)
  const errorCount = useRef(0)
  const startTime = useRef(Date.now())

  /**
   * 更新性能指标
   */
  const updateMetrics = useCallback(() => {
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()
    
    // 基础统计
    const activeQueries = queries.filter(q => q.getObserversCount() > 0).length
    const staleQueries = queries.filter(q => q.isStale()).length
    const errorQueries = queries.filter(q => q.state.status === 'error').length
    
    // 计算缓存命中率
    const totalRequests = hitCount.current + missCount.current
    const cacheHitRate = totalRequests > 0 ? hitCount.current / totalRequests : 0
    
    // 计算响应时间
    const averageResponseTime = responseTimes.current.length > 0
      ? responseTimes.current.reduce((sum, time) => sum + time, 0) / responseTimes.current.length
      : 0
    
    // 估算缓存命中响应时间 (前80%的响应时间作为缓存命中时间)
    const sortedTimes = [...responseTimes.current].sort((a, b) => a - b)
    const cacheHitTimes = sortedTimes.slice(0, Math.floor(sortedTimes.length * 0.8))
    const cacheHitResponseTime = cacheHitTimes.length > 0
      ? cacheHitTimes.reduce((sum, time) => sum + time, 0) / cacheHitTimes.length
      : averageResponseTime
    
    // 估算内存使用
    let memoryUsage = 0
    queries.forEach(query => {
      if (query.state.data) {
        memoryUsage += JSON.stringify(query.state.data).length * 2 // UTF-16估算
      }
    })
    
    // 计算错误率
    const errorRate = totalRequests > 0 ? errorCount.current / totalRequests : 0
    
    // 计算网络请求节省
    const networkRequestsSaved = Math.max(0, hitCount.current)
    const networkReduction = totalRequests > 0 ? networkRequestsSaved / totalRequests : 0
    
    const newMetrics: PerformanceMetrics = {
      cacheHitRate,
      averageResponseTime,
      cacheHitResponseTime,
      memoryUsage,
      networkRequests: networkCount.current,
      networkRequestsSaved,
      activeQueries,
      staleQueries,
      errorQueries,
      errorRate,
      lastUpdated: Date.now(),
      collectionStartTime: startTime.current,
    }
    
    setMetrics(newMetrics)
    
    // 检查NFR合规性
    const nfrCompliance = checkNFRCompliance({
      cacheHitResponseTime: newMetrics.cacheHitResponseTime,
      memoryUsage: newMetrics.memoryUsage,
      cacheHitRate: newMetrics.cacheHitRate,
      networkReduction,
    })
    
    const complianceWithScore = {
      ...nfrCompliance,
      score: Object.values(nfrCompliance).filter(v => typeof v === 'boolean' && v).length / 4 * 100
    }
    
    setCompliance(complianceWithScore)
    
    // 生成告警
    generateAlerts(newMetrics, complianceWithScore)
    
  }, [queryClient])

  /**
   * 生成性能告警
   */
  const generateAlerts = useCallback((metrics: PerformanceMetrics, compliance: NFRCompliance) => {
    const newAlerts: PerformanceAlert[] = []
    const now = Date.now()
    
    // NFR合规性告警
    if (!compliance.cacheHitResponseTime) {
      newAlerts.push({
        id: `nfr-response-time-${now}`,
        type: 'error',
        category: 'NFR Compliance',
        message: `缓存命中响应时间 ${metrics.cacheHitResponseTime.toFixed(1)}ms 超过目标 ${PERFORMANCE_CONFIG.nfrTargets.cacheHitResponseTime}ms`,
        timestamp: now,
        resolved: false,
      })
    }
    
    if (!compliance.memoryUsage) {
      newAlerts.push({
        id: `nfr-memory-${now}`,
        type: 'error',
        category: 'NFR Compliance',
        message: `内存使用 ${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB 超过目标 ${PERFORMANCE_CONFIG.nfrTargets.memoryLimit / 1024 / 1024}MB`,
        timestamp: now,
        resolved: false,
      })
    }
    
    if (!compliance.cacheHitRate) {
      newAlerts.push({
        id: `nfr-hitrate-${now}`,
        type: 'warning',
        category: 'NFR Compliance',
        message: `缓存命中率 ${(metrics.cacheHitRate * 100).toFixed(1)}% 低于目标 ${(PERFORMANCE_CONFIG.nfrTargets.cacheHitRate * 100).toFixed(1)}%`,
        timestamp: now,
        resolved: false,
      })
    }
    
    // 性能告警
    if (metrics.errorRate > 0.05) {
      newAlerts.push({
        id: `error-rate-${now}`,
        type: 'warning',
        category: 'Error Rate',
        message: `错误率 ${(metrics.errorRate * 100).toFixed(1)}% 过高`,
        timestamp: now,
        resolved: false,
      })
    }
    
    if (metrics.staleQueries > 20) {
      newAlerts.push({
        id: `stale-queries-${now}`,
        type: 'info',
        category: 'Cache Health',
        message: `过期查询数量 ${metrics.staleQueries} 较多，建议清理`,
        timestamp: now,
        resolved: false,
      })
    }
    
    // 更新告警列表
    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts].slice(-50)) // 保持最近50个告警
      
      // 显示关键告警
      newAlerts.forEach(alert => {
        if (alert.type === 'error') {
          toast.error(alert.category, { description: alert.message })
        } else if (alert.type === 'warning') {
          toast.warning(alert.category, { description: alert.message })
        }
      })
    }
  }, [])

  /**
   * 记录缓存命中
   */
  const recordCacheHit = useCallback((responseTime: number = 20) => {
    hitCount.current++
    responseTimes.current.push(responseTime)
    
    // 保持最近1000次记录
    if (responseTimes.current.length > 1000) {
      responseTimes.current = responseTimes.current.slice(-1000)
    }
  }, [])

  /**
   * 记录缓存未命中
   */
  const recordCacheMiss = useCallback((responseTime: number = 100) => {
    missCount.current++
    networkCount.current++
    responseTimes.current.push(responseTime)
  }, [])

  /**
   * 记录错误
   */
  const recordError = useCallback(() => {
    errorCount.current++
  }, [])

  /**
   * 开始监控
   */
  const startMonitoring = useCallback(() => {
    setIsActive(true)
    startTime.current = Date.now()
    hitCount.current = 0
    missCount.current = 0
    networkCount.current = 0
    errorCount.current = 0
    responseTimes.current = []
    setAlerts([])
    
    console.log('Performance monitoring started')
  }, [])

  /**
   * 停止监控
   */
  const stopMonitoring = useCallback(() => {
    setIsActive(false)
    console.log('Performance monitoring stopped')
  }, [])

  /**
   * 重置统计
   */
  const resetStats = useCallback(() => {
    hitCount.current = 0
    missCount.current = 0
    networkCount.current = 0
    errorCount.current = 0
    responseTimes.current = []
    startTime.current = Date.now()
    setAlerts([])
    setMetrics(prev => ({
      ...prev,
      cacheHitRate: 0,
      averageResponseTime: 0,
      cacheHitResponseTime: 0,
      networkRequests: 0,
      networkRequestsSaved: 0,
      errorRate: 0,
      collectionStartTime: Date.now(),
    }))
    
    console.log('Performance stats reset')
  }, [])

  // 定期更新指标
  useEffect(() => {
    if (!isActive) return
    
    const interval = setInterval(updateMetrics, 2000) // 每2秒更新
    return () => clearInterval(interval)
  }, [isActive, updateMetrics])

  // 模拟性能数据（开发环境）
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && isActive) {
      const interval = setInterval(() => {
        // 模拟缓存命中和未命中
        if (Math.random() > 0.2) {
          recordCacheHit(Math.random() * 40 + 10) // 10-50ms缓存命中
        } else {
          recordCacheMiss(Math.random() * 200 + 50) // 50-250ms网络请求
        }
        
        // 模拟偶尔的错误
        if (Math.random() > 0.95) {
          recordError()
        }
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [isActive, recordCacheHit, recordCacheMiss, recordError])

  return {
    isActive,
    metrics,
    alerts: alerts.filter(alert => !alert.resolved),
    compliance,
    startMonitoring,
    stopMonitoring,
    resetStats,
    recordCacheHit,
    recordCacheMiss,
    recordError,
    resolveAlert: (id: string) => {
      setAlerts(prev => 
        prev.map(alert => 
          alert.id === id ? { ...alert, resolved: true } : alert
        )
      )
    }
  }
}

// ==================== 性能监控组件 ====================

export const PerformanceMonitor: React.FC<{ className?: string }> = ({ className }) => {
  const monitor = usePerformanceMonitor()
  
  if (process.env.NODE_ENV !== 'development') {
    return null // 生产环境不显示
  }

  /**
   * 格式化内存大小
   */
  const formatBytes = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`
  }

  /**
   * 格式化时间
   */
  const formatTime = (ms: number): string => {
    return `${ms.toFixed(1)}ms`
  }

  /**
   * 格式化百分比
   */
  const formatPercentage = (ratio: number): string => {
    return `${(ratio * 100).toFixed(1)}%`
  }

  /**
   * 获取合规状态图标
   */
  const getComplianceIcon = (compliant: boolean) => {
    return compliant 
      ? <CheckCircle className="h-4 w-4 text-green-500" />
      : <AlertTriangle className="h-4 w-4 text-red-500" />
  }

  /**
   * 获取告警类型样式
   */
  const getAlertVariant = (type: PerformanceAlert['type']) => {
    switch (type) {
      case 'error': return 'destructive'
      case 'warning': return 'default'
      case 'info': return 'secondary'
      default: return 'default'
    }
  }

  return (
    <div className={`fixed bottom-4 right-4 w-96 z-50 ${className}`}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">性能监控</CardTitle>
            <div className="flex items-center gap-2">
              <Badge 
                variant={monitor.compliance.overall ? 'default' : 'destructive'}
                className="text-xs"
              >
                NFR-1: {monitor.compliance.score.toFixed(0)}%
              </Badge>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={monitor.isActive ? 'destructive' : 'default'}
                  onClick={monitor.isActive ? monitor.stopMonitoring : monitor.startMonitoring}
                >
                  {monitor.isActive ? '停止' : '开始'}
                </Button>
                <Button size="sm" variant="outline" onClick={monitor.resetStats}>
                  重置
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <Tabs defaultValue="metrics" className="w-full">
            <TabsList className="grid grid-cols-3 w-full text-xs">
              <TabsTrigger value="metrics">指标</TabsTrigger>
              <TabsTrigger value="compliance">合规</TabsTrigger>
              <TabsTrigger value="alerts">告警</TabsTrigger>
            </TabsList>
            
            <TabsContent value="metrics" className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    <span>缓存命中率</span>
                  </div>
                  <div className="font-mono font-medium">
                    {formatPercentage(monitor.metrics.cacheHitRate)}
                  </div>
                  <Progress 
                    value={monitor.metrics.cacheHitRate * 100} 
                    className="h-1"
                  />
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>响应时间</span>
                  </div>
                  <div className="font-mono font-medium">
                    {formatTime(monitor.metrics.averageResponseTime)}
                  </div>
                  <Progress 
                    value={Math.min(monitor.metrics.averageResponseTime / 100 * 100, 100)} 
                    className="h-1"
                  />
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Database className="h-3 w-3" />
                    <span>内存使用</span>
                  </div>
                  <div className="font-mono font-medium">
                    {formatBytes(monitor.metrics.memoryUsage)}
                  </div>
                  <Progress 
                    value={monitor.metrics.memoryUsage / PERFORMANCE_CONFIG.nfrTargets.memoryLimit * 100} 
                    className="h-1"
                  />
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Network className="h-3 w-3" />
                    <span>网络请求</span>
                  </div>
                  <div className="font-mono font-medium">
                    {monitor.metrics.networkRequests}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    节省: {monitor.metrics.networkRequestsSaved}
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>活跃查询: {monitor.metrics.activeQueries}</span>
                  <span>过期查询: {monitor.metrics.staleQueries}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>错误查询: {monitor.metrics.errorQueries}</span>
                  <span>错误率: {formatPercentage(monitor.metrics.errorRate)}</span>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="compliance" className="space-y-3 mt-3">
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getComplianceIcon(monitor.compliance.cacheHitResponseTime)}
                    <span>响应时间</span>
                  </div>
                  <span className="font-mono">
                    {formatTime(monitor.metrics.cacheHitResponseTime)} / {formatTime(PERFORMANCE_CONFIG.nfrTargets.cacheHitResponseTime)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getComplianceIcon(monitor.compliance.memoryUsage)}
                    <span>内存使用</span>
                  </div>
                  <span className="font-mono">
                    {formatBytes(monitor.metrics.memoryUsage)} / {formatBytes(PERFORMANCE_CONFIG.nfrTargets.memoryLimit)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getComplianceIcon(monitor.compliance.cacheHitRate)}
                    <span>缓存命中率</span>
                  </div>
                  <span className="font-mono">
                    {formatPercentage(monitor.metrics.cacheHitRate)} / {formatPercentage(PERFORMANCE_CONFIG.nfrTargets.cacheHitRate)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getComplianceIcon(monitor.compliance.networkReduction)}
                    <span>网络优化</span>
                  </div>
                  <span className="font-mono">
                    {formatPercentage(monitor.metrics.networkRequestsSaved / Math.max(monitor.metrics.networkRequests + monitor.metrics.networkRequestsSaved, 1))} / {formatPercentage(PERFORMANCE_CONFIG.nfrTargets.networkReduction)}
                  </span>
                </div>
              </div>
              
              <div className="border-t pt-2">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {monitor.compliance.score.toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    NFR-1 合规得分
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="alerts" className="space-y-2 mt-3">
              {monitor.alerts.length === 0 ? (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <div>没有活跃告警</div>
                </div>
              ) : (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {monitor.alerts.slice(0, 5).map((alert) => (
                    <Alert key={alert.id} className="p-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <AlertTitle className="text-xs font-medium">
                            {alert.category}
                          </AlertTitle>
                          <AlertDescription className="text-xs">
                            {alert.message}
                          </AlertDescription>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => monitor.resolveAlert(alert.id)}
                        >
                          ×
                        </Button>
                      </div>
                    </Alert>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default PerformanceMonitor