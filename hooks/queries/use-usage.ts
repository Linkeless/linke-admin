'use client'

/**
 * 使用量查询 Hooks
 * 
 * 基于 React Query 实现的使用量数据查询钩子集合
 * 支持使用量数据、统计、预测、告警等功能
 * 遵循统一的缓存策略和错误处理机制
 */

import { useQuery, useInfiniteQuery, UseQueryOptions, UseInfiniteQueryOptions } from '@tanstack/react-query'
import { UsageService } from '@/lib/usage-service'
import { queryKeys } from '@/lib/query-keys'
import { createQueryOptions, DataType } from '@/lib/cache-strategies'
import { reactQueryErrorUtils } from '@/lib/error-handler'
import {
  ApiResponse,
  PaginatedResponse,
  UsageData,
  UsageHistory,
  UsageSummary,
  UsageStatistics,
  UsageTrend,
  UsagePrediction,
  RealtimeUsage,
  TopUsageItem,
  Alert,
  AlertConfig,
  AlertHistory,
  AlertStatistics,
  UsageType,
  PaginationParams,
  FilterParams
} from '@/lib/usage-types'

// ==================== 类型定义 ====================

/**
 * 使用量查询参数
 */
export interface UseUsageParams extends PaginationParams, FilterParams {
  subscriptionId: string
  enabled?: boolean
}

/**
 * 使用量历史查询参数
 */
export interface UseUsageHistoryParams extends PaginationParams, FilterParams {
  subscriptionId: string
  usageType?: UsageType
  enabled?: boolean
}

/**
 * 使用量统计查询参数
 */
export interface UseUsageStatsParams extends FilterParams {
  subscriptionId: string
  enabled?: boolean
}

/**
 * 告警查询参数
 */
export interface UseAlertsParams extends PaginationParams, FilterParams {
  subscriptionId?: string
  enabled?: boolean
}

/**
 * 告警配置查询参数
 */
export interface UseAlertConfigsParams extends PaginationParams, FilterParams {
  enabled?: boolean
}

// ==================== 使用量数据查询 Hooks ====================

/**
 * 获取当前使用量数据
 */
export const useCurrentUsage = (params: { subscriptionId: string; enabled?: boolean }) => {
  const { subscriptionId, enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.usage.detail(subscriptionId),
    queryFn: () => UsageService.getCurrentUsage(subscriptionId),
    ...createQueryOptions(DataType.REALTIME, {
      enabled: enabled && !!subscriptionId,
      select: (data: ApiResponse<UsageData[]>) => {
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: data.data.map(usage => ({
              ...usage,
              // 添加计算属性
              percentage: UsageService.calculateUsagePercentage(usage.current_usage, usage.usage_limit),
              statusColor: UsageService.getUsageStatusColor(
                UsageService.calculateUsagePercentage(usage.current_usage, usage.usage_limit)
              ),
              formattedUsage: UsageService.formatUsage(usage.current_usage, usage.usage_type),
              formattedLimit: UsageService.formatUsage(usage.usage_limit, usage.usage_type),
              typeDisplayName: UsageService.getUsageTypeDisplayName(usage.usage_type),
              depletionTime: UsageService.predictDepletionTime(
                usage.current_usage,
                usage.usage_limit,
                usage.usage_rate || 0
              )
            }))
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'usage',
          operation: 'current',
          params: { subscriptionId }
        })
      }
    })
  })
}

/**
 * 获取特定类型的当前使用量
 */
export const useCurrentUsageByType = (params: { 
  subscriptionId: string
  usageType: UsageType
  enabled?: boolean 
}) => {
  const { subscriptionId, usageType, enabled = true } = params
  
  return useQuery({
    queryKey: [...queryKeys.usage.detail(subscriptionId), usageType],
    queryFn: () => UsageService.getCurrentUsageByType(subscriptionId, usageType),
    ...createQueryOptions(DataType.REALTIME, {
      enabled: enabled && !!subscriptionId && !!usageType,
      select: (data: ApiResponse<UsageData>) => {
        if (data.code === 0 && data.data) {
          const usage = data.data
          return {
            ...data,
            data: {
              ...usage,
              percentage: UsageService.calculateUsagePercentage(usage.current_usage, usage.usage_limit),
              statusColor: UsageService.getUsageStatusColor(
                UsageService.calculateUsagePercentage(usage.current_usage, usage.usage_limit)
              ),
              formattedUsage: UsageService.formatUsage(usage.current_usage, usage.usage_type),
              formattedLimit: UsageService.formatUsage(usage.usage_limit, usage.usage_type),
              typeDisplayName: UsageService.getUsageTypeDisplayName(usage.usage_type),
              depletionTime: UsageService.predictDepletionTime(
                usage.current_usage,
                usage.usage_limit,
                usage.usage_rate || 0
              )
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'usage',
          operation: 'current-by-type',
          params: { subscriptionId, usageType }
        })
      }
    })
  })
}

/**
 * 获取使用量历史记录
 */
export const useUsageHistory = (params: UseUsageHistoryParams) => {
  const { subscriptionId, enabled = true, ...filterParams } = params
  
  return useQuery({
    queryKey: queryKeys.usage.list({ subscriptionId, ...filterParams }),
    queryFn: () => UsageService.getUsageHistory(subscriptionId, filterParams),
    ...createQueryOptions(DataType.LIST, {
      enabled: enabled && !!subscriptionId,
      select: (data: PaginatedResponse<UsageHistory>) => {
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: data.data.map(history => ({
              ...history,
              formattedUsage: UsageService.formatUsage(history.usage_amount, history.usage_type),
              typeDisplayName: UsageService.getUsageTypeDisplayName(history.usage_type),
              // 格式化时间显示
              formattedTimestamp: new Date(history.timestamp).toLocaleString()
            }))
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'usage',
          operation: 'history',
          params: { subscriptionId, ...filterParams }
        })
      }
    })
  })
}

/**
 * 获取使用量摘要
 */
export const useUsageSummary = (params: { subscriptionId: string; enabled?: boolean }) => {
  const { subscriptionId, enabled = true } = params
  
  return useQuery({
    queryKey: [...queryKeys.usage.stats(), 'summary', subscriptionId],
    queryFn: () => UsageService.getUsageSummary(subscriptionId),
    ...createQueryOptions(DataType.STATS, {
      enabled: enabled && !!subscriptionId,
      select: (data: ApiResponse<UsageSummary>) => {
        if (data.code === 0 && data.data) {
          const summary = data.data
          return {
            ...data,
            data: {
              ...summary,
              // 格式化各种使用量显示
              formattedTotalUsage: summary.usage_by_type.map(usage => ({
                ...usage,
                formattedAmount: UsageService.formatUsage(usage.total_usage, usage.usage_type),
                typeDisplayName: UsageService.getUsageTypeDisplayName(usage.usage_type),
                percentage: summary.usage_limits[usage.usage_type] 
                  ? UsageService.calculateUsagePercentage(usage.total_usage, summary.usage_limits[usage.usage_type])
                  : 0
              })),
              // 计算整体使用情况
              overallPercentage: Object.keys(summary.usage_limits).length > 0 
                ? Object.entries(summary.usage_limits).reduce((acc, [type, limit]) => {
                    const typeUsage = summary.usage_by_type.find(u => u.usage_type === type)?.total_usage || 0
                    return acc + UsageService.calculateUsagePercentage(typeUsage, limit)
                  }, 0) / Object.keys(summary.usage_limits).length
                : 0
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'usage',
          operation: 'summary',
          params: { subscriptionId }
        })
      }
    })
  })
}

/**
 * 获取使用量统计数据
 */
export const useUsageStatistics = (params: UseUsageStatsParams) => {
  const { subscriptionId, enabled = true, ...filterParams } = params
  
  return useQuery({
    queryKey: queryKeys.usage.stats({ subscriptionId, ...filterParams }),
    queryFn: () => UsageService.getUsageStatistics(subscriptionId, filterParams),
    ...createQueryOptions(DataType.STATS, {
      enabled: enabled && !!subscriptionId,
      select: (data: ApiResponse<UsageStatistics>) => {
        if (data.code === 0 && data.data) {
          const stats = data.data
          return {
            ...data,
            data: {
              ...stats,
              // 增强统计数据显示
              enhancedDailyStats: stats.daily_stats.map(day => ({
                ...day,
                formattedDate: new Date(day.date).toLocaleDateString(),
                totalFormattedUsage: UsageService.formatBytes(day.total_usage)
              })),
              enhancedHourlyStats: stats.hourly_stats.map(hour => ({
                ...hour,
                formattedHour: `${hour.hour}:00`,
                avgFormattedUsage: UsageService.formatBytes(hour.avg_usage)
              }))
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'usage',
          operation: 'statistics',
          params: { subscriptionId, ...filterParams }
        })
      }
    })
  })
}

/**
 * 获取使用量趋势数据
 */
export const useUsageTrends = (params: UseUsageStatsParams) => {
  const { subscriptionId, enabled = true, ...filterParams } = params
  
  return useQuery({
    queryKey: [...queryKeys.usage.stats(), 'trends', subscriptionId, filterParams],
    queryFn: () => UsageService.getUsageTrends(subscriptionId, filterParams),
    ...createQueryOptions(DataType.STATS, {
      enabled: enabled && !!subscriptionId,
      select: (data: ApiResponse<UsageTrend[]>) => {
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: data.data.map(trend => ({
              ...trend,
              formattedValue: UsageService.formatUsage(trend.value, trend.usage_type),
              typeDisplayName: UsageService.getUsageTypeDisplayName(trend.usage_type),
              formattedTimestamp: new Date(trend.timestamp).toLocaleString(),
              trendDirection: trend.growth_rate > 0 ? 'up' : trend.growth_rate < 0 ? 'down' : 'stable',
              formattedGrowthRate: `${(trend.growth_rate * 100).toFixed(2)}%`
            }))
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'usage',
          operation: 'trends',
          params: { subscriptionId, ...filterParams }
        })
      }
    })
  })
}

/**
 * 获取使用量预测数据
 */
export const useUsagePredictions = (params: { subscriptionId: string; enabled?: boolean }) => {
  const { subscriptionId, enabled = true } = params
  
  return useQuery({
    queryKey: [...queryKeys.usage.stats(), 'predictions', subscriptionId],
    queryFn: () => UsageService.getUsagePredictions(subscriptionId),
    ...createQueryOptions(DataType.PREDICTION, {
      enabled: enabled && !!subscriptionId,
      select: (data: ApiResponse<UsagePrediction[]>) => {
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: data.data.map(prediction => ({
              ...prediction,
              formattedPredictedUsage: UsageService.formatUsage(prediction.predicted_usage, prediction.usage_type),
              typeDisplayName: UsageService.getUsageTypeDisplayName(prediction.usage_type),
              formattedPredictionDate: new Date(prediction.prediction_date).toLocaleDateString(),
              confidenceLevel: `${(prediction.confidence * 100).toFixed(1)}%`,
              accuracyLevel: prediction.accuracy ? `${(prediction.accuracy * 100).toFixed(1)}%` : '待确认'
            }))
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'usage',
          operation: 'predictions',
          params: { subscriptionId }
        })
      }
    })
  })
}

/**
 * 获取实时使用量数据
 */
export const useRealtimeUsage = (params: { subscriptionId: string; enabled?: boolean }) => {
  const { subscriptionId, enabled = true } = params
  
  return useQuery({
    queryKey: [...queryKeys.usage.all, 'realtime', subscriptionId],
    queryFn: () => UsageService.getRealtimeUsage(subscriptionId),
    ...createQueryOptions(DataType.REALTIME, {
      enabled: enabled && !!subscriptionId,
      refetchInterval: 5000, // 5秒刷新实时数据
      select: (data: ApiResponse<RealtimeUsage[]>) => {
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: data.data.map(usage => ({
              ...usage,
              formattedRate: UsageService.formatUsage(usage.usage_rate, usage.usage_type) + '/s',
              typeDisplayName: UsageService.getUsageTypeDisplayName(usage.usage_type),
              formattedTimestamp: new Date(usage.timestamp).toLocaleTimeString(),
              statusIndicator: usage.usage_rate > usage.avg_rate * 1.5 ? 'high' : 
                              usage.usage_rate < usage.avg_rate * 0.5 ? 'low' : 'normal'
            }))
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'usage',
          operation: 'realtime',
          params: { subscriptionId }
        })
      }
    })
  })
}

/**
 * 获取使用量排行榜
 */
export const useTopUsage = (params: UseAlertsParams = {}) => {
  const { enabled = true, ...filterParams } = params
  
  return useQuery({
    queryKey: [...queryKeys.usage.all, 'top', filterParams],
    queryFn: () => UsageService.getTopUsage(filterParams),
    ...createQueryOptions(DataType.LIST, {
      enabled,
      select: (data: PaginatedResponse<TopUsageItem>) => {
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: data.data.map((item, index) => ({
              ...item,
              rank: index + 1,
              formattedUsage: UsageService.formatUsage(item.total_usage, item.usage_type),
              typeDisplayName: UsageService.getUsageTypeDisplayName(item.usage_type),
              // 计算使用量占比
              usagePercentage: item.usage_limit > 0 
                ? UsageService.calculateUsagePercentage(item.total_usage, item.usage_limit)
                : 0
            }))
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'usage',
          operation: 'top',
          params: filterParams
        })
      }
    })
  })
}

// ==================== 告警相关查询 Hooks ====================

/**
 * 获取告警列表
 */
export const useAlerts = (params: UseAlertsParams = {}) => {
  const { subscriptionId, enabled = true, ...filterParams } = params
  
  return useQuery({
    queryKey: subscriptionId 
      ? [...queryKeys.usage.all, 'alerts', subscriptionId, filterParams]
      : [...queryKeys.usage.all, 'alerts', filterParams],
    queryFn: () => subscriptionId 
      ? UsageService.getAlerts(subscriptionId, filterParams)
      : UsageService.getAlerts('', filterParams),
    ...createQueryOptions(DataType.LIST, {
      enabled,
      select: (data: PaginatedResponse<Alert>) => {
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: data.data.map(alert => ({
              ...alert,
              severityColor: UsageService.getAlertSeverityColor(alert.severity),
              statusColor: UsageService.getAlertStatusColor(alert.status),
              formattedCreatedAt: new Date(alert.created_at).toLocaleString(),
              formattedTriggeredAt: alert.triggered_at 
                ? new Date(alert.triggered_at).toLocaleString() 
                : '未触发',
              formattedThreshold: `${alert.threshold_percentage}%`,
              typeDisplayName: UsageService.getUsageTypeDisplayName(alert.usage_type)
            }))
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'usage',
          operation: 'alerts',
          params: { subscriptionId, ...filterParams }
        })
      }
    })
  })
}

/**
 * 获取告警配置列表
 */
export const useAlertConfigs = (params: UseAlertConfigsParams = {}) => {
  const { enabled = true, ...filterParams } = params
  
  return useQuery({
    queryKey: [...queryKeys.usage.all, 'alert-configs', filterParams],
    queryFn: () => UsageService.getAlertConfigs(filterParams),
    ...createQueryOptions(DataType.LIST, {
      enabled,
      select: (data: PaginatedResponse<AlertConfig>) => {
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: data.data.map(config => ({
              ...config,
              severityColor: UsageService.getAlertSeverityColor(config.severity),
              formattedThreshold: `${config.threshold_percentage}%`,
              typeDisplayName: UsageService.getUsageTypeDisplayName(config.usage_type),
              formattedCreatedAt: new Date(config.created_at).toLocaleString(),
              isActive: config.enabled,
              channelCount: config.notification_channels?.length || 0
            }))
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'usage',
          operation: 'alert-configs',
          params: filterParams
        })
      }
    })
  })
}

/**
 * 获取特定告警配置详情
 */
export const useAlertConfig = (params: { configId: string; enabled?: boolean }) => {
  const { configId, enabled = true } = params
  
  return useQuery({
    queryKey: [...queryKeys.usage.all, 'alert-config', configId],
    queryFn: () => UsageService.getAlertConfig(configId),
    ...createQueryOptions(DataType.DETAIL, {
      enabled: enabled && !!configId,
      select: (data: ApiResponse<AlertConfig>) => {
        if (data.code === 0 && data.data) {
          const config = data.data
          return {
            ...data,
            data: {
              ...config,
              severityColor: UsageService.getAlertSeverityColor(config.severity),
              formattedThreshold: `${config.threshold_percentage}%`,
              typeDisplayName: UsageService.getUsageTypeDisplayName(config.usage_type),
              formattedCreatedAt: new Date(config.created_at).toLocaleString(),
              isActive: config.enabled,
              channelCount: config.notification_channels?.length || 0,
              // 验证配置完整性
              validationErrors: UsageService.validateAlertConfig(config)
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'usage',
          operation: 'alert-config-detail',
          params: { configId }
        })
      }
    })
  })
}

/**
 * 获取告警历史
 */
export const useAlertHistory = (params: UseAlertsParams) => {
  const { subscriptionId, enabled = true, ...filterParams } = params
  
  return useQuery({
    queryKey: [...queryKeys.usage.all, 'alert-history', subscriptionId, filterParams],
    queryFn: () => UsageService.getAlertHistory(subscriptionId!, filterParams),
    ...createQueryOptions(DataType.LIST, {
      enabled: enabled && !!subscriptionId,
      select: (data: PaginatedResponse<AlertHistory>) => {
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: data.data.map(history => ({
              ...history,
              severityColor: UsageService.getAlertSeverityColor(history.severity),
              statusColor: UsageService.getAlertStatusColor(history.status),
              formattedTriggeredAt: new Date(history.triggered_at).toLocaleString(),
              formattedResolvedAt: history.resolved_at 
                ? new Date(history.resolved_at).toLocaleString() 
                : '未解决',
              typeDisplayName: UsageService.getUsageTypeDisplayName(history.usage_type),
              duration: history.resolved_at 
                ? Math.round((new Date(history.resolved_at).getTime() - new Date(history.triggered_at).getTime()) / 1000 / 60) + ' 分钟'
                : '进行中'
            }))
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'usage',
          operation: 'alert-history',
          params: { subscriptionId, ...filterParams }
        })
      }
    })
  })
}

/**
 * 获取告警统计数据
 */
export const useAlertStatistics = (params: UseUsageStatsParams) => {
  const { subscriptionId, enabled = true, ...filterParams } = params
  
  return useQuery({
    queryKey: [...queryKeys.usage.all, 'alert-statistics', subscriptionId, filterParams],
    queryFn: () => UsageService.getAlertStatistics(subscriptionId, filterParams),
    ...createQueryOptions(DataType.STATS, {
      enabled: enabled && !!subscriptionId,
      select: (data: ApiResponse<AlertStatistics>) => {
        if (data.code === 0 && data.data) {
          const stats = data.data
          return {
            ...data,
            data: {
              ...stats,
              // 增强统计显示
              formattedAvgResolutionTime: UsageService.formatDuration(stats.avg_resolution_time),
              resolutionRate: stats.total_alerts > 0 
                ? ((stats.resolved_alerts / stats.total_alerts) * 100).toFixed(1) + '%'
                : '0%',
              criticalRate: stats.total_alerts > 0
                ? ((stats.alerts_by_severity.critical || 0) / stats.total_alerts * 100).toFixed(1) + '%'
                : '0%',
              // 按严重程度统计的百分比
              severityPercentages: Object.entries(stats.alerts_by_severity).map(([severity, count]) => ({
                severity,
                count,
                percentage: stats.total_alerts > 0 
                  ? ((count / stats.total_alerts) * 100).toFixed(1) + '%'
                  : '0%',
                color: UsageService.getAlertSeverityColor(severity)
              }))
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'usage',
          operation: 'alert-statistics',
          params: { subscriptionId, ...filterParams }
        })
      }
    })
  })
}

// ==================== 无限查询 Hooks ====================

/**
 * 无限加载使用量历史
 */
export const useInfiniteUsageHistory = (params: Omit<UseUsageHistoryParams, 'page'> & { limit?: number }) => {
  const { subscriptionId, enabled = true, limit = 20, ...queryParams } = params
  
  return useInfiniteQuery({
    queryKey: queryKeys.usage.list({ subscriptionId, ...queryParams, limit }),
    queryFn: ({ pageParam = 1 }) => 
      UsageService.getUsageHistory(subscriptionId, { ...queryParams, page: pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedResponse<UsageHistory>) => {
      if (lastPage.code === 0 && lastPage.data) {
        const currentPage = lastPage.pagination?.page || 1
        const totalPages = lastPage.pagination?.total_pages || 
          Math.ceil((lastPage.pagination?.total || 0) / (lastPage.pagination?.limit || limit))
        
        return currentPage < totalPages ? currentPage + 1 : undefined
      }
      return undefined
    },
    ...createQueryOptions(DataType.LIST, {
      enabled: enabled && !!subscriptionId,
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'usage',
          operation: 'infinite-history',
          params: { subscriptionId, ...queryParams }
        })
      }
    }) as Partial<UseInfiniteQueryOptions<PaginatedResponse<UsageHistory>, Error>>
  })
}

// ==================== 条件查询 Hooks ====================

/**
 * 获取高使用量订阅列表
 */
export const useHighUsageSubscriptions = (threshold: number = 80) => {
  return useTopUsage({
    limit: 50,
    // 可以在这里添加更多筛选条件
  })
}

/**
 * 获取活跃告警列表
 */
export const useActiveAlerts = (subscriptionId?: string) => {
  return useAlerts({
    subscriptionId,
    status: 'active',
    sort_by: 'triggered_at',
    sort_order: 'desc'
  })
}

/**
 * 获取临界告警列表
 */
export const useCriticalAlerts = (subscriptionId?: string) => {
  return useAlerts({
    subscriptionId,
    severity: 'critical',
    status: 'active'
  })
}

// ==================== 工具函数 ====================

/**
 * 使用量查询相关的工具函数
 */
export const usageQueryUtils = {
  /**
   * 格式化使用量显示
   */
  formatUsage: (usage: number, type: UsageType): string => {
    return UsageService.formatUsage(usage, type)
  },

  /**
   * 计算使用量百分比
   */
  calculatePercentage: (current: number, limit: number): number => {
    return UsageService.calculateUsagePercentage(current, limit)
  },

  /**
   * 获取使用量状态颜色
   */
  getStatusColor: (percentage: number): string => {
    return UsageService.getUsageStatusColor(percentage)
  },

  /**
   * 获取类型显示名称
   */
  getTypeDisplayName: (type: UsageType): string => {
    return UsageService.getUsageTypeDisplayName(type)
  },

  /**
   * 预测耗尽时间
   */
  predictDepletionTime: (current: number, limit: number, rate: number): string | null => {
    return UsageService.predictDepletionTime(current, limit, rate)
  }
}

// ==================== 默认导出 ====================

export default {
  // 使用量数据
  useCurrentUsage,
  useCurrentUsageByType,
  useUsageHistory,
  useUsageSummary,
  useUsageStatistics,
  useUsageTrends,
  useUsagePredictions,
  useRealtimeUsage,
  useTopUsage,
  
  // 告警相关
  useAlerts,
  useAlertConfigs,
  useAlertConfig,
  useAlertHistory,
  useAlertStatistics,
  
  // 无限查询
  useInfiniteUsageHistory,
  
  // 条件查询
  useHighUsageSubscriptions,
  useActiveAlerts,
  useCriticalAlerts,
  
  // 工具函数
  usageQueryUtils
}