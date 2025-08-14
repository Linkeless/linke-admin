'use client'

/**
 * 缓存查询 Hooks
 * 
 * 基于 React Query 实现的缓存数据查询钩子集合
 * 支持缓存指标、监控、健康状态等功能
 * 遵循统一的缓存策略和错误处理机制
 */

import { useQuery, useInfiniteQuery, UseQueryOptions, UseInfiniteQueryOptions } from '@tanstack/react-query'
import { CacheService } from '@/lib/cache-service'
import { queryKeys } from '@/lib/query-keys'
import { createQueryOptions, DataType } from '@/lib/cache-strategies'
import { reactQueryErrorUtils } from '@/lib/error-handler'
import {
  ApiResponse,
  CacheMetrics,
  MetricsHistory,
  CacheStats,
  CachePerformance,
  CacheHealth,
  RealtimeMonitorData,
  CacheAlert,
  CacheKeysResponse,
  CacheKeysQuery,
  TimeRange,
  QueryParams
} from '@/lib/cache-types'

// ==================== 类型定义 ====================

/**
 * 缓存指标查询参数
 */
export interface UseCacheMetricsParams {
  enabled?: boolean
  refetchInterval?: number
}

/**
 * 缓存历史查询参数
 */
export interface UseCacheHistoryParams extends TimeRange {
  enabled?: boolean
}

/**
 * 缓存键查询参数
 */
export interface UseCacheKeysParams extends CacheKeysQuery {
  enabled?: boolean
}

/**
 * 缓存告警查询参数
 */
export interface UseCacheAlertsParams extends QueryParams {
  enabled?: boolean
}

// ==================== 缓存指标查询 Hooks ====================

/**
 * 获取缓存指标数据
 */
export const useCacheMetrics = (params: UseCacheMetricsParams = {}) => {
  const { enabled = true, refetchInterval = 30000 } = params // 默认30秒刷新
  
  return useQuery({
    queryKey: queryKeys.cache.metrics(),
    queryFn: () => CacheService.metrics.getMetrics(),
    ...createQueryOptions(DataType.REALTIME, {
      enabled,
      refetchInterval,
      select: (data: CacheMetrics) => ({
        ...data,
        // 增强数据显示
        formattedMemoryUsage: (data.memory_usage / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
        formattedMaxMemory: (data.max_memory / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
        memoryUsagePercentage: ((data.memory_usage / data.max_memory) * 100).toFixed(1) + '%',
        hitRatePercentage: (data.hit_rate * 100).toFixed(2) + '%',
        formattedResponseTime: data.avg_response_time.toFixed(2) + ' ms',
        formattedOpsPerSecond: data.operations_per_second.toLocaleString(),
        // 状态指示器
        healthStatus: data.hit_rate > 0.8 ? 'healthy' : data.hit_rate > 0.6 ? 'warning' : 'critical',
        memoryStatus: (data.memory_usage / data.max_memory) > 0.9 ? 'critical' : 
                     (data.memory_usage / data.max_memory) > 0.7 ? 'warning' : 'healthy',
        performanceStatus: data.avg_response_time < 10 ? 'excellent' : 
                          data.avg_response_time < 50 ? 'good' : 'poor'
      }),
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'cache',
          operation: 'metrics'
        })
      }
    })
  })
}

/**
 * 获取缓存指标历史数据
 */
export const useCacheMetricsHistory = (params: UseCacheHistoryParams = {}) => {
  const { enabled = true, ...timeRange } = params
  
  return useQuery({
    queryKey: [...queryKeys.cache.metrics(), 'history', timeRange],
    queryFn: () => CacheService.metrics.getMetricsHistory(timeRange),
    ...createQueryOptions(DataType.STATS, {
      enabled,
      select: (data: MetricsHistory) => ({
        ...data,
        // 增强历史数据
        enhancedTimeSeries: data.time_series.map(point => ({
          ...point,
          formattedTimestamp: new Date(point.timestamp).toLocaleString(),
          hitRatePercentage: (point.hit_rate * 100).toFixed(2) + '%',
          formattedMemoryUsage: (point.memory_usage / (1024 * 1024)).toFixed(1) + ' MB',
          formattedResponseTime: point.response_time.toFixed(2) + ' ms'
        })),
        // 统计摘要
        summary: {
          avgHitRate: (data.time_series.reduce((sum, p) => sum + p.hit_rate, 0) / data.time_series.length * 100).toFixed(2) + '%',
          avgResponseTime: (data.time_series.reduce((sum, p) => sum + p.response_time, 0) / data.time_series.length).toFixed(2) + ' ms',
          maxMemoryUsage: Math.max(...data.time_series.map(p => p.memory_usage)),
          minHitRate: Math.min(...data.time_series.map(p => p.hit_rate))
        }
      }),
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'cache',
          operation: 'metrics-history',
          params: timeRange
        })
      }
    })
  })
}

/**
 * 获取缓存统计数据
 */
export const useCacheStats = (params: { enabled?: boolean } = {}) => {
  const { enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.cache.stats(),
    queryFn: () => CacheService.metrics.getStats(),
    ...createQueryOptions(DataType.STATS, {
      enabled,
      select: (data: CacheStats) => ({
        ...data,
        // 增强统计数据
        formattedTotalKeys: data.total_keys.toLocaleString(),
        formattedExpiredKeys: data.expired_keys.toLocaleString(),
        formattedEvictedKeys: data.evicted_keys.toLocaleString(),
        expirationRate: data.total_keys > 0 
          ? ((data.expired_keys / data.total_keys) * 100).toFixed(2) + '%' 
          : '0%',
        evictionRate: data.total_keys > 0 
          ? ((data.evicted_keys / data.total_keys) * 100).toFixed(2) + '%' 
          : '0%',
        // 按数据类型分组
        keyTypeDistribution: data.keys_by_type ? Object.entries(data.keys_by_type).map(([type, count]) => ({
          type,
          count,
          percentage: ((count / data.total_keys) * 100).toFixed(1) + '%'
        })) : [],
        // 存储容量信息
        formattedUsedMemory: (data.used_memory / (1024 * 1024)).toFixed(1) + ' MB',
        formattedPeakMemory: (data.peak_memory / (1024 * 1024)).toFixed(1) + ' MB'
      }),
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'cache',
          operation: 'stats'
        })
      }
    })
  })
}

/**
 * 获取缓存性能数据
 */
export const useCachePerformance = (params: { enabled?: boolean } = {}) => {
  const { enabled = true } = params
  
  return useQuery({
    queryKey: [...queryKeys.cache.metrics(), 'performance'],
    queryFn: () => CacheService.metrics.getPerformance(),
    ...createQueryOptions(DataType.STATS, {
      enabled,
      select: (data: CachePerformance) => ({
        ...data,
        // 增强性能数据
        formattedAvgResponseTime: data.avg_response_time.toFixed(2) + ' ms',
        formattedP95ResponseTime: data.p95_response_time.toFixed(2) + ' ms',
        formattedP99ResponseTime: data.p99_response_time.toFixed(2) + ' ms',
        formattedThroughput: data.throughput.toLocaleString() + ' ops/s',
        
        // 性能等级评估
        performanceGrade: data.avg_response_time < 5 ? 'A' :
                         data.avg_response_time < 15 ? 'B' :
                         data.avg_response_time < 50 ? 'C' : 'D',
        
        // 历史对比
        responseTimeHistory: data.response_time_history?.map(point => ({
          ...point,
          formattedTime: new Date(point.timestamp).toLocaleTimeString(),
          formattedValue: point.value.toFixed(2) + ' ms'
        })),
        
        throughputHistory: data.throughput_history?.map(point => ({
          ...point,
          formattedTime: new Date(point.timestamp).toLocaleTimeString(),
          formattedValue: point.value.toLocaleString() + ' ops/s'
        }))
      }),
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'cache',
          operation: 'performance'
        })
      }
    })
  })
}

/**
 * 获取缓存健康状态
 */
export const useCacheHealth = (params: { enabled?: boolean; refetchInterval?: number } = {}) => {
  const { enabled = true, refetchInterval = 60000 } = params // 默认60秒刷新健康状态
  
  return useQuery({
    queryKey: queryKeys.cache.health(),
    queryFn: () => CacheService.metrics.getHealth(),
    ...createQueryOptions(DataType.REALTIME, {
      enabled,
      refetchInterval,
      select: (data: CacheHealth) => ({
        ...data,
        // 增强健康状态数据
        statusColor: data.status === 'healthy' ? 'green' : 
                    data.status === 'degraded' ? 'yellow' : 'red',
        statusText: data.status === 'healthy' ? '健康' : 
                   data.status === 'degraded' ? '性能下降' : '故障',
        
        // 格式化检查结果
        enhancedChecks: data.checks ? Object.entries(data.checks).map(([check, result]) => ({
          name: check,
          ...result,
          statusColor: result.status === 'pass' ? 'green' : 'red',
          statusText: result.status === 'pass' ? '通过' : '失败',
          formattedDuration: result.duration ? result.duration.toFixed(2) + ' ms' : 'N/A'
        })) : [],
        
        // 整体健康评分
        healthScore: data.checks ? 
          (Object.values(data.checks).filter(c => c.status === 'pass').length / Object.values(data.checks).length * 100).toFixed(0) + '%' 
          : '100%',
          
        // 上次检查时间
        formattedLastCheck: new Date(data.last_check).toLocaleString(),
        
        // 运行时间
        formattedUptime: data.uptime ? this.formatUptime(data.uptime) : 'Unknown'
      }),
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'cache',
          operation: 'health'
        })
      }
    })
  })
}

// ==================== 缓存监控查询 Hooks ====================

/**
 * 获取实时监控数据
 */
export const useCacheRealtimeMonitoring = (params: { enabled?: boolean } = {}) => {
  const { enabled = true } = params
  
  return useQuery({
    queryKey: [...queryKeys.cache.all, 'realtime-monitoring'],
    queryFn: () => CacheService.monitoring.getRealtimeData(),
    ...createQueryOptions(DataType.REALTIME, {
      enabled,
      refetchInterval: 5000, // 5秒刷新实时数据
      select: (data: RealtimeMonitorData) => ({
        ...data,
        // 增强实时数据
        formattedTimestamp: new Date(data.timestamp).toLocaleTimeString(),
        currentHitRatePercentage: (data.current_hit_rate * 100).toFixed(2) + '%',
        formattedCurrentOps: data.current_operations_per_second.toLocaleString() + ' ops/s',
        formattedCurrentMemory: (data.current_memory_usage / (1024 * 1024)).toFixed(1) + ' MB',
        formattedResponseTime: data.current_response_time.toFixed(2) + ' ms',
        
        // 实时指标状态
        hitRateStatus: data.current_hit_rate > 0.8 ? 'excellent' : 
                      data.current_hit_rate > 0.6 ? 'good' : 'poor',
        memoryStatus: (data.current_memory_usage / data.max_memory) > 0.9 ? 'critical' : 'healthy',
        responseTimeStatus: data.current_response_time < 10 ? 'fast' : 
                           data.current_response_time < 50 ? 'normal' : 'slow',
        
        // 连接状态
        formattedConnections: data.active_connections.toLocaleString(),
        connectionStatus: data.active_connections < data.max_connections * 0.8 ? 'healthy' : 'high'
      }),
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'cache',
          operation: 'realtime-monitoring'
        })
      }
    })
  })
}

/**
 * 获取缓存告警列表
 */
export const useCacheAlerts = (params: UseCacheAlertsParams = {}) => {
  const { enabled = true, ...queryParams } = params
  
  return useQuery({
    queryKey: [...queryKeys.cache.all, 'alerts', queryParams],
    queryFn: () => CacheService.monitoring.getAlerts(queryParams),
    ...createQueryOptions(DataType.LIST, {
      enabled,
      select: (data: {
        alerts: CacheAlert[]
        total: number
        page: number
        page_size: number
      }) => ({
        ...data,
        alerts: data.alerts.map(alert => ({
          ...alert,
          // 增强告警数据
          formattedCreatedAt: new Date(alert.created_at).toLocaleString(),
          formattedTriggeredAt: alert.triggered_at ? new Date(alert.triggered_at).toLocaleString() : '未触发',
          formattedResolvedAt: alert.resolved_at ? new Date(alert.resolved_at).toLocaleString() : '未解决',
          
          severityColor: alert.severity === 'critical' ? 'red' :
                        alert.severity === 'warning' ? 'orange' : 'yellow',
          
          statusColor: alert.status === 'active' ? 'red' :
                      alert.status === 'resolved' ? 'green' : 'gray',
          
          statusText: alert.status === 'active' ? '活跃' :
                     alert.status === 'resolved' ? '已解决' :
                     alert.status === 'acknowledged' ? '已确认' : '未知',
          
          // 持续时间计算
          duration: alert.resolved_at && alert.triggered_at ?
            Math.round((new Date(alert.resolved_at).getTime() - new Date(alert.triggered_at).getTime()) / 1000 / 60) + ' 分钟' :
            alert.triggered_at ? 
              Math.round((Date.now() - new Date(alert.triggered_at).getTime()) / 1000 / 60) + ' 分钟' : 
              '0 分钟'
        }))
      }),
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'cache',
          operation: 'alerts',
          params: queryParams
        })
      }
    })
  })
}

// ==================== 缓存管理查询 Hooks ====================

/**
 * 获取缓存键列表
 */
export const useCacheKeys = (params: UseCacheKeysParams = {}) => {
  const { enabled = true, ...queryParams } = params
  
  return useQuery({
    queryKey: queryKeys.cache.keys(), 
    queryFn: () => CacheService.management.getKeys(queryParams),
    ...createQueryOptions(DataType.LIST, {
      enabled,
      select: (data: CacheKeysResponse) => ({
        ...data,
        // 增强缓存键数据
        keys: data.keys.map(key => ({
          ...key,
          formattedSize: this.formatBytes(key.size),
          formattedTTL: key.ttl > 0 ? this.formatDuration(key.ttl) : '永不过期',
          formattedCreatedAt: new Date(key.created_at).toLocaleString(),
          formattedLastAccessed: key.last_accessed ? new Date(key.last_accessed).toLocaleString() : '从未访问',
          
          // 键状态
          status: key.ttl > 0 && key.ttl < 3600 ? 'expiring-soon' : 'normal',
          statusColor: key.ttl > 0 && key.ttl < 3600 ? 'orange' : 'green',
          
          // 访问频率
          accessFrequency: key.access_count && key.created_at ? 
            (key.access_count / Math.max(1, Math.floor((Date.now() - new Date(key.created_at).getTime()) / 1000 / 3600))).toFixed(2) + '/h' :
            '0/h'
        })),
        
        // 统计摘要
        summary: {
          totalKeys: data.total,
          totalSize: data.keys.reduce((sum, key) => sum + key.size, 0),
          formattedTotalSize: this.formatBytes(data.keys.reduce((sum, key) => sum + key.size, 0)),
          expiringSoonCount: data.keys.filter(key => key.ttl > 0 && key.ttl < 3600).length,
          neverExpiringCount: data.keys.filter(key => key.ttl <= 0).length
        }
      }),
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'cache',
          operation: 'keys',
          params: queryParams
        })
      }
    })
  })
}

// ==================== 组合查询 Hooks ====================

/**
 * 获取缓存概览数据
 * 组合多个查询获取完整的缓存概览
 */
export const useCacheOverview = (params: { enabled?: boolean } = {}) => {
  const { enabled = true } = params
  
  return useQuery({
    queryKey: [...queryKeys.cache.all, 'overview'],
    queryFn: () => CacheService.getOverview(),
    ...createQueryOptions(DataType.DASHBOARD, {
      enabled,
      select: (data: {
        metrics: CacheMetrics
        health: CacheHealth
        stats: CacheStats
        performance: CachePerformance
      }) => ({
        ...data,
        // 综合状态评估
        overallStatus: data.health.status === 'healthy' && data.metrics.hit_rate > 0.8 ? 'excellent' :
                      data.health.status === 'healthy' ? 'good' : 'poor',
        
        // 关键指标摘要
        keyMetrics: {
          hitRate: (data.metrics.hit_rate * 100).toFixed(2) + '%',
          memoryUsage: ((data.metrics.memory_usage / data.metrics.max_memory) * 100).toFixed(1) + '%',
          responseTime: data.performance.avg_response_time.toFixed(2) + ' ms',
          throughput: data.performance.throughput.toLocaleString() + ' ops/s'
        },
        
        // 健康检查摘要
        healthSummary: {
          status: data.health.status,
          passedChecks: data.health.checks ? Object.values(data.health.checks).filter(c => c.status === 'pass').length : 0,
          totalChecks: data.health.checks ? Object.values(data.health.checks).length : 0,
          uptime: data.health.uptime ? this.formatUptime(data.health.uptime) : 'Unknown'
        }
      }),
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'cache',
          operation: 'overview'
        })
      }
    })
  })
}

// ==================== 条件查询 Hooks ====================

/**
 * 获取活跃告警
 */
export const useActiveCacheAlerts = () => {
  return useCacheAlerts({
    status: 'active',
    sort_by: 'created_at',
    sort_order: 'desc'
  })
}

/**
 * 获取关键告警
 */
export const useCriticalCacheAlerts = () => {
  return useCacheAlerts({
    severity: 'critical',
    status: 'active'
  })
}

/**
 * 获取即将过期的缓存键
 */
export const useExpiringSoonKeys = () => {
  return useCacheKeys({
    sort_by: 'ttl',
    sort_order: 'asc',
    ttl_max: 3600 // 1小时内过期
  })
}

/**
 * 获取大尺寸缓存键
 */
export const useLargeKeys = (minSize: number = 1024 * 1024) => { // 默认1MB
  return useCacheKeys({
    sort_by: 'size',
    sort_order: 'desc',
    size_min: minSize
  })
}

// ==================== 工具函数 ====================

/**
 * 缓存查询相关的工具函数
 */
export const cacheQueryUtils = {
  /**
   * 格式化字节数
   */
  formatBytes: (bytes: number): string => {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  /**
   * 格式化持续时间
   */
  formatDuration: (seconds: number): string => {
    if (seconds < 60) return `${seconds}秒`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分`
    return `${Math.floor(seconds / 86400)}天${Math.floor((seconds % 86400) / 3600)}小时`
  },

  /**
   * 格式化运行时间
   */
  formatUptime: (seconds: number): string => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) {
      return `${days}天${hours}小时${minutes}分钟`
    } else if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    } else {
      return `${minutes}分钟`
    }
  }
}

// 将工具函数绑定到全局，以便在 select 函数中使用
const formatBytes = cacheQueryUtils.formatBytes
const formatDuration = cacheQueryUtils.formatDuration
const formatUptime = cacheQueryUtils.formatUptime

// 重新定义 this 引用
const self = { formatBytes, formatDuration, formatUptime }

// ==================== 默认导出 ====================

export default {
  // 指标相关
  useCacheMetrics,
  useCacheMetricsHistory,
  useCacheStats,
  useCachePerformance,
  useCacheHealth,
  
  // 监控相关
  useCacheRealtimeMonitoring,
  useCacheAlerts,
  
  // 管理相关
  useCacheKeys,
  
  // 组合查询
  useCacheOverview,
  
  // 条件查询
  useActiveCacheAlerts,
  useCriticalCacheAlerts,
  useExpiringSoonKeys,
  useLargeKeys,
  
  // 工具函数
  cacheQueryUtils
}