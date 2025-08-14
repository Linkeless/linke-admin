/**
 * React Query 性能优化配置
 * 
 * 基于任务36和NFR-1要求，提供生产环境性能优化配置
 * 
 * 特性：
 * - 智能缓存策略配置
 * - 内存使用优化
 * - 网络请求优化
 * - 首屏加载优化
 * - 生产环境性能监控
 */

export const PERFORMANCE_CONFIG = {
  // ==================== NFR-1 性能目标 ====================
  nfrTargets: {
    cacheHitResponseTime: 50, // ms - 缓存命中响应时间 < 50ms
    memoryLimit: 50 * 1024 * 1024, // bytes - 客户端缓存大小不超过 50MB
    cacheHitRate: 0.8, // 80% - 减少重复请求 80%以上
    networkReduction: 0.8, // 80% - 网络请求减少目标
    firstContentfulPaint: 1500, // ms - 首屏内容渲染时间
    largestContentfulPaint: 2500, // ms - 最大内容渲染时间
    cumulativeLayoutShift: 0.1, // 累积布局偏移
    firstInputDelay: 100, // ms - 首次输入延迟
  } as const,

  // ==================== 缓存策略优化 ====================
  cacheOptimization: {
    // 静态数据缓存策略 - 长时间缓存
    staticData: {
      staleTime: 30 * 60 * 1000, // 30分钟
      gcTime: 60 * 60 * 1000, // 1小时
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },

    // 用户数据缓存策略 - 中等缓存时间
    userData: {
      staleTime: 5 * 60 * 1000, // 5分钟
      gcTime: 15 * 60 * 1000, // 15分钟
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },

    // 实时数据缓存策略 - 短时间缓存
    realTimeData: {
      staleTime: 30 * 1000, // 30秒
      gcTime: 2 * 60 * 1000, // 2分钟
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: 'always',
    },

    // 统计数据缓存策略 - 中长时间缓存
    statisticsData: {
      staleTime: 10 * 60 * 1000, // 10分钟
      gcTime: 30 * 60 * 1000, // 30分钟
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
  } as const,

  // ==================== 内存使用优化 ====================
  memoryOptimization: {
    // 自动清理策略
    autoCleanup: {
      enabled: true,
      interval: 5 * 60 * 1000, // 每5分钟检查一次
      memoryThreshold: 40 * 1024 * 1024, // 40MB触发清理
      cleanupPercentage: 0.3, // 清理30%的过期缓存
    },

    // 查询大小限制
    querySizeLimits: {
      maxQuerySize: 1024 * 1024, // 1MB单个查询最大大小
      maxTotalSize: 50 * 1024 * 1024, // 50MB总缓存大小
      warningThreshold: 40 * 1024 * 1024, // 40MB警告阈值
    },

    // 垃圾回收优化
    garbageCollection: {
      staleQueryThreshold: 20, // 过期查询超过20个时触发清理
      errorQueryCleanup: true, // 自动清理错误查询
      unusedQueryTimeout: 10 * 60 * 1000, // 10分钟未使用的查询会被清理
    },
  } as const,

  // ==================== 网络请求优化 ====================
  networkOptimization: {
    // 请求去重策略
    deduplication: {
      enabled: true,
      window: 1000, // 1秒内的重复请求会被去重
    },

    // 批处理配置
    batching: {
      enabled: true,
      batchSize: 10, // 每批最多10个请求
      batchDelay: 50, // 50ms延迟收集批次
    },

    // 预加载策略
    prefetching: {
      // 路由预加载
      routePrefetch: {
        enabled: true,
        trigger: 'hover', // 鼠标悬停时预加载
        delay: 100, // 100ms延迟
      },

      // 依赖预加载
      dependencyPrefetch: {
        enabled: true,
        maxConcurrent: 3, // 最多3个并发预加载
      },

      // 智能预加载
      smartPrefetch: {
        enabled: true,
        userBehaviorTracking: true, // 基于用户行为预测
        timeBasedPrefetch: true, // 基于时间模式预加载
      },
    },

    // 重试策略优化
    retryOptimization: {
      exponentialBackoff: {
        baseDelay: 1000, // 基础延迟1秒
        maxDelay: 30000, // 最大延迟30秒
        multiplier: 2, // 倍数增长
      },
      
      maxRetries: {
        readOperations: 3, // 读操作最多重试3次
        writeOperations: 1, // 写操作最多重试1次
        networkErrors: 2, // 网络错误重试2次
      },
    },
  } as const,

  // ==================== 首屏加载优化 ====================
  initialLoadOptimization: {
    // 关键路径优化
    criticalPath: {
      // 仪表板关键数据
      dashboardCritical: [
        'dashboard.stats',
        'dashboard.charts',
        'user.profile',
      ],

      // 用户管理关键数据
      userManagementCritical: [
        'users.list',
        'users.stats',
      ],

      // 订阅管理关键数据
      subscriptionCritical: [
        'subscriptions.plans',
        'subscriptions.my',
      ],
    },

    // 预加载配置
    preloadConfig: {
      enabled: true,
      maxConcurrentPreloads: 3,
      preloadTimeout: 5000, // 5秒预加载超时
    },

    // 懒加载配置
    lazyLoadConfig: {
      enabled: true,
      threshold: 0.1, // 10%可视区域触发加载
      rootMargin: '50px', // 50px边距
    },
  } as const,

  // ==================== 性能监控配置 ====================
  monitoring: {
    // 生产环境监控
    production: {
      enabled: process.env.NODE_ENV === 'production',
      sampleRate: 0.1, // 10%采样率
      reportInterval: 60000, // 每分钟报告一次
    },

    // 开发环境监控
    development: {
      enabled: process.env.NODE_ENV === 'development',
      sampleRate: 1.0, // 100%采样率
      reportInterval: 10000, // 每10秒报告一次
      verboseLogging: true,
    },

    // 指标收集
    metricsCollection: {
      cacheHitRate: true,
      responseTime: true,
      memoryUsage: true,
      networkRequests: true,
      errorRate: true,
      userTiming: true, // Performance API指标
    },

    // 告警配置
    alerting: {
      enabled: true,
      thresholds: {
        responseTimeWarning: 40, // ms
        responseTimeError: 60, // ms
        memoryUsageWarning: 40 * 1024 * 1024, // 40MB
        memoryUsageError: 45 * 1024 * 1024, // 45MB
        cacheHitRateWarning: 0.7, // 70%
        cacheHitRateError: 0.6, // 60%
        errorRateWarning: 0.03, // 3%
        errorRateError: 0.08, // 8%
      },
    },
  } as const,

  // ==================== 环境特定配置 ====================
  environmentConfig: {
    development: {
      cacheSize: 20 * 1024 * 1024, // 20MB开发环境缓存
      debugMode: true,
      performanceWarnings: true,
      detailedMetrics: true,
    },

    staging: {
      cacheSize: 40 * 1024 * 1024, // 40MB测试环境缓存
      debugMode: false,
      performanceWarnings: true,
      detailedMetrics: true,
    },

    production: {
      cacheSize: 50 * 1024 * 1024, // 50MB生产环境缓存
      debugMode: false,
      performanceWarnings: false,
      detailedMetrics: false,
    },
  } as const,

  // ==================== 功能特性配置 ====================
  features: {
    // 智能缓存失效
    smartInvalidation: {
      enabled: true,
      dependencyTracking: true, // 依赖关系追踪
      cascadeInvalidation: true, // 级联失效
    },

    // 查询优化
    queryOptimization: {
      enabled: true,
      queryMerging: true, // 查询合并
      queryBatching: true, // 查询批处理
      queryDeduplication: true, // 查询去重
    },

    // 背景更新
    backgroundUpdates: {
      enabled: true,
      updateInterval: 30 * 1000, // 30秒背景更新间隔
      maxConcurrentUpdates: 2, // 最多2个并发背景更新
    },

    // 离线支持
    offlineSupport: {
      enabled: true,
      cacheStrategy: 'cache-first', // 缓存优先策略
      offlineTimeout: 5000, // 5秒离线超时
    },
  } as const,

  // ==================== 工具函数配置 ====================
  utilities: {
    // 性能测量
    performanceMeasurement: {
      markingEnabled: true,
      measurementEnabled: true,
      customMarks: [
        'query-start',
        'query-end',
        'cache-hit',
        'cache-miss',
      ],
    },

    // 调试工具
    debugging: {
      queryDevtools: process.env.NODE_ENV === 'development',
      performanceDevtools: process.env.NODE_ENV === 'development',
      logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
    },
  } as const,
} as const;

// ==================== 类型导出 ====================

export type PerformanceConfig = typeof PERFORMANCE_CONFIG;
export type NFRTargets = typeof PERFORMANCE_CONFIG.nfrTargets;
export type CacheOptimization = typeof PERFORMANCE_CONFIG.cacheOptimization;
export type MemoryOptimization = typeof PERFORMANCE_CONFIG.memoryOptimization;
export type NetworkOptimization = typeof PERFORMANCE_CONFIG.networkOptimization;
export type MonitoringConfig = typeof PERFORMANCE_CONFIG.monitoring;

// ==================== 配置获取函数 ====================

/**
 * 获取当前环境的性能配置
 */
export function getCurrentEnvironmentConfig() {
  const env = process.env.NODE_ENV || 'development';
  const envConfig = PERFORMANCE_CONFIG.environmentConfig[env as keyof typeof PERFORMANCE_CONFIG.environmentConfig] 
    || PERFORMANCE_CONFIG.environmentConfig.development;
  
  return {
    ...PERFORMANCE_CONFIG,
    currentEnvironment: env,
    ...envConfig,
  };
}

/**
 * 获取缓存策略配置
 */
export function getCacheStrategyConfig(dataType: 'static' | 'user' | 'realTime' | 'statistics') {
  const strategyMap = {
    static: PERFORMANCE_CONFIG.cacheOptimization.staticData,
    user: PERFORMANCE_CONFIG.cacheOptimization.userData,
    realTime: PERFORMANCE_CONFIG.cacheOptimization.realTimeData,
    statistics: PERFORMANCE_CONFIG.cacheOptimization.statisticsData,
  };
  
  return strategyMap[dataType] || strategyMap.user;
}

/**
 * 检查NFR合规性
 */
export function checkNFRCompliance(metrics: {
  cacheHitResponseTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  networkReduction: number;
}) {
  const targets = PERFORMANCE_CONFIG.nfrTargets;
  
  return {
    cacheHitResponseTime: metrics.cacheHitResponseTime <= targets.cacheHitResponseTime,
    memoryUsage: metrics.memoryUsage <= targets.memoryLimit,
    cacheHitRate: metrics.cacheHitRate >= targets.cacheHitRate,
    networkReduction: metrics.networkReduction >= targets.networkReduction,
    overall: (
      metrics.cacheHitResponseTime <= targets.cacheHitResponseTime &&
      metrics.memoryUsage <= targets.memoryLimit &&
      metrics.cacheHitRate >= targets.cacheHitRate &&
      metrics.networkReduction >= targets.networkReduction
    ),
  };
}

/**
 * 获取性能监控配置
 */
export function getMonitoringConfig() {
  const env = process.env.NODE_ENV || 'development';
  const baseConfig = PERFORMANCE_CONFIG.monitoring;
  
  return env === 'production' 
    ? baseConfig.production 
    : baseConfig.development;
}

// ==================== 默认导出 ====================

export default PERFORMANCE_CONFIG;