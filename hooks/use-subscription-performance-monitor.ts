'use client'

/**
 * 订阅预加载性能监控Hook
 * 
 * 基于任务20和NFR-1要求，提供实时性能监控和分析功能
 * 特性：
 * - 实时性能指标收集
 * - NFR-1合规性检查
 * - 预加载效果分析
 * - 自动性能优化建议
 * - 开发模式下的可视化面板
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// ==================== 类型定义 ====================

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  // 基础指标
  cacheHitRate: number
  averageResponseTime: number
  memoryUsage: number
  networkRequestsSaved: number
  
  // 预加载指标
  preloadSuccessRate: number
  preloadEfficiency: number
  routePreloadHits: number
  dependencyPreloadHits: number
  
  // NFR-1合规性指标
  cacheHitResponseTime: number
  memoryUtilization: number
  errorRate: number
  
  // 时间戳
  lastUpdated: number
  collectionStartTime: number
}

/**
 * 性能警告
 */
export interface PerformanceAlert {
  id: string
  type: 'warning' | 'error' | 'info'
  metric: string
  threshold: number
  currentValue: number
  message: string
  timestamp: number
  resolved: boolean
}

/**
 * 性能趋势数据
 */
export interface PerformanceTrend {
  timestamp: number
  hitRate: number
  responseTime: number
  memoryUsage: number
  requestCount: number
}

/**
 * NFR-1合规状态
 */
export interface NFRCompliance {
  cacheResponseTime: {
    target: number
    current: number
    compliant: boolean
  }
  memoryUsage: {
    target: number
    current: number
    compliant: boolean
  }
  cacheHitRate: {
    target: number
    current: number
    compliant: boolean
  }
  networkReduction: {
    target: number
    current: number
    compliant: boolean
  }
  overallCompliant: boolean
  score: number
}

// ==================== 常量配置 ====================

/**
 * NFR-1性能目标
 */
const NFR_TARGETS = {
  cacheHitResponseTime: 50, // ms
  memoryLimit: 50 * 1024 * 1024, // 50MB
  cacheHitRate: 0.8, // 80%
  networkReduction: 0.8, // 80%
  errorRate: 0.05, // 5%
}

/**
 * 性能警告阈值
 */
const ALERT_THRESHOLDS = {
  responseTime: {
    warning: 40,
    error: 60,
  },
  memoryUsage: {
    warning: 40 * 1024 * 1024, // 40MB
    error: 45 * 1024 * 1024, // 45MB
  },
  hitRate: {
    warning: 0.7, // 70%
    error: 0.6, // 60%
  },
  errorRate: {
    warning: 0.03, // 3%
    error: 0.08, // 8%
  },
}

// ==================== 核心性能监控Hook ====================

/**
 * 订阅预加载性能监控Hook
 */
export const useSubscriptionPerformanceMonitor = () => {
  const queryClient = useQueryClient()
  
  // 状态管理
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cacheHitRate: 0,
    averageResponseTime: 0,
    memoryUsage: 0,
    networkRequestsSaved: 0,
    preloadSuccessRate: 0,
    preloadEfficiency: 0,
    routePreloadHits: 0,
    dependencyPreloadHits: 0,
    cacheHitResponseTime: 0,
    memoryUtilization: 0,
    errorRate: 0,
    lastUpdated: Date.now(),
    collectionStartTime: Date.now(),
  })
  
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const [trends, setTrends] = useState<PerformanceTrend[]>([])
  
  // 性能数据收集
  const hitTimes = useRef<number[]>([])
  const missTimes = useRef<number[]>([])
  const preloadAttempts = useRef(0)
  const preloadSuccesses = useRef(0)
  const routeHits = useRef(0)
  const dependencyHits = useRef(0)
  const errorCount = useRef(0)
  const requestCount = useRef(0)
  const baselineNetworkRequests = useRef(0)
  
  /**
   * 记录缓存命中性能
   */
  const recordCacheHit = useCallback((responseTime: number, source: 'cache' | 'preload' | 'route' | 'dependency' = 'cache') => {
    hitTimes.current.push(responseTime)
    requestCount.current++
    
    // 限制数组大小
    if (hitTimes.current.length > 1000) {
      hitTimes.current = hitTimes.current.slice(-1000)
    }
    
    // 统计不同来源的命中
    if (source === 'route') {
      routeHits.current++
    } else if (source === 'dependency') {
      dependencyHits.current++
    }
    
    // NFR-1合规性检查
    if (responseTime > NFR_TARGETS.cacheHitResponseTime) {
      console.warn(`Cache hit response time exceeded NFR-1 target: ${responseTime}ms > ${NFR_TARGETS.cacheHitResponseTime}ms`)
    }
  }, [])
  
  /**
   * 记录缓存未命中性能
   */
  const recordCacheMiss = useCallback((responseTime: number) => {
    missTimes.current.push(responseTime)
    requestCount.current++
    baselineNetworkRequests.current++
    
    if (missTimes.current.length > 1000) {
      missTimes.current = missTimes.current.slice(-1000)
    }
  }, [])
  
  /**
   * 记录预加载尝试
   */
  const recordPreloadAttempt = useCallback((success: boolean) => {
    preloadAttempts.current++
    if (success) {
      preloadSuccesses.current++
    }
  }, [])
  
  /**
   * 记录错误
   */
  const recordError = useCallback(() => {
    errorCount.current++
    requestCount.current++
  }, [])
  
  /**
   * 计算当前性能指标
   */
  const calculateMetrics = useCallback((): PerformanceMetrics => {
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()
    
    // 计算缓存命中率
    const totalHits = hitTimes.current.length
    const totalMisses = missTimes.current.length
    const totalRequests = totalHits + totalMisses
    const cacheHitRate = totalRequests > 0 ? totalHits / totalRequests : 0
    
    // 计算平均响应时间
    const allTimes = [...hitTimes.current, ...missTimes.current]
    const averageResponseTime = allTimes.length > 0 
      ? allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length 
      : 0
    
    // 计算缓存命中的平均响应时间
    const cacheHitResponseTime = hitTimes.current.length > 0
      ? hitTimes.current.reduce((sum, time) => sum + time, 0) / hitTimes.current.length
      : 0
    
    // 计算内存使用
    let memoryUsage = 0
    queries.forEach(query => {
      if (query.state.data) {
        memoryUsage += JSON.stringify(query.state.data).length * 2 // UTF-16估算
      }
    })
    
    // 计算预加载成功率
    const preloadSuccessRate = preloadAttempts.current > 0 
      ? preloadSuccesses.current / preloadAttempts.current 
      : 0
    
    // 计算预加载效率（命中数 / 预加载成功数）
    const preloadEfficiency = preloadSuccesses.current > 0 
      ? totalHits / preloadSuccesses.current 
      : 0
    
    // 计算网络请求节省
    const networkRequestsSaved = Math.max(0, baselineNetworkRequests.current - totalMisses)
    
    // 计算错误率
    const errorRate = requestCount.current > 0 ? errorCount.current / requestCount.current : 0
    
    return {
      cacheHitRate,
      averageResponseTime,
      memoryUsage,
      networkRequestsSaved,
      preloadSuccessRate,
      preloadEfficiency,
      routePreloadHits: routeHits.current,
      dependencyPreloadHits: dependencyHits.current,
      cacheHitResponseTime,
      memoryUtilization: memoryUsage / NFR_TARGETS.memoryLimit,
      errorRate,
      lastUpdated: Date.now(),
      collectionStartTime: metrics.collectionStartTime,
    }
  }, [queryClient, metrics.collectionStartTime])
  
  /**
   * 检查NFR-1合规性
   */
  const checkNFRCompliance = useCallback((currentMetrics: PerformanceMetrics): NFRCompliance => {
    const cacheResponseTime = {
      target: NFR_TARGETS.cacheHitResponseTime,
      current: currentMetrics.cacheHitResponseTime,
      compliant: currentMetrics.cacheHitResponseTime <= NFR_TARGETS.cacheHitResponseTime,
    }
    
    const memoryUsage = {
      target: NFR_TARGETS.memoryLimit,
      current: currentMetrics.memoryUsage,
      compliant: currentMetrics.memoryUsage <= NFR_TARGETS.memoryLimit,
    }
    
    const cacheHitRate = {
      target: NFR_TARGETS.cacheHitRate,
      current: currentMetrics.cacheHitRate,
      compliant: currentMetrics.cacheHitRate >= NFR_TARGETS.cacheHitRate,
    }
    
    const totalRequests = hitTimes.current.length + missTimes.current.length
    const networkReductionRate = totalRequests > 0 
      ? currentMetrics.networkRequestsSaved / totalRequests 
      : 0
    
    const networkReduction = {
      target: NFR_TARGETS.networkReduction,
      current: networkReductionRate,
      compliant: networkReductionRate >= NFR_TARGETS.networkReduction,
    }
    
    const compliantCount = [
      cacheResponseTime.compliant,
      memoryUsage.compliant,
      cacheHitRate.compliant,
      networkReduction.compliant,
    ].filter(Boolean).length
    
    const overallCompliant = compliantCount === 4
    const score = (compliantCount / 4) * 100
    
    return {
      cacheResponseTime,
      memoryUsage,
      cacheHitRate,
      networkReduction,
      overallCompliant,
      score,
    }
  }, [])
  
  /**
   * 生成性能警告
   */
  const generateAlerts = useCallback((currentMetrics: PerformanceMetrics): PerformanceAlert[] => {
    const newAlerts: PerformanceAlert[] = []
    
    // 响应时间警告
    if (currentMetrics.averageResponseTime > ALERT_THRESHOLDS.responseTime.error) {
      newAlerts.push({
        id: `response-time-error-${Date.now()}`,
        type: 'error',
        metric: 'averageResponseTime',
        threshold: ALERT_THRESHOLDS.responseTime.error,
        currentValue: currentMetrics.averageResponseTime,
        message: `平均响应时间超过错误阈值: ${currentMetrics.averageResponseTime.toFixed(2)}ms`,
        timestamp: Date.now(),
        resolved: false,
      })
    } else if (currentMetrics.averageResponseTime > ALERT_THRESHOLDS.responseTime.warning) {
      newAlerts.push({
        id: `response-time-warning-${Date.now()}`,
        type: 'warning',
        metric: 'averageResponseTime',
        threshold: ALERT_THRESHOLDS.responseTime.warning,
        currentValue: currentMetrics.averageResponseTime,
        message: `平均响应时间超过警告阈值: ${currentMetrics.averageResponseTime.toFixed(2)}ms`,
        timestamp: Date.now(),
        resolved: false,
      })
    }
    
    // 内存使用警告
    if (currentMetrics.memoryUsage > ALERT_THRESHOLDS.memoryUsage.error) {
      newAlerts.push({
        id: `memory-error-${Date.now()}`,
        type: 'error',
        metric: 'memoryUsage',
        threshold: ALERT_THRESHOLDS.memoryUsage.error,
        currentValue: currentMetrics.memoryUsage,
        message: `内存使用超过错误阈值: ${(currentMetrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
        timestamp: Date.now(),
        resolved: false,
      })
    } else if (currentMetrics.memoryUsage > ALERT_THRESHOLDS.memoryUsage.warning) {
      newAlerts.push({
        id: `memory-warning-${Date.now()}`,
        type: 'warning',
        metric: 'memoryUsage',
        threshold: ALERT_THRESHOLDS.memoryUsage.warning,
        currentValue: currentMetrics.memoryUsage,
        message: `内存使用超过警告阈值: ${(currentMetrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`,
        timestamp: Date.now(),
        resolved: false,
      })
    }
    
    // 缓存命中率警告
    if (currentMetrics.cacheHitRate < ALERT_THRESHOLDS.hitRate.error) {
      newAlerts.push({
        id: `hitrate-error-${Date.now()}`,
        type: 'error',
        metric: 'cacheHitRate',
        threshold: ALERT_THRESHOLDS.hitRate.error,
        currentValue: currentMetrics.cacheHitRate,
        message: `缓存命中率低于错误阈值: ${(currentMetrics.cacheHitRate * 100).toFixed(1)}%`,
        timestamp: Date.now(),
        resolved: false,
      })
    } else if (currentMetrics.cacheHitRate < ALERT_THRESHOLDS.hitRate.warning) {
      newAlerts.push({
        id: `hitrate-warning-${Date.now()}`,
        type: 'warning',
        metric: 'cacheHitRate',
        threshold: ALERT_THRESHOLDS.hitRate.warning,
        currentValue: currentMetrics.cacheHitRate,
        message: `缓存命中率低于警告阈值: ${(currentMetrics.cacheHitRate * 100).toFixed(1)}%`,
        timestamp: Date.now(),
        resolved: false,
      })
    }
    
    // 错误率警告
    if (currentMetrics.errorRate > ALERT_THRESHOLDS.errorRate.error) {
      newAlerts.push({
        id: `errorrate-error-${Date.now()}`,
        type: 'error',
        metric: 'errorRate',
        threshold: ALERT_THRESHOLDS.errorRate.error,
        currentValue: currentMetrics.errorRate,
        message: `错误率超过错误阈值: ${(currentMetrics.errorRate * 100).toFixed(1)}%`,
        timestamp: Date.now(),
        resolved: false,
      })
    } else if (currentMetrics.errorRate > ALERT_THRESHOLDS.errorRate.warning) {
      newAlerts.push({
        id: `errorrate-warning-${Date.now()}`,
        type: 'warning',
        metric: 'errorRate',
        threshold: ALERT_THRESHOLDS.errorRate.warning,
        currentValue: currentMetrics.errorRate,
        message: `错误率超过警告阈值: ${(currentMetrics.errorRate * 100).toFixed(1)}%`,
        timestamp: Date.now(),
        resolved: false,
      })
    }
    
    return newAlerts
  }, [])
  
  /**
   * 更新性能指标
   */
  const updateMetrics = useCallback(() => {
    const currentMetrics = calculateMetrics()
    setMetrics(currentMetrics)
    
    // 生成趋势数据
    setTrends(prev => {
      const newTrend: PerformanceTrend = {
        timestamp: Date.now(),
        hitRate: currentMetrics.cacheHitRate,
        responseTime: currentMetrics.averageResponseTime,
        memoryUsage: currentMetrics.memoryUsage,
        requestCount: hitTimes.current.length + missTimes.current.length,
      }
      
      const updated = [...prev, newTrend]
      // 保持最近100个数据点
      return updated.length > 100 ? updated.slice(-100) : updated
    })
    
    // 生成警告
    const newAlerts = generateAlerts(currentMetrics)
    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts])
      
      // 显示关键警告
      newAlerts.forEach(alert => {
        if (alert.type === 'error') {
          toast.error('性能错误', { description: alert.message })
        } else if (alert.type === 'warning') {
          toast.warning('性能警告', { description: alert.message })
        }
      })
    }
  }, [calculateMetrics, generateAlerts])
  
  /**
   * 开始监控
   */
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true)
    setMetrics(prev => ({ ...prev, collectionStartTime: Date.now() }))
    console.log('Performance monitoring started')
  }, [])
  
  /**
   * 停止监控
   */
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false)
    console.log('Performance monitoring stopped')
  }, [])
  
  /**
   * 重置统计数据
   */
  const resetStats = useCallback(() => {
    hitTimes.current = []
    missTimes.current = []
    preloadAttempts.current = 0
    preloadSuccesses.current = 0
    routeHits.current = 0
    dependencyHits.current = 0
    errorCount.current = 0
    requestCount.current = 0
    baselineNetworkRequests.current = 0
    
    setMetrics({
      cacheHitRate: 0,
      averageResponseTime: 0,
      memoryUsage: 0,
      networkRequestsSaved: 0,
      preloadSuccessRate: 0,
      preloadEfficiency: 0,
      routePreloadHits: 0,
      dependencyPreloadHits: 0,
      cacheHitResponseTime: 0,
      memoryUtilization: 0,
      errorRate: 0,
      lastUpdated: Date.now(),
      collectionStartTime: Date.now(),
    })
    
    setAlerts([])
    setTrends([])
    
    console.log('Performance stats reset')
  }, [])
  
  /**
   * 解决警告
   */
  const resolveAlert = useCallback((alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    )
  }, [])
  
  /**
   * 获取性能报告
   */
  const getPerformanceReport = useCallback(() => {
    const currentMetrics = calculateMetrics()
    const compliance = checkNFRCompliance(currentMetrics)
    const activeAlerts = alerts.filter(alert => !alert.resolved)
    
    return {
      metrics: currentMetrics,
      compliance,
      alerts: activeAlerts,
      trends,
      summary: {
        monitoringDuration: Date.now() - currentMetrics.collectionStartTime,
        totalRequests: hitTimes.current.length + missTimes.current.length,
        totalPreloadAttempts: preloadAttempts.current,
        isNFRCompliant: compliance.overallCompliant,
        complianceScore: compliance.score,
      },
    }
  }, [calculateMetrics, checkNFRCompliance, alerts, trends])
  
  // 定期更新指标
  useEffect(() => {
    if (!isMonitoring) return
    
    const interval = setInterval(updateMetrics, 5000) // 每5秒更新
    return () => clearInterval(interval)
  }, [isMonitoring, updateMetrics])
  
  // 开发模式下自动开始监控
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      startMonitoring()
    }
  }, [startMonitoring])
  
  return {
    // 状态
    isMonitoring,
    metrics,
    alerts: alerts.filter(alert => !alert.resolved),
    allAlerts: alerts,
    trends,
    
    // 控制功能
    startMonitoring,
    stopMonitoring,
    resetStats,
    resolveAlert,
    
    // 记录功能
    recordCacheHit,
    recordCacheMiss,
    recordPreloadAttempt,
    recordError,
    
    // 分析功能
    getPerformanceReport,
    checkNFRCompliance: () => checkNFRCompliance(metrics),
    
    // 工具功能
    updateMetrics,
  }
}

// ==================== 导出 ====================

export default useSubscriptionPerformanceMonitor

/**
 * 性能监控工具函数
 */
export const performanceMonitorUtils = {
  /**
   * 格式化时间
   */
  formatTime: (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  },
  
  /**
   * 格式化内存大小
   */
  formatMemory: (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`
  },
  
  /**
   * 格式化百分比
   */
  formatPercentage: (ratio: number): string => {
    return `${(ratio * 100).toFixed(1)}%`
  },
  
  /**
   * 计算性能等级
   */
  getPerformanceGrade: (score: number): string => {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  },
  
  /**
   * 生成优化建议
   */
  generateOptimizationTips: (metrics: PerformanceMetrics): string[] => {
    const tips: string[] = []
    
    if (metrics.cacheHitRate < 0.8) {
      tips.push('增加预加载策略以提高缓存命中率')
    }
    
    if (metrics.averageResponseTime > 50) {
      tips.push('优化查询函数或调整缓存策略')
    }
    
    if (metrics.memoryUsage > 40 * 1024 * 1024) {
      tips.push('实施缓存清理策略以减少内存使用')
    }
    
    if (metrics.preloadEfficiency < 0.5) {
      tips.push('优化预加载策略，减少无效预加载')
    }
    
    if (metrics.errorRate > 0.03) {
      tips.push('检查网络连接和API稳定性')
    }
    
    return tips
  },
}