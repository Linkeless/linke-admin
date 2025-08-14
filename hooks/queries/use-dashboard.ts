'use client'

/**
 * 仪表板查询 Hooks
 * 
 * 基于 React Query 实现的仪表板数据查询钩子集合
 * 将传统的 useEffect + useState 模式迁移到统一的 React Query CSR 架构
 * 遵循 FR-2 统一数据获取Hooks 和 FR-5 缓存策略优化需求
 */

import { useQuery, useQueries, UseQueryOptions } from '@tanstack/react-query'
import { dashboardService } from '@/lib/dashboard-service'
import { queryKeys } from '@/lib/query-keys'
import { createQueryOptions, DataType } from '@/lib/cache-strategies'
import { reactQueryErrorUtils } from '@/lib/error-handler'
import {
  DashboardOverview,
  UserGrowthData,
  RevenueTrendData,
  StatsQueryParams,
  UserStatsResponse,
  CacheMetricsResponse,
  CacheDashboardResponse,
  PaymentRetryStatsResponse,
  InvoiceStatsResponse
} from '@/lib/stats-types'

// ==================== 类型定义 ====================

/**
 * 仪表板查询参数
 */
export interface UseDashboardParams extends StatsQueryParams {
  enabled?: boolean
}

/**
 * 仪表板概览查询参数
 */
export interface UseDashboardOverviewParams extends UseDashboardParams {
  autoRefresh?: boolean
  refreshInterval?: number
}

/**
 * 收入趋势查询参数
 */
export interface UseRevenueTrendParams extends UseDashboardParams {
  period?: 'daily' | 'weekly' | 'monthly'
}

/**
 * 用户增长查询参数
 */
export interface UseUserGrowthParams extends UseDashboardParams {
  days?: number
}

/**
 * 支付重试统计查询参数
 */
export interface UsePaymentRetryStatsParams {
  gateway: string
  days?: number
  enabled?: boolean
}

/**
 * 发票统计查询参数
 */
export interface UseInvoiceStatsParams {
  fromDate?: string
  toDate?: string
  enabled?: boolean
}

// ==================== 核心统计数据 Hooks ====================

/**
 * 获取仪表板概览数据
 * 整合用户、订单、缓存等多个维度的核心统计数据
 */
export const useDashboardOverview = (params: UseDashboardOverviewParams = {}) => {
  const { 
    enabled = true, 
    autoRefresh = false,
    refreshInterval = 300000, // 5分钟默认刷新间隔
    ...queryParams 
  } = params
  
  return useQuery({
    queryKey: queryKeys.dashboard.overview(),
    queryFn: () => dashboardService.getOverview(queryParams),
    ...createQueryOptions(DataType.STATS, {
      enabled,
      refetchInterval: autoRefresh ? refreshInterval : false,
      select: (data: DashboardOverview) => {
        // 数据增强和格式化
        return {
          ...data,
          // 添加计算属性和格式化
          users: data.users ? {
            ...data.users,
            growthRate: calculateGrowthRate(data.users.new_users_this_month, data.users.new_users_this_week),
            activeRate: data.users.total_users > 0 ? data.users.active_users / data.users.total_users : 0,
          } : null,
          orders: data.orders ? {
            ...data.orders,
            conversionPercentage: Math.round(data.orders.conversion_rate * 100),
            avgOrderValue: data.orders.total_orders > 0 ? data.orders.total_revenue / data.orders.total_orders : 0,
          } : null,
          // 添加数据获取时间戳
          lastUpdated: new Date().toISOString(),
        }
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'dashboard',
          operation: 'overview',
          params: queryParams
        })
      }
    })
  })
}

/**
 * 获取用户统计数据
 * 支持角色分布、状态分布、OAuth提供商分布等维度
 */
export const useUserStats = (options: { enabled?: boolean } = {}) => {
  const { enabled = true } = options
  
  return useQuery({
    queryKey: queryKeys.dashboard.userStats(),
    queryFn: () => dashboardService.getUserStats(),
    ...createQueryOptions(DataType.STATS, {
      enabled,
      select: (data: UserStatsResponse) => {
        // 用户统计数据增强
        return {
          ...data,
          // 计算增长趋势
          dailyGrowthRate: data.new_users_today,
          weeklyGrowthRate: data.new_users_this_week,
          monthlyGrowthRate: data.new_users_this_month,
          // 活跃用户比率
          activityRate: data.total_users > 0 ? data.active_users / data.total_users : 0,
          // 提供商分布数据转换
          providerDistribution: Object.entries(data.users_by_provider || {}).map(([provider, count]) => ({
            provider,
            count,
            percentage: data.total_users > 0 ? (count / data.total_users) * 100 : 0
          })),
          // 角色分布数据转换
          roleDistribution: Object.entries(data.users_by_role || {}).map(([role, count]) => ({
            role,
            count,
            percentage: data.total_users > 0 ? (count / data.total_users) * 100 : 0
          })),
          // 状态分布数据转换
          statusDistribution: Object.entries(data.users_by_status || {}).map(([status, count]) => ({
            status,
            count,
            percentage: data.total_users > 0 ? (count / data.total_users) * 100 : 0
          }))
        }
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'dashboard',
          operation: 'user-stats'
        })
      }
    })
  })
}

// ==================== 趋势和图表数据 Hooks ====================

/**
 * 获取收入趋势数据
 * 支持日、周、月不同时间维度的收入趋势分析
 */
export const useRevenueTrend = (params: UseRevenueTrendParams = {}) => {
  const { enabled = true, period = 'daily', ...queryParams } = params
  
  return useQuery({
    queryKey: [...queryKeys.dashboard.charts(), 'revenue-trend', { period, ...queryParams }],
    queryFn: () => dashboardService.getRevenueTrend(queryParams),
    ...createQueryOptions(DataType.STATS, {
      enabled,
      select: (data: RevenueTrendData) => {
        // 根据期间参数选择对应数据
        const trendData = data[period] || []
        
        return {
          ...data,
          currentPeriod: period,
          trendData,
          // 计算趋势指标
          totalRevenue: trendData.reduce((sum, point) => sum + point.value, 0),
          averageDaily: trendData.length > 0 ? 
            trendData.reduce((sum, point) => sum + point.value, 0) / trendData.length : 0,
          growthTrend: calculateTrendGrowth(trendData),
          // 格式化显示数据
          formattedData: trendData.map(point => ({
            ...point,
            formattedDate: formatDateByPeriod(point.date, period),
            formattedValue: formatCurrency(point.value)
          }))
        }
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'dashboard',
          operation: 'revenue-trend',
          params: { period, ...queryParams }
        })
      }
    })
  })
}

/**
 * 获取用户增长数据
 * 展示新增用户、总用户数、活跃用户数的时间序列数据
 */
export const useUserGrowth = (params: UseUserGrowthParams = {}) => {
  const { enabled = true, days = 30, ...queryParams } = params
  
  return useQuery({
    queryKey: [...queryKeys.dashboard.charts(), 'user-growth', { days, ...queryParams }],
    queryFn: () => dashboardService.getUserGrowth(queryParams),
    ...createQueryOptions(DataType.STATS, {
      enabled,
      select: (data: UserGrowthData[]) => {
        return {
          rawData: data,
          // 计算增长统计
          totalNewUsers: data.reduce((sum, point) => sum + point.new_users, 0),
          averageDailyGrowth: data.length > 0 ? 
            data.reduce((sum, point) => sum + point.new_users, 0) / data.length : 0,
          peakDay: data.reduce((peak, current) => 
            current.new_users > peak.new_users ? current : peak, data[0] || { new_users: 0 }),
          // 格式化图表数据
          chartData: data.map(point => ({
            ...point,
            formattedDate: formatChartDate(point.date),
            cumulativeGrowth: point.total_users - (data[0]?.total_users || 0)
          })),
          // 计算趋势
          growthTrend: calculateUserGrowthTrend(data)
        }
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'dashboard',
          operation: 'user-growth',
          params: { days, ...queryParams }
        })
      }
    })
  })
}

// ==================== 专项数据 Hooks ====================

/**
 * 获取缓存性能指标
 * 监控系统缓存命中率、响应时间等性能数据
 */
export const useCacheMetrics = (options: { enabled?: boolean } = {}) => {
  const { enabled = true } = options
  
  return useQuery({
    queryKey: queryKeys.cache.metrics(),
    queryFn: () => dashboardService.getCacheMetrics(),
    ...createQueryOptions(DataType.REALTIME, {
      enabled,
      refetchInterval: 60000, // 1分钟刷新一次
      select: (data: CacheMetricsResponse) => {
        return {
          ...data,
          // 计算性能指标
          hitRatePercentage: data.hit_rate ? Math.round(data.hit_rate * 100) : 0,
          missRatePercentage: data.hit_rate ? Math.round((1 - data.hit_rate) * 100) : 0,
          avgResponseTimeMs: data.avg_response_time || 0,
          // 性能等级评估
          performanceLevel: assessCachePerformance(data),
          lastUpdated: new Date().toISOString()
        }
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'dashboard',
          operation: 'cache-metrics'
        })
      }
    })
  })
}

/**
 * 获取缓存仪表板数据
 * 缓存系统的详细监控和管理数据
 */
export const useCacheDashboard = (options: { enabled?: boolean } = {}) => {
  const { enabled = true } = options
  
  return useQuery({
    queryKey: [...queryKeys.cache.all, 'dashboard'],
    queryFn: () => dashboardService.getCacheDashboard(),
    ...createQueryOptions(DataType.REALTIME, {
      enabled,
      refetchInterval: 120000, // 2分钟刷新一次
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'dashboard',
          operation: 'cache-dashboard'
        })
      }
    })
  })
}

/**
 * 获取支付重试统计
 * 分析支付失败重试的成功率和趋势
 */
export const usePaymentRetryStats = (params: UsePaymentRetryStatsParams) => {
  const { gateway, days = 30, enabled = true } = params
  
  return useQuery({
    queryKey: [...queryKeys.paymentRetry.stats(), { gateway, days }],
    queryFn: () => dashboardService.getPaymentRetryStats(gateway, days),
    ...createQueryOptions(DataType.STATS, {
      enabled: enabled && !!gateway,
      select: (data: PaymentRetryStatsResponse) => {
        return {
          ...data,
          // 成功率计算
          retrySuccessRate: data.total_retries > 0 ? 
            (data.successful_retries / data.total_retries) * 100 : 0,
          // 失败率计算
          retryFailureRate: data.total_retries > 0 ? 
            ((data.total_retries - data.successful_retries) / data.total_retries) * 100 : 0,
          // 平均重试次数
          avgRetriesPerPayment: data.total_payments > 0 ? 
            data.total_retries / data.total_payments : 0,
          gatewayInfo: gateway,
          periodDays: days
        }
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'dashboard',
          operation: 'payment-retry-stats',
          params: { gateway, days }
        })
      }
    })
  })
}

/**
 * 获取发票统计数据
 * 分析发票生成、支付状态等财务数据
 */
export const useInvoiceStats = (params: UseInvoiceStatsParams = {}) => {
  const { fromDate, toDate, enabled = true } = params
  
  return useQuery({
    queryKey: [...queryKeys.invoices.all, 'stats', { fromDate, toDate }],
    queryFn: () => dashboardService.getInvoiceStats(fromDate, toDate),
    ...createQueryOptions(DataType.STATS, {
      enabled,
      select: (data: InvoiceStatsResponse) => {
        return {
          ...data,
          // 支付率计算
          paymentRate: data.total_invoices > 0 ? 
            (data.paid_invoices / data.total_invoices) * 100 : 0,
          // 未支付率计算
          unpaidRate: data.total_invoices > 0 ? 
            (data.unpaid_invoices / data.total_invoices) * 100 : 0,
          // 平均发票金额
          avgInvoiceAmount: data.total_invoices > 0 ? 
            data.total_amount / data.total_invoices : 0,
          // 时间范围信息
          dateRange: { fromDate, toDate },
          formattedAmount: formatCurrency(data.total_amount)
        }
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'dashboard',
          operation: 'invoice-stats',
          params: { fromDate, toDate }
        })
      }
    })
  })
}

// ==================== 组合数据 Hooks ====================

/**
 * 批量获取所有仪表板核心数据
 * 一次性获取概览、用户统计、缓存指标等关键数据
 */
export const useDashboardData = (params: UseDashboardParams = {}) => {
  const { enabled = true, ...queryParams } = params

  const queries = useQueries({
    queries: [
      {
        queryKey: queryKeys.dashboard.overview(),
        queryFn: () => dashboardService.getOverview(queryParams),
        ...createQueryOptions(DataType.STATS, { enabled }),
      },
      {
        queryKey: queryKeys.dashboard.userStats(),
        queryFn: () => dashboardService.getUserStats(),
        ...createQueryOptions(DataType.STATS, { enabled }),
      },
      {
        queryKey: queryKeys.cache.metrics(),
        queryFn: () => dashboardService.getCacheMetrics(),
        ...createQueryOptions(DataType.REALTIME, { enabled }),
      },
    ]
  })

  const [overviewQuery, userStatsQuery, cacheMetricsQuery] = queries

  return {
    // 概览数据
    overview: {
      data: overviewQuery.data,
      isLoading: overviewQuery.isLoading,
      error: overviewQuery.error,
      refetch: overviewQuery.refetch,
    },
    // 用户统计
    userStats: {
      data: userStatsQuery.data,
      isLoading: userStatsQuery.isLoading,
      error: userStatsQuery.error,
      refetch: userStatsQuery.refetch,
    },
    // 缓存指标
    cacheMetrics: {
      data: cacheMetricsQuery.data,
      isLoading: cacheMetricsQuery.isLoading,
      error: cacheMetricsQuery.error,
      refetch: cacheMetricsQuery.refetch,
    },
    // 整体状态
    isLoading: queries.some(query => query.isLoading),
    hasError: queries.some(query => query.error),
    // 批量刷新
    refetchAll: () => Promise.all(queries.map(query => query.refetch())),
  }
}

/**
 * 获取系统健康状态
 * 监控系统各个组件的健康状况
 */
export const useSystemHealth = (options: { enabled?: boolean } = {}) => {
  const { enabled = true } = options
  
  return useQuery({
    queryKey: [...queryKeys.dashboard.all, 'system-health'],
    queryFn: () => dashboardService.getSystemHealth(),
    ...createQueryOptions(DataType.REALTIME, {
      enabled,
      refetchInterval: 30000, // 30秒刷新
      select: (data) => {
        return {
          ...data,
          // 整体健康状态评估
          overallHealth: assessSystemHealth(data),
          lastChecked: new Date().toISOString(),
          // 电路熔断器状态摘要
          circuitBreakerSummary: Object.entries(data.circuitBreakers || {}).reduce((acc, [endpoint, status]) => {
            acc.total += 1
            if (status.state === 'OPEN') acc.open += 1
            if (status.state === 'CLOSED') acc.closed += 1
            if (status.state === 'HALF_OPEN') acc.halfOpen += 1
            return acc
          }, { total: 0, open: 0, closed: 0, halfOpen: 0 })
        }
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'dashboard',
          operation: 'system-health'
        })
      }
    })
  })
}

// ==================== 工具函数 ====================

/**
 * 计算增长率
 */
function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

/**
 * 计算趋势增长
 */
function calculateTrendGrowth(data: Array<{ value: number }>): number {
  if (data.length < 2) return 0
  const first = data[0].value
  const last = data[data.length - 1].value
  return calculateGrowthRate(last, first)
}

/**
 * 计算用户增长趋势
 */
function calculateUserGrowthTrend(data: UserGrowthData[]): 'increasing' | 'decreasing' | 'stable' {
  if (data.length < 7) return 'stable'
  
  const recentWeek = data.slice(-7)
  const averageRecent = recentWeek.reduce((sum, point) => sum + point.new_users, 0) / 7
  
  const previousWeek = data.slice(-14, -7)
  const averagePrevious = previousWeek.length > 0 ? 
    previousWeek.reduce((sum, point) => sum + point.new_users, 0) / previousWeek.length : 0
  
  const growth = calculateGrowthRate(averageRecent, averagePrevious)
  
  if (growth > 5) return 'increasing'
  if (growth < -5) return 'decreasing'
  return 'stable'
}

/**
 * 评估缓存性能等级
 */
function assessCachePerformance(metrics: CacheMetricsResponse): 'excellent' | 'good' | 'fair' | 'poor' {
  const hitRate = metrics.hit_rate || 0
  const responseTime = metrics.avg_response_time || 0
  
  if (hitRate >= 0.9 && responseTime <= 100) return 'excellent'
  if (hitRate >= 0.8 && responseTime <= 200) return 'good'
  if (hitRate >= 0.6 && responseTime <= 500) return 'fair'
  return 'poor'
}

/**
 * 评估系统整体健康状况
 */
function assessSystemHealth(healthData: any): 'healthy' | 'warning' | 'critical' {
  const circuitBreakers = healthData.circuitBreakers || {}
  const openBreakers = Object.values(circuitBreakers).filter((status: any) => status.state === 'OPEN').length
  const totalBreakers = Object.keys(circuitBreakers).length
  
  if (totalBreakers === 0) return 'healthy'
  
  const failureRate = openBreakers / totalBreakers
  
  if (failureRate === 0) return 'healthy'
  if (failureRate <= 0.2) return 'warning'
  return 'critical'
}

/**
 * 根据时间周期格式化日期
 */
function formatDateByPeriod(date: string, period: string): string {
  const dateObj = new Date(date)
  
  switch (period) {
    case 'daily':
      return dateObj.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    case 'weekly':
      return `第${Math.ceil(dateObj.getDate() / 7)}周`
    case 'monthly':
      return dateObj.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' })
    default:
      return date
  }
}

/**
 * 格式化图表日期
 */
function formatChartDate(date: string): string {
  return new Date(date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

/**
 * 格式化货币显示
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(amount)
}

// ==================== 兼容性导出 ====================

/**
 * 兼容现有 useDashboardData hook 的简化版本
 * 保持与现有组件的兼容性
 */
export const useDashboardDataCompat = (params?: StatsQueryParams) => {
  const { overview, userStats, cacheMetrics, isLoading, hasError, refetchAll } = useDashboardData(params || {})
  
  return {
    overview: overview.data,
    userGrowth: [], // 需要单独调用 useUserGrowth
    revenueTrend: null, // 需要单独调用 useRevenueTrend
    loading: {
      overview: overview.isLoading,
      userGrowth: false,
      revenueTrend: false
    },
    error: {
      overview: overview.error?.message || null,
      userGrowth: null,
      revenueTrend: null
    },
    isLoading,
    hasError,
    actions: {
      refreshAll: refetchAll,
      fetchOverview: overview.refetch,
      fetchUserGrowth: () => Promise.resolve([]),
      fetchRevenueTrend: () => Promise.resolve(null)
    }
  }
}

// ==================== 默认导出 ====================

export default {
  useDashboardOverview,
  useUserStats,
  useRevenueTrend,
  useUserGrowth,
  useCacheMetrics,
  useCacheDashboard,
  usePaymentRetryStats,
  useInvoiceStats,
  useDashboardData,
  useSystemHealth,
  useDashboardDataCompat,
}