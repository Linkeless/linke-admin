'use client'

/**
 * 订阅数据智能预加载系统
 * 
 * 基于 NFR-1 性能要求和任务20需求，实现订阅模块的高性能数据预加载机制
 * 特性：
 * - 路由级智能预加载
 * - 依赖关系自动预加载
 * - 批量预加载优化
 * - 内存管理和取消机制
 * - 性能监控和缓存命中率分析
 * 
 * 性能目标：
 * - 缓存命中响应时间 < 50ms
 * - 预加载数据内存占用 < 10MB
 * - 缓存命中率 > 80%
 * - 网络请求减少 > 80%
 */

import { useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useQueryClient, QueryKey } from '@tanstack/react-query'
import { toast } from 'sonner'
import { subscriptionService } from '@/lib/subscription-service'
import { queryKeys } from '@/lib/query-keys'
import { createQueryOptions, DataType } from '@/lib/cache-strategies'
import { 
  SubscriptionPlan, 
  UserSubscription, 
  PlanFilters, 
  SubscriptionFilters,
  PaginatedResponse 
} from '@/lib/subscription-types'

// ==================== 类型定义 ====================

/**
 * 预加载策略配置
 */
export interface PreloadStrategy {
  /** 是否启用路由预加载 */
  routePreload: boolean
  /** 是否启用依赖关系预加载 */
  dependencyPreload: boolean
  /** 是否启用空闲时间预加载 */
  idlePreload: boolean
  /** 是否启用批量预加载 */
  batchPreload: boolean
  /** 预加载优先级 */
  priority: 'high' | 'medium' | 'low'
  /** 最大并发预加载数量 */
  maxConcurrent: number
  /** 预加载延迟时间（毫秒） */
  delay: number
}

/**
 * 预加载队列项
 */
export interface PreloadQueueItem {
  id: string
  queryKey: QueryKey
  queryFn: () => Promise<any>
  priority: number
  dependencies?: string[]
  abortController?: AbortController
  timestamp: number
}

/**
 * 预加载统计信息
 */
export interface PreloadStats {
  totalPreloads: number
  successfulPreloads: number
  failedPreloads: number
  cacheHits: number
  cacheMisses: number
  averageResponseTime: number
  memoryUsage: number
  networkRequestsSaved: number
  lastUpdated: number
}

/**
 * 路由模式映射
 */
export interface RoutePatterns {
  [pattern: string]: {
    preloadData: string[]
    dependencies?: string[]
    priority: number
  }
}

// ==================== 常量配置 ====================

/**
 * 默认预加载策略
 */
const DEFAULT_STRATEGY: PreloadStrategy = {
  routePreload: true,
  dependencyPreload: true,
  idlePreload: true,
  batchPreload: true,
  priority: 'medium',
  maxConcurrent: 3,
  delay: 100,
}

/**
 * 路由预加载模式配置
 * 基于用户访问模式分析的智能预加载策略
 */
const ROUTE_PRELOAD_PATTERNS: RoutePatterns = {
  // 订阅管理主页 - 预加载计划列表和用户订阅概览
  '/subscriptions': {
    preloadData: ['plans-list', 'active-subscriptions', 'subscription-stats'],
    priority: 10,
  },
  
  // 订阅计划页面 - 预加载所有计划和统计信息
  '/subscriptions/plans': {
    preloadData: ['plans-list', 'visible-plans', 'plan-stats'],
    dependencies: ['active-subscriptions'],
    priority: 9,
  },
  
  // 用户订阅页面 - 预加载用户订阅和相关数据
  '/subscriptions/users': {
    preloadData: ['user-subscriptions', 'expiring-subscriptions', 'subscription-stats'],
    dependencies: ['plans-list'],
    priority: 9,
  },
  
  // 订阅分析页面 - 预加载统计和分析数据
  '/subscriptions/analytics': {
    preloadData: ['subscription-stats', 'plan-stats', 'revenue-metrics'],
    priority: 8,
  },
  
  // 订单管理页面 - 预加载订单和相关订阅数据
  '/subscriptions/orders': {
    preloadData: ['subscription-orders', 'order-stats'],
    dependencies: ['plans-list', 'user-subscriptions'],
    priority: 8,
  },
  
  // 用户管理页面 - 预加载用户相关的订阅信息
  '/users': {
    preloadData: ['user-subscriptions', 'subscription-stats'],
    priority: 7,
  },
  
  // 仪表板 - 预加载关键统计数据
  '/dashboard': {
    preloadData: ['subscription-stats', 'plan-stats', 'active-subscriptions'],
    priority: 10,
  },
}

/**
 * 数据依赖关系映射
 * 定义数据之间的依赖关系，实现智能预加载
 */
const DATA_DEPENDENCIES = {
  'user-subscriptions': ['plans-list'],
  'subscription-orders': ['plans-list', 'user-subscriptions'],
  'expiring-subscriptions': ['user-subscriptions'],
  'plan-stats': ['plans-list'],
  'subscription-stats': ['user-subscriptions', 'plans-list'],
  'revenue-metrics': ['subscription-orders', 'plans-list'],
}

/**
 * 内存限制配置（NFR-1要求）
 */
const MEMORY_LIMITS = {
  maxPreloadItems: 50,
  maxMemoryUsage: 10 * 1024 * 1024, // 10MB
  cleanupThreshold: 0.8, // 80%时触发清理
}

// ==================== 核心预加载Hook ====================

/**
 * 智能订阅数据预加载Hook
 * 
 * 实现基于路由、依赖关系和用户行为的智能预加载策略
 * 
 * @param strategy 预加载策略配置
 * @returns 预加载控制函数和统计信息
 */
export const useSubscriptionPreloader = (strategy: Partial<PreloadStrategy> = {}) => {
  const queryClient = useQueryClient()
  const router = useRouter()
  const pathname = usePathname()
  
  // 合并默认策略
  const config = useMemo(() => ({ ...DEFAULT_STRATEGY, ...strategy }), [strategy])
  
  // 预加载队列和状态管理
  const preloadQueue = useRef<Map<string, PreloadQueueItem>>(new Map())
  const runningPreloads = useRef<Set<string>>(new Set())
  const stats = useRef<PreloadStats>({
    totalPreloads: 0,
    successfulPreloads: 0,
    failedPreloads: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
    memoryUsage: 0,
    networkRequestsSaved: 0,
    lastUpdated: Date.now(),
  })
  
  // 性能监控
  const performanceTimer = useRef<{ [key: string]: number }>({})
  const responseTimes = useRef<number[]>([])
  
  /**
   * 记录性能指标
   */
  const recordPerformance = useCallback((key: string, startTime: number, isHit: boolean) => {
    const responseTime = Date.now() - startTime
    responseTimes.current.push(responseTime)
    
    // 保持最近100次记录
    if (responseTimes.current.length > 100) {
      responseTimes.current = responseTimes.current.slice(-100)
    }
    
    // 更新统计信息
    stats.current.averageResponseTime = 
      responseTimes.current.reduce((sum, time) => sum + time, 0) / responseTimes.current.length
    
    if (isHit) {
      stats.current.cacheHits++
      stats.current.networkRequestsSaved++
    } else {
      stats.current.cacheMisses++
    }
    
    stats.current.lastUpdated = Date.now()
    
    // NFR-1性能监控：记录缓存命中响应时间
    if (isHit && responseTime > 50) {
      console.warn(`Cache hit response time exceeded 50ms: ${responseTime}ms for ${key}`)
    }
  }, [])
  
  /**
   * 检查缓存状态
   */
  const checkCacheStatus = useCallback((queryKey: QueryKey): 'hit' | 'stale' | 'miss' => {
    const query = queryClient.getQueryState(queryKey)
    
    if (!query) return 'miss'
    if (query.isStale) return 'stale'
    return 'hit'
  }, [queryClient])
  
  /**
   * 内存使用监控
   */
  const checkMemoryUsage = useCallback(() => {
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()
    
    // 估算内存使用（简单实现）
    let memoryUsage = 0
    queries.forEach(query => {
      if (query.state.data) {
        // 简单的内存估算（实际可能需要更精确的计算）
        memoryUsage += JSON.stringify(query.state.data).length * 2 // UTF-16编码
      }
    })
    
    stats.current.memoryUsage = memoryUsage
    
    // 内存清理检查
    if (memoryUsage > MEMORY_LIMITS.maxMemoryUsage * MEMORY_LIMITS.cleanupThreshold) {
      console.warn('Memory usage approaching limit, triggering cleanup')
      return true
    }
    
    return false
  }, [queryClient])
  
  /**
   * 清理过期缓存
   */
  const cleanupCache = useCallback(() => {
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()
    
    // 移除最旧的过期查询
    const staleQueries = queries
      .filter(query => query.isStale())
      .sort((a, b) => (a.state.dataUpdatedAt || 0) - (b.state.dataUpdatedAt || 0))
    
    const toRemove = staleQueries.slice(0, Math.ceil(staleQueries.length * 0.3))
    toRemove.forEach(query => {
      cache.remove(query)
    })
    
    console.log(`Cleaned up ${toRemove.length} stale cache entries`)
  }, [queryClient])
  
  /**
   * 创建预加载任务
   */
  const createPreloadTask = useCallback((
    id: string,
    queryKey: QueryKey,
    queryFn: () => Promise<any>,
    priority: number = 5,
    dependencies?: string[]
  ): PreloadQueueItem => {
    const abortController = new AbortController()
    
    return {
      id,
      queryKey,
      queryFn,
      priority,
      dependencies,
      abortController,
      timestamp: Date.now(),
    }
  }, [])
  
  /**
   * 执行单个预加载任务
   */
  const executePreload = useCallback(async (task: PreloadQueueItem) => {
    const startTime = Date.now()
    const cacheStatus = checkCacheStatus(task.queryKey)
    
    // 如果缓存命中且数据新鲜，跳过预加载
    if (cacheStatus === 'hit') {
      recordPerformance(task.id, startTime, true)
      return Promise.resolve()
    }
    
    runningPreloads.current.add(task.id)
    
    try {
      // 检查是否已经有相同的查询在进行
      const existingQuery = queryClient.getQueryState(task.queryKey)
      if (existingQuery?.fetchStatus === 'fetching') {
        // 等待现有查询完成
        await queryClient.ensureQueryData({
          queryKey: task.queryKey,
          queryFn: task.queryFn,
          ...createQueryOptions(DataType.USER),
        })
      } else {
        // 执行预加载
        await queryClient.prefetchQuery({
          queryKey: task.queryKey,
          queryFn: task.queryFn,
          ...createQueryOptions(DataType.USER),
        })
      }
      
      stats.current.successfulPreloads++
      recordPerformance(task.id, startTime, false)
      
    } catch (error) {
      if (task.abortController?.signal.aborted) {
        console.log(`Preload cancelled: ${task.id}`)
      } else {
        console.error(`Preload failed: ${task.id}`, error)
        stats.current.failedPreloads++
      }
    } finally {
      runningPreloads.current.delete(task.id)
      preloadQueue.current.delete(task.id)
    }
  }, [queryClient, checkCacheStatus, recordPerformance])
  
  /**
   * 批量执行预加载任务
   */
  const executeBatchPreload = useCallback(async () => {
    if (!config.batchPreload) return
    
    // 按优先级排序任务
    const tasks = Array.from(preloadQueue.current.values())
      .sort((a, b) => b.priority - a.priority)
    
    // 检查并发限制
    const availableSlots = config.maxConcurrent - runningPreloads.current.size
    if (availableSlots <= 0) return
    
    // 选择要执行的任务
    const tasksToExecute = tasks.slice(0, availableSlots)
    
    // 并发执行预加载
    const promises = tasksToExecute.map(task => executePreload(task))
    await Promise.allSettled(promises)
    
    // 内存检查和清理
    if (checkMemoryUsage()) {
      cleanupCache()
    }
  }, [config.batchPreload, config.maxConcurrent, executePreload, checkMemoryUsage, cleanupCache])
  
  /**
   * 添加预加载任务到队列
   */
  const addPreloadTask = useCallback((
    id: string,
    queryKey: QueryKey,
    queryFn: () => Promise<any>,
    priority: number = 5,
    dependencies?: string[]
  ) => {
    // 检查是否已存在
    if (preloadQueue.current.has(id)) return
    
    // 检查队列大小限制
    if (preloadQueue.current.size >= MEMORY_LIMITS.maxPreloadItems) {
      // 移除最低优先级的任务
      const tasks = Array.from(preloadQueue.current.values())
        .sort((a, b) => a.priority - b.priority)
      const toRemove = tasks[0]
      if (toRemove) {
        toRemove.abortController?.abort()
        preloadQueue.current.delete(toRemove.id)
      }
    }
    
    const task = createPreloadTask(id, queryKey, queryFn, priority, dependencies)
    preloadQueue.current.set(id, task)
    
    stats.current.totalPreloads++
    
    // 延迟执行以避免阻塞
    setTimeout(() => {
      executeBatchPreload()
    }, config.delay)
  }, [createPreloadTask, executeBatchPreload, config.delay])
  
  /**
   * 预加载订阅计划数据
   */
  const preloadSubscriptionPlans = useCallback((filters?: PlanFilters) => {
    const id = `plans-${JSON.stringify(filters || {})}`
    const queryKey = queryKeys.subscriptions.plans.list(filters)
    const queryFn = () => subscriptionService.getPlans(filters)
    
    addPreloadTask(id, queryKey, queryFn, 8)
  }, [addPreloadTask])
  
  /**
   * 预加载用户订阅数据
   */
  const preloadUserSubscriptions = useCallback((filters?: SubscriptionFilters) => {
    const id = `user-subscriptions-${JSON.stringify(filters || {})}`
    const queryKey = queryKeys.subscriptions.users.list(filters)
    const queryFn = () => subscriptionService.getUserSubscriptions(filters)
    
    addPreloadTask(id, queryKey, queryFn, 7, ['plans-list'])
  }, [addPreloadTask])
  
  /**
   * 预加载活跃订阅
   */
  const preloadActiveSubscriptions = useCallback(() => {
    const id = 'active-subscriptions'
    const queryKey = queryKeys.subscriptions.users.list({ status: 'active' })
    const queryFn = () => subscriptionService.getUserSubscriptions({ status: 'active' })
    
    addPreloadTask(id, queryKey, queryFn, 9)
  }, [addPreloadTask])
  
  /**
   * 预加载即将过期的订阅
   */
  const preloadExpiringSubscriptions = useCallback(() => {
    const id = 'expiring-subscriptions'
    const queryKey = ['subscriptions', 'users', 'expiring']
    const queryFn = () => subscriptionService.getUserSubscriptions()
    
    addPreloadTask(id, queryKey, queryFn, 6, ['user-subscriptions'])
  }, [addPreloadTask])
  
  /**
   * 预加载订阅统计数据
   */
  const preloadSubscriptionStats = useCallback(() => {
    const id = 'subscription-stats'
    const queryKey = queryKeys.dashboard.subscriptionStats()
    const queryFn = () => subscriptionService.getSubscriptionStats()
    
    addPreloadTask(id, queryKey, queryFn, 7)
  }, [addPreloadTask])
  
  /**
   * 预加载可见的订阅计划
   */
  const preloadVisiblePlans = useCallback(() => {
    const id = 'visible-plans'
    const queryKey = queryKeys.subscriptions.plans.list({ visible: true })
    const queryFn = () => subscriptionService.getPlans({ visible: true })
    
    addPreloadTask(id, queryKey, queryFn, 8)
  }, [addPreloadTask])
  
  /**
   * 预加载计划统计
   */
  const preloadPlanStats = useCallback(() => {
    const id = 'plan-stats'
    const queryKey = queryKeys.subscriptions.plans.stats()
    const queryFn = () => subscriptionService.getPlanStats()
    
    addPreloadTask(id, queryKey, queryFn, 6, ['plans-list'])
  }, [addPreloadTask])
  
  /**
   * 预定义的预加载函数映射
   */
  const preloadFunctions = useMemo(() => ({
    'plans-list': preloadSubscriptionPlans,
    'user-subscriptions': preloadUserSubscriptions,
    'active-subscriptions': preloadActiveSubscriptions,
    'expiring-subscriptions': preloadExpiringSubscriptions,
    'subscription-stats': preloadSubscriptionStats,
    'visible-plans': preloadVisiblePlans,
    'plan-stats': preloadPlanStats,
    'subscription-orders': () => {}, // 占位符，实际需要订单服务
    'revenue-metrics': () => {}, // 占位符，实际需要财务服务
    'order-stats': () => {}, // 占位符，实际需要订单服务
  }), [
    preloadSubscriptionPlans,
    preloadUserSubscriptions,
    preloadActiveSubscriptions,
    preloadExpiringSubscriptions,
    preloadSubscriptionStats,
    preloadVisiblePlans,
    preloadPlanStats,
  ])
  
  /**
   * 基于路由模式执行预加载
   */
  const executeRoutePreload = useCallback((path: string) => {
    if (!config.routePreload) return
    
    // 查找匹配的路由模式
    const matchedPattern = Object.keys(ROUTE_PRELOAD_PATTERNS).find(pattern => {
      if (pattern === path) return true
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'))
        return regex.test(path)
      }
      return path.startsWith(pattern)
    })
    
    if (!matchedPattern) return
    
    const patternConfig = ROUTE_PRELOAD_PATTERNS[matchedPattern]
    
    // 预加载依赖数据
    if (config.dependencyPreload && patternConfig.dependencies) {
      patternConfig.dependencies.forEach(dep => {
        const preloadFn = preloadFunctions[dep]
        if (preloadFn) {
          setTimeout(() => preloadFn(), 0)
        }
      })
    }
    
    // 预加载主要数据
    patternConfig.preloadData.forEach(dataType => {
      const preloadFn = preloadFunctions[dataType]
      if (preloadFn) {
        setTimeout(() => preloadFn(), config.delay)
      }
    })
    
    console.log(`Route preload executed for: ${path}`, patternConfig)
  }, [config, preloadFunctions])
  
  /**
   * 空闲时间预加载
   */
  const executeIdlePreload = useCallback(() => {
    if (!config.idlePreload) return
    
    // 在空闲时预加载常用数据
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        preloadActiveSubscriptions()
        preloadSubscriptionStats()
        preloadVisiblePlans()
      })
    } else {
      // 降级到setTimeout
      setTimeout(() => {
        preloadActiveSubscriptions()
        preloadSubscriptionStats()
        preloadVisiblePlans()
      }, 2000)
    }
  }, [config.idlePreload, preloadActiveSubscriptions, preloadSubscriptionStats, preloadVisiblePlans])
  
  /**
   * 取消所有预加载任务
   */
  const cancelAllPreloads = useCallback(() => {
    preloadQueue.current.forEach(task => {
      task.abortController?.abort()
    })
    preloadQueue.current.clear()
    runningPreloads.current.clear()
  }, [])
  
  /**
   * 手动预加载指定数据
   */
  const preloadData = useCallback((dataTypes: string[], priority: number = 5) => {
    dataTypes.forEach(dataType => {
      const preloadFn = preloadFunctions[dataType]
      if (preloadFn) {
        preloadFn()
      }
    })
  }, [preloadFunctions])
  
  /**
   * 获取当前统计信息
   */
  const getStats = useCallback((): PreloadStats => {
    return { ...stats.current }
  }, [])
  
  /**
   * 检查缓存命中率是否达标
   */
  const checkPerformanceCompliance = useCallback((): {
    cacheHitRate: number
    averageResponseTime: number
    memoryUsage: number
    isCompliant: boolean
    issues: string[]
  } => {
    const { cacheHits, cacheMisses, averageResponseTime, memoryUsage } = stats.current
    const cacheHitRate = cacheHits + cacheMisses > 0 ? cacheHits / (cacheHits + cacheMisses) : 0
    
    const issues: string[] = []
    
    // NFR-1合规性检查
    if (averageResponseTime > 50) {
      issues.push('Average response time exceeds 50ms')
    }
    
    if (memoryUsage > MEMORY_LIMITS.maxMemoryUsage) {
      issues.push('Memory usage exceeds 10MB limit')
    }
    
    if (cacheHitRate < 0.8) {
      issues.push('Cache hit rate below 80%')
    }
    
    return {
      cacheHitRate,
      averageResponseTime,
      memoryUsage,
      isCompliant: issues.length === 0,
      issues,
    }
  }, [])
  
  // 路由变化监听
  useEffect(() => {
    executeRoutePreload(pathname)
  }, [pathname, executeRoutePreload])
  
  // 空闲时间预加载
  useEffect(() => {
    const timer = setTimeout(() => {
      executeIdlePreload()
    }, 5000) // 5秒后开始空闲预加载
    
    return () => clearTimeout(timer)
  }, [executeIdlePreload])
  
  // 组件卸载时清理
  useEffect(() => {
    return () => {
      cancelAllPreloads()
    }
  }, [cancelAllPreloads])
  
  // 性能监控报告
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        const compliance = checkPerformanceCompliance()
        if (!compliance.isCompliant) {
          console.warn('Preloader performance issues:', compliance.issues)
        } else {
          console.log('Preloader performance compliant:', {
            cacheHitRate: compliance.cacheHitRate.toFixed(2),
            avgResponseTime: compliance.averageResponseTime.toFixed(2),
            memoryUsage: (compliance.memoryUsage / 1024 / 1024).toFixed(2) + 'MB',
          })
        }
      }, 30000) // 每30秒检查一次
      
      return () => clearInterval(interval)
    }
  }, [checkPerformanceCompliance])
  
  return {
    // 手动预加载控制
    preloadData,
    preloadSubscriptionPlans,
    preloadUserSubscriptions,
    preloadActiveSubscriptions,
    preloadExpiringSubscriptions,
    preloadSubscriptionStats,
    preloadVisiblePlans,
    preloadPlanStats,
    
    // 预加载管理
    cancelAllPreloads,
    executeRoutePreload,
    executeIdlePreload,
    
    // 统计和监控
    getStats,
    checkPerformanceCompliance,
    
    // 配置信息
    config,
    isPreloading: runningPreloads.current.size > 0,
    queueSize: preloadQueue.current.size,
  }
}

// ==================== 高级预加载Hooks ====================

/**
 * 路由感知预加载Hook
 * 自动根据当前路由预加载相关数据
 */
export const useRouteAwarePreloader = () => {
  const preloader = useSubscriptionPreloader({
    routePreload: true,
    dependencyPreload: true,
    priority: 'high',
  })
  
  return preloader
}

/**
 * 智能依赖预加载Hook
 * 基于数据依赖关系自动预加载相关数据
 */
export const useDependencyPreloader = (primaryData: string[]) => {
  const preloader = useSubscriptionPreloader({
    dependencyPreload: true,
    batchPreload: true,
  })
  
  useEffect(() => {
    // 获取所有依赖数据
    const allDependencies = new Set<string>()
    
    const collectDependencies = (dataTypes: string[]) => {
      dataTypes.forEach(dataType => {
        allDependencies.add(dataType)
        const deps = DATA_DEPENDENCIES[dataType] || []
        if (deps.length > 0) {
          collectDependencies(deps)
        }
      })
    }
    
    collectDependencies(primaryData)
    
    // 执行预加载
    preloader.preloadData(Array.from(allDependencies))
  }, [primaryData, preloader])
  
  return preloader
}

/**
 * 性能优先预加载Hook
 * 专注于性能优化的预加载配置
 */
export const usePerformancePreloader = () => {
  const preloader = useSubscriptionPreloader({
    routePreload: true,
    dependencyPreload: true,
    idlePreload: true,
    batchPreload: true,
    priority: 'high',
    maxConcurrent: 5,
    delay: 50,
  })
  
  // 性能警告
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const compliance = preloader.checkPerformanceCompliance()
      if (!compliance.isCompliant) {
        toast.warning('预加载性能警告', {
          description: compliance.issues.join(', '),
        })
      }
    }, 60000) // 每分钟检查一次
    
    return () => clearInterval(checkInterval)
  }, [preloader])
  
  return preloader
}

// ==================== 导出 ====================

export default {
  useSubscriptionPreloader,
  useRouteAwarePreloader,
  useDependencyPreloader,
  usePerformancePreloader,
}

/**
 * 预加载工具函数
 */
export const preloaderUtils = {
  /**
   * 检查是否支持空闲回调
   */
  supportsIdleCallback: () => 'requestIdleCallback' in window,
  
  /**
   * 估算数据大小
   */
  estimateDataSize: (data: any): number => {
    return JSON.stringify(data).length * 2 // UTF-16估算
  },
  
  /**
   * 生成预加载ID
   */
  generatePreloadId: (prefix: string, params?: any): string => {
    return `${prefix}-${JSON.stringify(params || {})}`
  },
  
  /**
   * 检查路由匹配
   */
  matchRoute: (pattern: string, path: string): boolean => {
    if (pattern === path) return true
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace('*', '.*'))
      return regex.test(path)
    }
    return path.startsWith(pattern)
  },
}