'use client'

/**
 * 高级缓存管理工具
 * 
 * 基于任务20优化要求，提供订阅模块的高级缓存管理功能
 * 特性：
 * - 智能缓存预热和批量操作
 * - 条件缓存策略和自动失效
 * - 内存使用优化和清理机制
 * - 缓存性能监控和分析
 * - 支持NFR-1性能要求
 */

import { useCallback, useRef, useEffect, useMemo } from 'react'
import { useQueryClient, QueryKey, QueryFilters } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { createQueryOptions, DataType } from '@/lib/cache-strategies'
import { subscriptionService } from '@/lib/subscription-service'
import { PlanFilters, SubscriptionFilters } from '@/lib/subscription-types'

// ==================== 类型定义 ====================

/**
 * 缓存操作类型
 */
export type CacheOperation = 
  | 'prefetch'     // 预获取
  | 'invalidate'   // 失效
  | 'remove'       // 移除
  | 'refresh'      // 刷新
  | 'warmup'       // 预热
  | 'cleanup'      // 清理

/**
 * 缓存条件配置
 */
export interface CacheCondition {
  /** 用户角色条件 */
  userRole?: string[]
  /** 时间条件 */
  timeRange?: [number, number]
  /** 数据新鲜度要求 */
  maxStaleTime?: number
  /** 内存使用限制 */
  memoryLimit?: number
  /** 网络状态条件 */
  networkCondition?: 'online' | 'offline' | 'slow'
}

/**
 * 批量缓存操作配置
 */
export interface BatchCacheConfig {
  /** 操作类型 */
  operation: CacheOperation
  /** 目标查询键模式 */
  patterns: string[]
  /** 执行条件 */
  condition?: CacheCondition
  /** 并发限制 */
  concurrency?: number
  /** 延迟时间 */
  delay?: number
  /** 优先级 */
  priority?: number
}

/**
 * 缓存性能指标
 */
export interface CacheMetrics {
  /** 缓存命中率 */
  hitRate: number
  /** 平均响应时间 */
  averageResponseTime: number
  /** 内存使用量 */
  memoryUsage: number
  /** 网络请求节省数量 */
  requestsSaved: number
  /** 活跃查询数量 */
  activeQueries: number
  /** 过期查询数量 */
  staleQueries: number
  /** 错误率 */
  errorRate: number
  /** 最后更新时间 */
  lastUpdated: number
}

/**
 * 缓存清理策略
 */
export interface CleanupStrategy {
  /** 清理触发条件 */
  trigger: 'memory' | 'time' | 'manual' | 'error'
  /** 清理目标 */
  target: 'stale' | 'errors' | 'oldest' | 'all'
  /** 清理比例 */
  percentage?: number
  /** 保留数量 */
  keepCount?: number
}

// ==================== 常量配置 ====================

/**
 * 缓存清理策略配置
 */
const CLEANUP_STRATEGIES: Record<string, CleanupStrategy> = {
  memoryPressure: {
    trigger: 'memory',
    target: 'oldest',
    percentage: 0.3,
  },
  errorRecovery: {
    trigger: 'error',
    target: 'errors',
    percentage: 1.0,
  },
  routineCleanup: {
    trigger: 'time',
    target: 'stale',
    percentage: 0.2,
  },
  emergencyCleanup: {
    trigger: 'manual',
    target: 'all',
    keepCount: 10,
  },
}

/**
 * 订阅模块缓存模式
 */
const SUBSCRIPTION_CACHE_PATTERNS = {
  // 计划相关
  plans: {
    all: ['subscriptions', 'plans'],
    lists: ['subscriptions', 'plans', 'list'],
    details: ['subscriptions', 'plans', 'detail'],
    stats: ['subscriptions', 'plans', 'stats'],
  },
  // 用户订阅相关
  userSubscriptions: {
    all: ['subscriptions', 'users'],
    lists: ['subscriptions', 'users', 'list'],
    details: ['subscriptions', 'users', 'detail'],
    byUser: ['subscriptions', 'users', 'by-user'],
  },
  // 我的订阅相关
  mySubscriptions: {
    all: ['subscriptions', 'my'],
    active: ['subscriptions', 'my', 'active'],
  },
  // 统计相关
  stats: {
    dashboard: ['dashboard', 'subscription-stats'],
    plans: ['subscriptions', 'plans', 'stats'],
    traffic: ['subscriptions', 'traffic-stats'],
  },
}

// ==================== 核心缓存管理Hook ====================

/**
 * 高级缓存管理Hook
 * 
 * @returns 缓存管理工具函数集合
 */
export const useAdvancedCacheManager = () => {
  const queryClient = useQueryClient()
  
  // 性能监控数据
  const metrics = useRef<CacheMetrics>({
    hitRate: 0,
    averageResponseTime: 0,
    memoryUsage: 0,
    requestsSaved: 0,
    activeQueries: 0,
    staleQueries: 0,
    errorRate: 0,
    lastUpdated: Date.now(),
  })
  
  // 性能计时器
  const responseTimes = useRef<number[]>([])
  const hitCount = useRef(0)
  const missCount = useRef(0)
  const errorCount = useRef(0)
  const requestCount = useRef(0)
  
  /**
   * 更新性能指标
   */
  const updateMetrics = useCallback(() => {
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()
    
    // 计算基础统计
    const activeQueries = queries.filter(q => q.getObserversCount() > 0).length
    const staleQueries = queries.filter(q => q.isStale()).length
    const errorQueries = queries.filter(q => q.state.status === 'error').length
    
    // 计算命中率
    const totalRequests = hitCount.current + missCount.current
    const hitRate = totalRequests > 0 ? hitCount.current / totalRequests : 0
    
    // 计算平均响应时间
    const avgResponseTime = responseTimes.current.length > 0 
      ? responseTimes.current.reduce((sum, time) => sum + time, 0) / responseTimes.current.length
      : 0
    
    // 计算错误率
    const errorRate = requestCount.current > 0 ? errorCount.current / requestCount.current : 0
    
    // 估算内存使用
    let memoryUsage = 0
    queries.forEach(query => {
      if (query.state.data) {
        memoryUsage += JSON.stringify(query.state.data).length * 2
      }
    })
    
    metrics.current = {
      hitRate,
      averageResponseTime: avgResponseTime,
      memoryUsage,
      requestsSaved: hitCount.current,
      activeQueries,
      staleQueries,
      errorRate,
      lastUpdated: Date.now(),
    }
  }, [queryClient])
  
  /**
   * 记录缓存命中
   */
  const recordCacheHit = useCallback((responseTime: number) => {
    hitCount.current++
    responseTimes.current.push(responseTime)
    
    // 保持最近100次记录
    if (responseTimes.current.length > 100) {
      responseTimes.current = responseTimes.current.slice(-100)
    }
    
    updateMetrics()
  }, [updateMetrics])
  
  /**
   * 记录缓存未命中
   */
  const recordCacheMiss = useCallback((responseTime: number) => {
    missCount.current++
    responseTimes.current.push(responseTime)
    updateMetrics()
  }, [updateMetrics])
  
  /**
   * 记录请求错误
   */
  const recordError = useCallback(() => {
    errorCount.current++
    requestCount.current++
    updateMetrics()
  }, [updateMetrics])
  
  /**
   * 检查缓存条件
   */
  const checkCacheCondition = useCallback((condition?: CacheCondition): boolean => {
    if (!condition) return true
    
    // 检查内存限制
    if (condition.memoryLimit && metrics.current.memoryUsage > condition.memoryLimit) {
      return false
    }
    
    // 检查时间范围
    if (condition.timeRange) {
      const now = Date.now()
      const [start, end] = condition.timeRange
      if (now < start || now > end) {
        return false
      }
    }
    
    // 检查网络状态
    if (condition.networkCondition && 'connection' in navigator) {
      const connection = (navigator as any).connection
      if (condition.networkCondition === 'slow' && connection.effectiveType !== '4g') {
        return false
      }
    }
    
    return true
  }, [])
  
  /**
   * 执行缓存清理
   */
  const executeCleanup = useCallback((strategy: CleanupStrategy) => {
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()
    
    let toRemove: any[] = []
    
    switch (strategy.target) {
      case 'stale':
        toRemove = queries.filter(query => query.isStale())
        break
      case 'errors':
        toRemove = queries.filter(query => query.state.status === 'error')
        break
      case 'oldest':
        toRemove = queries
          .sort((a, b) => (a.state.dataUpdatedAt || 0) - (b.state.dataUpdatedAt || 0))
        break
      case 'all':
        toRemove = queries
        break
    }
    
    // 根据策略参数限制移除数量
    if (strategy.percentage) {
      const removeCount = Math.floor(toRemove.length * strategy.percentage)
      toRemove = toRemove.slice(0, removeCount)
    } else if (strategy.keepCount) {
      const removeCount = Math.max(0, toRemove.length - strategy.keepCount)
      toRemove = toRemove.slice(0, removeCount)
    }
    
    // 执行移除
    toRemove.forEach(query => {
      cache.remove(query)
    })
    
    console.log(`Cache cleanup: removed ${toRemove.length} queries (strategy: ${strategy.target})`)
    updateMetrics()
    
    return toRemove.length
  }, [queryClient, updateMetrics])
  
  /**
   * 智能缓存预热
   */
  const warmupCache = useCallback(async (patterns: string[], condition?: CacheCondition) => {
    if (!checkCacheCondition(condition)) {
      console.log('Cache warmup skipped due to condition check')
      return
    }
    
    const warmupTasks: Promise<any>[] = []
    
    // 基础预热任务 - 模拟常见查询
    patterns.forEach(pattern => {
      switch (pattern) {
        case 'plans':
          // 订阅计划预热
          warmupTasks.push(
            queryClient.prefetchQuery({
              queryKey: ['subscriptions', 'plans'],
              queryFn: async () => {
                // 模拟API调用
                await new Promise(resolve => setTimeout(resolve, 50))
                return { data: [], total: 0 }
              },
              ...createQueryOptions(DataType.STATIC),
            })
          )
          break
          
        case 'user-subscriptions':
          // 用户订阅预热
          warmupTasks.push(
            queryClient.prefetchQuery({
              queryKey: ['subscriptions', 'users'],
              queryFn: async () => {
                await new Promise(resolve => setTimeout(resolve, 100))
                return { data: [], total: 0 }
              },
              ...createQueryOptions(DataType.USER),
            })
          )
          break
          
        case 'my-subscriptions':
          // 我的订阅预热
          warmupTasks.push(
            queryClient.prefetchQuery({
              queryKey: ['subscriptions', 'my'],
              queryFn: async () => {
                await new Promise(resolve => setTimeout(resolve, 75))
                return { data: [], total: 0 }
              },
              ...createQueryOptions(DataType.USER),
            })
          )
          break
          
        case 'stats':
          // 统计数据预热
          warmupTasks.push(
            queryClient.prefetchQuery({
              queryKey: ['dashboard', 'subscription-stats'],
              queryFn: async () => {
                await new Promise(resolve => setTimeout(resolve, 120))
                return { data: { totalUsers: 0, totalSubscriptions: 0 } }
              },
              ...createQueryOptions(DataType.STATS),
            })
          )
          break
      }
    })
    
    try {
      await Promise.allSettled(warmupTasks)
      console.log(`Cache warmup completed for patterns: ${patterns.join(', ')}`)
    } catch (error) {
      console.error('Cache warmup failed:', error)
      recordError()
    }
  }, [queryClient, checkCacheCondition, recordError])
  
  /**
   * 批量缓存操作
   */
  const executeBatchOperation = useCallback(async (config: BatchCacheConfig) => {
    if (!checkCacheCondition(config.condition)) {
      console.log(`Batch operation ${config.operation} skipped due to condition check`)
      return
    }
    
    const cache = queryClient.getQueryCache()
    const { operation, patterns, concurrency = 3, delay = 100 } = config
    
    // 查找匹配的查询
    const matchingQueries = cache.getAll().filter(query => {
      const queryKey = query.queryKey
      return patterns.some(pattern => {
        const patternParts = pattern.split('.')
        const keyStr = JSON.stringify(queryKey)
        return patternParts.every(part => keyStr.includes(part))
      })
    })
    
    console.log(`Found ${matchingQueries.length} queries matching patterns: ${patterns.join(', ')}`)
    
    // 批量执行操作
    const chunks = []
    for (let i = 0; i < matchingQueries.length; i += concurrency) {
      chunks.push(matchingQueries.slice(i, i + concurrency))
    }
    
    for (const chunk of chunks) {
      const promises = chunk.map(async (query) => {
        try {
          switch (operation) {
            case 'invalidate':
              await queryClient.invalidateQueries({ queryKey: query.queryKey })
              break
            case 'remove':
              cache.remove(query)
              break
            case 'refresh':
              await queryClient.refetchQueries({ queryKey: query.queryKey })
              break
            case 'prefetch':
              if (query.queryFn) {
                await queryClient.prefetchQuery({
                  queryKey: query.queryKey,
                  queryFn: query.queryFn,
                })
              }
              break
          }
        } catch (error) {
          console.error(`Batch operation ${operation} failed for query:`, query.queryKey, error)
          recordError()
        }
      })
      
      await Promise.allSettled(promises)
      
      if (delay > 0 && chunks.indexOf(chunk) < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    updateMetrics()
  }, [queryClient, checkCacheCondition, recordError, updateMetrics])
  
  /**
   * 智能失效相关缓存
   */
  const invalidateRelatedCache = useCallback(async (
    module: 'plans' | 'subscriptions' | 'users' | 'stats',
    entityId?: string | number
  ) => {
    const patterns: string[] = []
    
    switch (module) {
      case 'plans':
        patterns.push('subscriptions.plans')
        if (entityId) {
          await queryClient.invalidateQueries({
            queryKey: queryKeys.subscriptions.plans.detail(entityId)
          })
        }
        // 计划变更影响用户订阅和统计
        patterns.push('subscriptions.users', 'dashboard.subscription')
        break
        
      case 'subscriptions':
        patterns.push('subscriptions.users')
        if (entityId) {
          await queryClient.invalidateQueries({
            queryKey: queryKeys.subscriptions.users.detail(entityId)
          })
        }
        // 订阅变更影响统计和我的订阅
        patterns.push('subscriptions.my', 'dashboard.subscription')
        break
        
      case 'users':
        patterns.push('subscriptions.users', 'subscriptions.my')
        // 用户变更影响统计
        patterns.push('dashboard.subscription')
        break
        
      case 'stats':
        patterns.push('dashboard.subscription', 'subscriptions.plans.stats')
        break
    }
    
    await executeBatchOperation({
      operation: 'invalidate',
      patterns,
      concurrency: 5,
    })
  }, [queryClient, executeBatchOperation])
  
  /**
   * 条件性缓存刷新
   */
  const conditionalRefresh = useCallback(async (
    filters: {
      maxAge?: number
      errorOnly?: boolean
      staleOnly?: boolean
      patterns?: string[]
    }
  ) => {
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()
    
    const toRefresh = queries.filter(query => {
      // 检查模式匹配
      if (filters.patterns) {
        const queryKey = JSON.stringify(query.queryKey)
        const matches = filters.patterns.some(pattern => queryKey.includes(pattern))
        if (!matches) return false
      }
      
      // 检查错误状态
      if (filters.errorOnly && query.state.status !== 'error') {
        return false
      }
      
      // 检查过期状态
      if (filters.staleOnly && !query.isStale()) {
        return false
      }
      
      // 检查年龄
      if (filters.maxAge) {
        const age = Date.now() - (query.state.dataUpdatedAt || 0)
        if (age < filters.maxAge) {
          return false
        }
      }
      
      return true
    })
    
    console.log(`Conditional refresh: ${toRefresh.length} queries match criteria`)
    
    // 执行刷新
    const refreshPromises = toRefresh.map(query => 
      queryClient.refetchQueries({ queryKey: query.queryKey })
    )
    
    await Promise.allSettled(refreshPromises)
    updateMetrics()
  }, [queryClient, updateMetrics])
  
  /**
   * 自动缓存维护
   */
  const autoMaintenance = useCallback(() => {
    const currentMetrics = metrics.current
    
    // 内存压力检查
    if (currentMetrics.memoryUsage > 8 * 1024 * 1024) { // 8MB
      executeCleanup(CLEANUP_STRATEGIES.memoryPressure)
    }
    
    // 错误率检查
    if (currentMetrics.errorRate > 0.1) { // 10%
      executeCleanup(CLEANUP_STRATEGIES.errorRecovery)
    }
    
    // 过期查询清理
    if (currentMetrics.staleQueries > 20) {
      executeCleanup(CLEANUP_STRATEGIES.routineCleanup)
    }
    
    // 性能监控
    if (currentMetrics.averageResponseTime > 50) {
      console.warn('Average response time exceeds 50ms threshold')
    }
    
    if (currentMetrics.hitRate < 0.8) {
      console.warn('Cache hit rate below 80% threshold')
    }
  }, [executeCleanup])
  
  /**
   * 获取缓存分析报告
   */
  const getCacheAnalysis = useCallback(() => {
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()
    
    // 按模块分类统计
    const moduleStats: Record<string, any> = {}
    
    queries.forEach(query => {
      const module = Array.isArray(query.queryKey) ? query.queryKey[0] as string : 'unknown'
      
      if (!moduleStats[module]) {
        moduleStats[module] = {
          total: 0,
          active: 0,
          stale: 0,
          errors: 0,
          memoryUsage: 0,
        }
      }
      
      moduleStats[module].total++
      
      if (query.getObserversCount() > 0) {
        moduleStats[module].active++
      }
      
      if (query.isStale()) {
        moduleStats[module].stale++
      }
      
      if (query.state.status === 'error') {
        moduleStats[module].errors++
      }
      
      if (query.state.data) {
        moduleStats[module].memoryUsage += JSON.stringify(query.state.data).length * 2
      }
    })
    
    return {
      global: metrics.current,
      modules: moduleStats,
      recommendations: generateRecommendations(metrics.current, moduleStats),
    }
  }, [queryClient])
  
  /**
   * 生成优化建议
   */
  const generateRecommendations = useCallback((
    globalMetrics: CacheMetrics,
    moduleStats: Record<string, any>
  ): string[] => {
    const recommendations: string[] = []
    
    if (globalMetrics.hitRate < 0.8) {
      recommendations.push('考虑增加预加载策略以提高缓存命中率')
    }
    
    if (globalMetrics.averageResponseTime > 50) {
      recommendations.push('优化查询函数或增加缓存时间以降低响应时间')
    }
    
    if (globalMetrics.memoryUsage > 8 * 1024 * 1024) {
      recommendations.push('执行缓存清理以减少内存使用')
    }
    
    if (globalMetrics.errorRate > 0.05) {
      recommendations.push('检查网络状态和API可用性，错误率偏高')
    }
    
    // 模块级建议
    Object.entries(moduleStats).forEach(([module, stats]) => {
      if (stats.stale / stats.total > 0.5) {
        recommendations.push(`${module}模块过期查询比例过高，考虑调整缓存策略`)
      }
      
      if (stats.errors / stats.total > 0.1) {
        recommendations.push(`${module}模块错误率较高，需要排查API问题`)
      }
    })
    
    return recommendations
  }, [])
  
  // 定期更新指标
  useEffect(() => {
    const interval = setInterval(() => {
      updateMetrics()
    }, 10000) // 每10秒更新
    
    return () => clearInterval(interval)
  }, [updateMetrics])
  
  // 定期自动维护
  useEffect(() => {
    const interval = setInterval(() => {
      autoMaintenance()
    }, 300000) // 每5分钟执行维护
    
    return () => clearInterval(interval)
  }, [autoMaintenance])
  
  return {
    // 核心功能
    warmupCache,
    executeBatchOperation,
    invalidateRelatedCache,
    conditionalRefresh,
    executeCleanup,
    
    // 监控和分析
    recordCacheHit,
    recordCacheMiss,
    recordError,
    getCacheAnalysis,
    getMetrics: () => metrics.current,
    
    // 维护功能
    autoMaintenance,
    
    // 配置和工具
    checkCacheCondition,
    patterns: SUBSCRIPTION_CACHE_PATTERNS,
    strategies: CLEANUP_STRATEGIES,
  }
}

// ==================== 专用缓存管理Hooks ====================

/**
 * 订阅计划缓存管理
 */
export const usePlanCacheManager = () => {
  const cacheManager = useAdvancedCacheManager()
  
  const warmupPlans = useCallback((filters?: PlanFilters) => {
    return cacheManager.warmupCache(['plans'], {
      memoryLimit: 5 * 1024 * 1024, // 5MB限制
    })
  }, [cacheManager])
  
  const invalidatePlans = useCallback((planId?: string | number) => {
    return cacheManager.invalidateRelatedCache('plans', planId)
  }, [cacheManager])
  
  return {
    warmupPlans,
    invalidatePlans,
    ...cacheManager,
  }
}

/**
 * 用户订阅缓存管理
 */
export const useSubscriptionCacheManager = () => {
  const cacheManager = useAdvancedCacheManager()
  
  const warmupSubscriptions = useCallback((filters?: SubscriptionFilters) => {
    return cacheManager.warmupCache(['user-subscriptions'], {
      memoryLimit: 3 * 1024 * 1024, // 3MB限制
    })
  }, [cacheManager])
  
  const invalidateSubscriptions = useCallback((subscriptionId?: string | number) => {
    return cacheManager.invalidateRelatedCache('subscriptions', subscriptionId)
  }, [cacheManager])
  
  return {
    warmupSubscriptions,
    invalidateSubscriptions,
    ...cacheManager,
  }
}

// ==================== 导出 ====================

export default {
  useAdvancedCacheManager,
  usePlanCacheManager,
  useSubscriptionCacheManager,
}

/**
 * 缓存管理工具函数
 */
export const cacheManagerUtils = {
  /**
   * 估算查询数据大小
   */
  estimateQuerySize: (data: any): number => {
    return JSON.stringify(data).length * 2 // UTF-16估算
  },
  
  /**
   * 生成缓存键模式
   */
  createPattern: (module: string, operation?: string, entity?: string): string => {
    let pattern = module
    if (operation) pattern += `.${operation}`
    if (entity) pattern += `.${entity}`
    return pattern
  },
  
  /**
   * 检查查询是否匹配模式
   */
  matchesPattern: (queryKey: any[], pattern: string): boolean => {
    const keyStr = JSON.stringify(queryKey)
    const patternParts = pattern.split('.')
    return patternParts.every(part => keyStr.includes(part))
  },
  
  /**
   * 计算缓存命中率
   */
  calculateHitRate: (hits: number, misses: number): number => {
    const total = hits + misses
    return total > 0 ? hits / total : 0
  },
  
  /**
   * 格式化内存大小
   */
  formatMemorySize: (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`
  },
}