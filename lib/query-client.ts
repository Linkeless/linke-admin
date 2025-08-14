'use client'

import { QueryClient, QueryClientConfig, DefaultOptions } from '@tanstack/react-query'
import { globalErrorHandler, ErrorType, errorUtils } from './error-handler'
import { clearTokens } from './api'
import { PERFORMANCE_CONFIG, getCurrentEnvironmentConfig } from './performance-config'

// ==================== React Query 性能优化配置 ====================

// 环境配置
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'
const currentEnvConfig = getCurrentEnvironmentConfig()

// 优化的缓存配置常量 - 基于NFR-1要求
const CACHE_CONFIG = {
  // 数据新鲜度时间 - 基于数据类型优化
  staleTime: currentEnvConfig.cacheOptimization.userData.staleTime,
  // 垃圾回收时间 - 使用gcTime替代已废弃的cacheTime
  gcTime: currentEnvConfig.cacheOptimization.userData.gcTime,
  // 重试配置 - 优化的退避策略
  retry: {
    maxAttempts: currentEnvConfig.networkOptimization.retryOptimization.maxRetries.readOperations,
    delay: (attemptIndex: number) => Math.min(
      currentEnvConfig.networkOptimization.retryOptimization.exponentialBackoff.baseDelay * 
      Math.pow(currentEnvConfig.networkOptimization.retryOptimization.exponentialBackoff.multiplier, attemptIndex), 
      currentEnvConfig.networkOptimization.retryOptimization.exponentialBackoff.maxDelay
    )
  },
  // 内存管理
  memoryLimit: currentEnvConfig.cacheSize,
  // 性能监控
  performanceTracking: isDevelopment || currentEnvConfig.monitoring.production.enabled
} as const

// 性能监控变量
let performanceStartTime = Date.now()
let cacheHitCount = 0
let cacheMissCount = 0
let errorCount = 0
const responseTimes: number[] = []

// 查询默认配置 - 基于性能优化
const queryDefaults: DefaultOptions['queries'] = {
  // 优化的缓存策略
  staleTime: CACHE_CONFIG.staleTime,
  gcTime: CACHE_CONFIG.gcTime, // 使用gcTime替代cacheTime
  
  // 网络重连配置 - 基于性能配置优化
  refetchOnWindowFocus: currentEnvConfig.cacheOptimization.userData.refetchOnWindowFocus,
  refetchOnReconnect: currentEnvConfig.cacheOptimization.userData.refetchOnReconnect,
  refetchOnMount: currentEnvConfig.cacheOptimization.userData.refetchOnMount,
  
  // 重试策略 - 智能重试逻辑
  retry: (failureCount, error: any) => {
    // 401认证错误不重试 (会触发自动登录重定向)
    if (error?.response?.status === 401) {
      return false
    }
    
    // 403权限错误不重试
    if (error?.response?.status === 403) {
      return false
    }
    
    // 404资源不存在错误不重试
    if (error?.response?.status === 404) {
      return false
    }
    
    // 422验证错误不重试
    if (error?.response?.status === 422) {
      return false
    }
    
    // 429限流错误不重试 (由API层处理)
    if (error?.response?.status === 429) {
      return false
    }
    
    // 其他错误最多重试2次
    return failureCount < CACHE_CONFIG.retry.maxAttempts
  },
  
  // 重试延迟策略 - 增强的指数退避
  retryDelay: (attemptIndex: number, error: any) => {
    // 网络错误使用更长的延迟
    if (error?.code === 'NETWORK_ERROR') {
      return Math.min(5000 * Math.pow(2, attemptIndex), 30000)
    }
    
    // 服务器错误使用固定延迟
    if (error?.response?.status >= 500) {
      return 10000 // 10秒
    }
    
    // 其他错误使用标准退避
    return CACHE_CONFIG.retry.delay(attemptIndex)
  },
  
  // 性能优化的错误处理
  onError: (error: any) => {
    recordCacheMiss() // 记录缓存未命中
    recordError() // 记录错误
    handleQueryError(error, 'Query')
  },
  
  // 成功处理 - 记录缓存命中
  onSuccess: (data: any) => {
    recordCacheHit() // 记录缓存命中
    if (CACHE_CONFIG.performanceTracking && isDevelopment) {
      console.log('Query cache hit:', { data: !!data, timestamp: Date.now() })
    }
  },
  
  // 环境特定配置覆盖
  ...(isDevelopment && {
    // 开发环境保持默认配置用于调试
  }),
  
  ...(isProduction && {
    // 生产环境优化配置
    staleTime: currentEnvConfig.cacheOptimization.staticData.staleTime, // 更长的缓存时间
    gcTime: currentEnvConfig.cacheOptimization.staticData.gcTime,
  })
}

// 变更默认配置
const mutationDefaults: DefaultOptions['mutations'] = {
  // 变更不自动重试，由用户手动控制
  retry: false,
  
  // 错误处理
  onError: (error: any) => {
    handleQueryError(error, 'Mutation')
  },
  
  // 成功后可选的操作
  onSuccess: (data: any, variables: any, context: any) => {
    // 可以在这里添加全局成功处理逻辑
    if (isDevelopment) {
      console.log('Mutation success:', { data, variables, context })
    }
  }
}

// ==================== 性能监控函数 ====================

/**
 * 记录缓存命中
 */
function recordCacheHit(responseTime: number = 20) {
  if (!CACHE_CONFIG.performanceTracking) return
  
  cacheHitCount++
  responseTimes.push(responseTime)
  
  // 保持最近1000次记录，避免内存泄漏
  if (responseTimes.length > 1000) {
    responseTimes.splice(0, responseTimes.length - 1000)
  }
  
  // NFR-1合规性检查
  if (responseTime > PERFORMANCE_CONFIG.nfrTargets.cacheHitResponseTime) {
    console.warn(
      `[Performance] Cache hit response time ${responseTime}ms exceeds NFR-1 target ${PERFORMANCE_CONFIG.nfrTargets.cacheHitResponseTime}ms`
    )
  }
}

/**
 * 记录缓存未命中
 */
function recordCacheMiss(responseTime: number = 100) {
  if (!CACHE_CONFIG.performanceTracking) return
  
  cacheMissCount++
  responseTimes.push(responseTime)
  
  if (responseTimes.length > 1000) {
    responseTimes.splice(0, responseTimes.length - 1000)
  }
}

/**
 * 记录错误
 */
function recordError() {
  if (!CACHE_CONFIG.performanceTracking) return
  errorCount++
}

/**
 * 获取性能指标
 */
function getPerformanceMetrics() {
  if (!CACHE_CONFIG.performanceTracking) return null
  
  const totalRequests = cacheHitCount + cacheMissCount
  const cacheHitRate = totalRequests > 0 ? cacheHitCount / totalRequests : 0
  const avgResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
    : 0
  
  // 计算缓存命中的平均响应时间（假设前80%为缓存命中）
  const sortedTimes = [...responseTimes].sort((a, b) => a - b)
  const cacheHitTimes = sortedTimes.slice(0, Math.floor(sortedTimes.length * 0.8))
  const cacheHitResponseTime = cacheHitTimes.length > 0
    ? cacheHitTimes.reduce((sum, time) => sum + time, 0) / cacheHitTimes.length
    : avgResponseTime
  
  const errorRate = totalRequests > 0 ? errorCount / totalRequests : 0
  const networkReduction = cacheHitRate
  
  return {
    cacheHitRate,
    avgResponseTime,
    cacheHitResponseTime,
    errorRate,
    networkReduction,
    totalRequests,
    cacheHits: cacheHitCount,
    cacheMisses: cacheMissCount,
    errors: errorCount,
    uptime: Date.now() - performanceStartTime,
  }
}

/**
 * 重置性能统计
 */
function resetPerformanceStats() {
  performanceStartTime = Date.now()
  cacheHitCount = 0
  cacheMissCount = 0
  errorCount = 0
  responseTimes.length = 0
}

/**
 * 检查内存使用情况
 */
function checkMemoryUsage(queryClient: QueryClient): number {
  const cache = queryClient.getQueryCache()
  const queries = cache.getAll()
  
  let totalMemory = 0
  queries.forEach(query => {
    if (query.state.data) {
      // 估算数据大小 (UTF-16编码，每字符2字节)
      totalMemory += JSON.stringify(query.state.data).length * 2
    }
  })
  
  // 检查内存限制
  if (totalMemory > CACHE_CONFIG.memoryLimit) {
    console.warn(
      `[Performance] Memory usage ${(totalMemory / 1024 / 1024).toFixed(2)}MB exceeds limit ${(CACHE_CONFIG.memoryLimit / 1024 / 1024).toFixed(2)}MB`
    )
    
    // 触发自动清理
    if (currentEnvConfig.memoryOptimization.autoCleanup.enabled) {
      performAutomaticCleanup(queryClient)
    }
  }
  
  return totalMemory
}

/**
 * 执行自动清理
 */
function performAutomaticCleanup(queryClient: QueryClient) {
  const cache = queryClient.getQueryCache()
  const queries = cache.getAll()
  
  // 获取过期和错误查询
  const staleQueries = queries.filter(q => q.isStale())
  const errorQueries = queries.filter(q => q.state.status === 'error')
  
  // 清理错误查询
  errorQueries.forEach(query => {
    cache.remove(query)
  })
  
  // 清理部分过期查询
  const cleanupCount = Math.floor(
    staleQueries.length * currentEnvConfig.memoryOptimization.autoCleanup.cleanupPercentage
  )
  
  staleQueries
    .sort((a, b) => (a.state.dataUpdatedAt || 0) - (b.state.dataUpdatedAt || 0)) // 最旧的优先
    .slice(0, cleanupCount)
    .forEach(query => {
      cache.remove(query)
    })
  
  if (isDevelopment) {
    console.log(
      `[Performance] Automatic cleanup completed: removed ${errorQueries.length} error queries and ${cleanupCount} stale queries`
    )
  }
}

// ==================== 错误处理函数 ====================

// 统一错误处理函数
async function handleQueryError(error: any, operation: 'Query' | 'Mutation'): Promise<void> {
  try {
    // 使用特定的React Query错误处理方法
    let standardError: any
    if (operation === 'Query') {
      standardError = await globalErrorHandler.handleQueryError(error, {
        operation,
        timestamp: Date.now(),
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window?.location?.href : undefined,
        referer: typeof document !== 'undefined' ? document?.referrer : undefined
      })
    } else {
      standardError = await globalErrorHandler.handleMutationError(error, {
        operation,
        timestamp: Date.now(),
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window?.location?.href : undefined,
        referer: typeof document !== 'undefined' ? document?.referrer : undefined
      })
    }
    
    // 特殊处理认证错误（已在错误处理器中处理，这里只需清除token）
    if (standardError.type === ErrorType.AUTHENTICATION_ERROR) {
      clearTokens()
      return
    }
    
    // 记录错误到性能监控
    recordError()
    
    // 开发环境下输出详细错误信息
    if (isDevelopment) {
      console.error(`React Query ${operation} Error:`, {
        originalError: error,
        standardError,
        userFriendlyMessage: errorUtils.formatUserMessage(standardError),
        context: {
          timestamp: new Date().toISOString(),
          operation,
          errorType: standardError.type,
          severity: standardError.severity,
          isRetryable: standardError.isRetryable
        }
      })
    }
    
  } catch (handlingError) {
    console.error('Error handling failed:', handlingError)
    recordError() // 记录错误处理失败
  }
}

// QueryClient配置
const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: queryDefaults,
    mutations: mutationDefaults
  },
  
  // 日志配置
  logger: isDevelopment ? {
    log: console.log,
    warn: console.warn,
    error: console.error,
  } : {
    log: () => {}, // 生产环境禁用日志
    warn: () => {},
    error: () => {},
  }
}

// 创建QueryClient实例 - 增强版本
export const createQueryClient = (): QueryClient => {
  const client = new QueryClient(queryClientConfig)
  
  // 客户端环境下启用性能监控
  if (typeof window !== 'undefined' && CACHE_CONFIG.performanceTracking) {
    // 定期检查内存使用
    setInterval(() => {
      checkMemoryUsage(client)
    }, currentEnvConfig.memoryOptimization.autoCleanup.interval)
    
    // 定期输出性能指标（开发环境）
    if (isDevelopment) {
      setInterval(() => {
        const metrics = getPerformanceMetrics()
        if (metrics) {
          console.log('[Performance Metrics]', {
            cacheHitRate: `${(metrics.cacheHitRate * 100).toFixed(1)}%`,
            avgResponseTime: `${metrics.avgResponseTime.toFixed(1)}ms`,
            cacheHitResponseTime: `${metrics.cacheHitResponseTime.toFixed(1)}ms`,
            errorRate: `${(metrics.errorRate * 100).toFixed(1)}%`,
            totalRequests: metrics.totalRequests,
            uptime: `${(metrics.uptime / 1000).toFixed(0)}s`
          })
        }
      }, 30000) // 每30秒输出一次
    }
  }
  
  return client
}

// 单例QueryClient (用于客户端)
let queryClientInstance: QueryClient | undefined

export const getQueryClient = (): QueryClient => {
  if (typeof window === 'undefined') {
    // 服务端每次都创建新实例
    return createQueryClient()
  }
  
  // 客户端使用单例
  if (!queryClientInstance) {
    queryClientInstance = createQueryClient()
  }
  
  return queryClientInstance
}

// 查询键工厂 - 标准化查询键管理
export const queryKeys = {
  // 用户相关
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.users.lists(), { filters }] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  
  // 订阅相关
  subscriptions: {
    all: ['subscriptions'] as const,
    lists: () => [...queryKeys.subscriptions.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.subscriptions.lists(), { filters }] as const,
    details: () => [...queryKeys.subscriptions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.subscriptions.details(), id] as const,
    plans: {
      all: ['subscriptions', 'plans'] as const,
      lists: () => [...queryKeys.subscriptions.plans.all, 'list'] as const,
      list: (filters: Record<string, any>) => [...queryKeys.subscriptions.plans.lists(), { filters }] as const,
    }
  },
  
  // 财务相关
  finance: {
    orders: {
      all: ['finance', 'orders'] as const,
      lists: () => [...queryKeys.finance.orders.all, 'list'] as const,
      list: (filters: Record<string, any>) => [...queryKeys.finance.orders.lists(), { filters }] as const,
      details: () => [...queryKeys.finance.orders.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.finance.orders.details(), id] as const,
    },
    coupons: {
      all: ['finance', 'coupons'] as const,
      lists: () => [...queryKeys.finance.coupons.all, 'list'] as const,
      list: (filters: Record<string, any>) => [...queryKeys.finance.coupons.lists(), { filters }] as const,
    }
  },
  
  // 服务器相关
  servers: {
    all: ['servers'] as const,
    lists: () => [...queryKeys.servers.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.servers.lists(), { filters }] as const,
    groups: {
      all: ['servers', 'groups'] as const,
      lists: () => [...queryKeys.servers.groups.all, 'list'] as const,
      list: (filters: Record<string, any>) => [...queryKeys.servers.groups.lists(), { filters }] as const,
    }
  },
  
  // 客户支持相关
  support: {
    tickets: {
      all: ['support', 'tickets'] as const,
      lists: () => [...queryKeys.support.tickets.all, 'list'] as const,
      list: (filters: Record<string, any>) => [...queryKeys.support.tickets.lists(), { filters }] as const,
      details: () => [...queryKeys.support.tickets.all, 'detail'] as const,
      detail: (id: string) => [...queryKeys.support.tickets.details(), id] as const,
    }
  },
  
  // 仪表板相关
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
    charts: () => [...queryKeys.dashboard.all, 'charts'] as const,
  },
  
  // 系统设置相关
  settings: {
    all: ['settings'] as const,
    config: () => [...queryKeys.settings.all, 'config'] as const,
    payments: () => [...queryKeys.settings.all, 'payments'] as const,
  }
} as const

// 缓存工具函数
export const cacheUtils = {
  // 获取查询数据
  getQueryData: <T>(queryKey: readonly unknown[]): T | undefined => {
    return getQueryClient().getQueryData<T>(queryKey)
  },
  
  // 设置查询数据
  setQueryData: <T>(queryKey: readonly unknown[], data: T): void => {
    getQueryClient().setQueryData<T>(queryKey, data)
  },
  
  // 使查询数据失效
  invalidateQueries: (queryKey?: readonly unknown[]): Promise<void> => {
    return getQueryClient().invalidateQueries({ queryKey })
  },
  
  // 预获取数据
  prefetchQuery: <T>(
    queryKey: readonly unknown[],
    queryFn: () => Promise<T>,
    options?: { staleTime?: number }
  ): Promise<void> => {
    return getQueryClient().prefetchQuery({
      queryKey,
      queryFn,
      staleTime: options?.staleTime || CACHE_CONFIG.staleTime
    })
  },
  
  // 清除查询缓存
  removeQueries: (queryKey?: readonly unknown[]): void => {
    getQueryClient().removeQueries({ queryKey })
  },
  
  // 清除所有缓存
  clear: (): void => {
    getQueryClient().clear()
  },
  
  // 获取缓存统计信息
  getCacheStats: () => {
    const cache = getQueryClient().getQueryCache()
    const queries = cache.getAll()
    
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.isActive()).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      fetchingQueries: queries.filter(q => q.isFetching()).length,
      cachedQueries: queries.filter(q => q.state.data !== undefined).length
    }
  }
}

// 开发工具配置
export const devtools = {
  // 开发环境下的调试工具
  enabled: isDevelopment,
  
  // 日志缓存状态
  logCacheStats: (): void => {
    if (isDevelopment) {
      console.log('React Query Cache Stats:', cacheUtils.getCacheStats())
    }
  },
  
  // 日志查询键
  logQueryKeys: (): void => {
    if (isDevelopment) {
      const cache = getQueryClient().getQueryCache()
      const queries = cache.getAll()
      console.log('Active Query Keys:', queries.map(q => q.queryKey))
    }
  }
}

// ==================== 性能监控API ====================

/**
 * 性能监控工具
 * 提供运行时性能指标访问和控制
 */
export const performanceMonitor = {
  // 获取当前性能指标
  getMetrics: getPerformanceMetrics,
  
  // 重置性能统计
  reset: resetPerformanceStats,
  
  // 手动记录缓存命中
  recordHit: recordCacheHit,
  
  // 手动记录缓存未命中
  recordMiss: recordCacheMiss,
  
  // 手动记录错误
  recordError: recordError,
  
  // 检查内存使用
  checkMemory: (client?: QueryClient) => {
    const queryClient = client || getQueryClient()
    return checkMemoryUsage(queryClient)
  },
  
  // 执行手动清理
  cleanup: (client?: QueryClient) => {
    const queryClient = client || getQueryClient()
    performAutomaticCleanup(queryClient)
  },
  
  // 获取NFR-1合规性状态
  getNFRCompliance: () => {
    const metrics = getPerformanceMetrics()
    if (!metrics) return null
    
    const targets = PERFORMANCE_CONFIG.nfrTargets
    return {
      cacheHitResponseTime: {
        target: targets.cacheHitResponseTime,
        actual: metrics.cacheHitResponseTime,
        compliant: metrics.cacheHitResponseTime <= targets.cacheHitResponseTime,
      },
      memoryUsage: {
        target: targets.memoryLimit,
        actual: performanceMonitor.checkMemory(),
        compliant: performanceMonitor.checkMemory() <= targets.memoryLimit,
      },
      cacheHitRate: {
        target: targets.cacheHitRate,
        actual: metrics.cacheHitRate,
        compliant: metrics.cacheHitRate >= targets.cacheHitRate,
      },
      networkReduction: {
        target: targets.networkReduction,
        actual: metrics.networkReduction,
        compliant: metrics.networkReduction >= targets.networkReduction,
      },
    }
  },
  
  // 生成性能报告
  generateReport: () => {
    const metrics = getPerformanceMetrics()
    const compliance = performanceMonitor.getNFRCompliance()
    const client = getQueryClient()
    const cache = client.getQueryCache()
    const queries = cache.getAll()
    
    return {
      timestamp: Date.now(),
      environment: process.env.NODE_ENV,
      metrics,
      compliance,
      cacheStats: {
        totalQueries: queries.length,
        activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
        staleQueries: queries.filter(q => q.isStale()).length,
        errorQueries: queries.filter(q => q.state.status === 'error').length,
      },
      recommendations: generateOptimizationRecommendations(metrics, compliance),
    }
  }
}

/**
 * 生成优化建议
 */
function generateOptimizationRecommendations(metrics: any, compliance: any): string[] {
  if (!metrics || !compliance) return []
  
  const recommendations: string[] = []
  
  if (!compliance.cacheHitResponseTime.compliant) {
    recommendations.push('优化查询函数以降低缓存命中响应时间')
  }
  
  if (!compliance.memoryUsage.compliant) {
    recommendations.push('启用自动缓存清理以减少内存使用')
  }
  
  if (!compliance.cacheHitRate.compliant) {
    recommendations.push('实施预加载策略以提高缓存命中率')
  }
  
  if (!compliance.networkReduction.compliant) {
    recommendations.push('增加缓存策略以减少网络请求')
  }
  
  if (metrics.errorRate > 0.05) {
    recommendations.push('检查网络连接和API稳定性')
  }
  
  return recommendations
}

// 导出配置常量供其他模块使用
export { CACHE_CONFIG, PERFORMANCE_CONFIG }

// 默认导出QueryClient创建函数
export default createQueryClient