/**
 * 支付重试配置相关Hooks
 * 提供重试配置管理和统计功能
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { paymentRetryService } from '@/lib/payment-retry-service'
import type {
  RetryConfig,
  UpdateRetryConfigRequest,
  RetryStats,
  RetryOverview
} from '@/lib/payment-retry-types'

// 重试配置Hook
export function useRetryConfig() {
  const [config, setConfig] = useState<RetryConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchConfig = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await paymentRetryService.getRetryConfig()
      setConfig(response.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取重试配置失败'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateConfig = useCallback(async (data: UpdateRetryConfigRequest) => {
    setSaving(true)
    setError(null)

    try {
      const response = await paymentRetryService.updateRetryConfig(data)
      setConfig(response.data)
      return { success: true, data: response.data }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新重试配置失败'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setSaving(false)
    }
  }, [])

  const toggleGlobalSwitch = useCallback(async (enabled: boolean) => {
    return updateConfig({ enabled })
  }, [updateConfig])

  const updateNotificationSettings = useCallback(async (
    notificationEnabled: boolean,
    notificationEmail?: string
  ) => {
    return updateConfig({
      notification_enabled: notificationEnabled,
      notification_email: notificationEmail
    })
  }, [updateConfig])

  const refreshConfig = useCallback(() => {
    return fetchConfig()
  }, [fetchConfig])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // 初始加载配置
  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  return {
    config,
    loading,
    saving,
    error,
    fetchConfig,
    updateConfig,
    toggleGlobalSwitch,
    updateNotificationSettings,
    refreshConfig,
    clearError
  }
}

// 重试统计Hook
export function useRetryStats(initialDays: number = 30, autoRefresh: boolean = false) {
  const [stats, setStats] = useState<RetryStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(initialDays)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchStats = useCallback(async (daysToFetch?: number) => {
    setLoading(true)
    setError(null)

    try {
      const response = await paymentRetryService.getRetryStats(daysToFetch || days)
      setStats(response.data)
      setLastUpdated(new Date())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取重试统计失败'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [days])

  const changeDateRange = useCallback((newDays: number) => {
    setDays(newDays)
    return fetchStats(newDays)
  }, [fetchStats])

  const refreshStats = useCallback(() => {
    return fetchStats()
  }, [fetchStats])

  const startAutoRefresh = useCallback((intervalMs: number = 300000) => { // 默认5分钟
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchStats, intervalMs)
    }
  }, [autoRefresh, fetchStats])

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const toggleAutoRefresh = useCallback((enabled: boolean, intervalMs?: number) => {
    if (enabled) {
      startAutoRefresh(intervalMs)
    } else {
      stopAutoRefresh()
    }
  }, [startAutoRefresh, stopAutoRefresh])

  // 计算统计指标
  const getSuccessRateTrend = useCallback(() => {
    if (!stats?.daily_stats || stats.daily_stats.length < 2) {
      return 0
    }

    const recent = stats.daily_stats.slice(-7) // 最近7天
    const earlier = stats.daily_stats.slice(-14, -7) // 之前7天

    const recentAvg = recent.reduce((sum, day) => sum + day.success_rate, 0) / recent.length
    const earlierAvg = earlier.reduce((sum, day) => sum + day.success_rate, 0) / earlier.length

    return recentAvg - earlierAvg
  }, [stats])

  const getTopPerformingStrategy = useCallback(() => {
    if (!stats?.strategy_stats || stats.strategy_stats.length === 0) {
      return null
    }

    return stats.strategy_stats.reduce((best, current) => 
      current.success_rate > best.success_rate ? current : best
    )
  }, [stats])

  const getMostCommonError = useCallback(() => {
    if (!stats?.most_common_errors || stats.most_common_errors.length === 0) {
      return null
    }

    return stats.most_common_errors[0]
  }, [stats])

  useEffect(() => {
    fetchStats()
    if (autoRefresh) {
      startAutoRefresh()
    }

    return () => {
      stopAutoRefresh()
    }
  }, [fetchStats, autoRefresh, startAutoRefresh, stopAutoRefresh])

  return {
    stats,
    loading,
    error,
    days,
    lastUpdated,
    fetchStats,
    changeDateRange,
    refreshStats,
    toggleAutoRefresh,
    getSuccessRateTrend,
    getTopPerformingStrategy,
    getMostCommonError
  }
}

// 重试概览Hook
export function useRetryOverview(autoRefresh: boolean = true, refreshInterval: number = 30000) {
  const [overview, setOverview] = useState<RetryOverview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchOverview = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await paymentRetryService.getRetryOverview()
      setOverview(response.data)
      setLastUpdated(new Date())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取重试概览失败'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchOverview, refreshInterval)
    }
  }, [autoRefresh, refreshInterval, fetchOverview])

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const toggleAutoRefresh = useCallback((enabled: boolean) => {
    if (enabled) {
      startAutoRefresh()
    } else {
      stopAutoRefresh()
    }
  }, [startAutoRefresh, stopAutoRefresh])

  const refreshOverview = useCallback(() => {
    return fetchOverview()
  }, [fetchOverview])

  // 获取活动状态摘要
  const getActivitySummary = useCallback(() => {
    if (!overview) {
      return {
        totalActive: 0,
        criticalIssues: 0,
        recentSuccesses: 0,
        systemHealth: 'unknown' as 'good' | 'warning' | 'critical' | 'unknown'
      }
    }

    const totalActive = overview.active_retries + overview.pending_retries
    const criticalIssues = overview.failed_retries_today
    const recentSuccesses = overview.recent_activities.filter(
      activity => activity.type === 'retry_success'
    ).length

    let systemHealth: 'good' | 'warning' | 'critical' | 'unknown' = 'good'
    
    if (overview.success_rate_today < 0.5) {
      systemHealth = 'critical'
    } else if (overview.success_rate_today < 0.8) {
      systemHealth = 'warning'
    }

    return {
      totalActive,
      criticalIssues,
      recentSuccesses,
      systemHealth
    }
  }, [overview])

  useEffect(() => {
    fetchOverview()
    startAutoRefresh()

    return () => {
      stopAutoRefresh()
    }
  }, [fetchOverview, startAutoRefresh, stopAutoRefresh])

  return {
    overview,
    loading,
    error,
    lastUpdated,
    fetchOverview,
    refreshOverview,
    toggleAutoRefresh,
    getActivitySummary
  }
}

// 配置验证Hook
export function useConfigValidation() {
  const validateConfig = useCallback((config: Partial<UpdateRetryConfigRequest>) => {
    const errors: Record<string, string> = {}

    if (config.max_daily_retries !== undefined) {
      if (config.max_daily_retries < 0) {
        errors.max_daily_retries = '每日最大重试次数不能为负数'
      } else if (config.max_daily_retries > 10000) {
        errors.max_daily_retries = '每日最大重试次数不能超过10000'
      }
    }

    if (config.retry_window_hours !== undefined) {
      if (config.retry_window_hours < 1) {
        errors.retry_window_hours = '重试窗口不能少于1小时'
      } else if (config.retry_window_hours > 168) { // 7天
        errors.retry_window_hours = '重试窗口不能超过7天(168小时)'
      }
    }

    if (config.auto_cancel_after_hours !== undefined) {
      if (config.auto_cancel_after_hours < 1) {
        errors.auto_cancel_after_hours = '自动取消时间不能少于1小时'
      } else if (config.auto_cancel_after_hours > 720) { // 30天
        errors.auto_cancel_after_hours = '自动取消时间不能超过30天(720小时)'
      }
    }

    if (config.max_concurrent_retries !== undefined) {
      if (config.max_concurrent_retries < 1) {
        errors.max_concurrent_retries = '最大并发重试数不能少于1'
      } else if (config.max_concurrent_retries > 100) {
        errors.max_concurrent_retries = '最大并发重试数不能超过100'
      }
    }

    if (config.notification_enabled && config.notification_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(config.notification_email)) {
        errors.notification_email = '请输入有效的邮箱地址'
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }, [])

  const validateNotificationEmail = useCallback((email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return {
      isValid: emailRegex.test(email),
      error: emailRegex.test(email) ? null : '请输入有效的邮箱地址'
    }
  }, [])

  return {
    validateConfig,
    validateNotificationEmail
  }
}

// 综合配置管理Hook
export function useRetryConfigManagement(enableAutoRefresh: boolean = true) {
  const config = useRetryConfig()
  const stats = useRetryStats(30, enableAutoRefresh)
  const overview = useRetryOverview(enableAutoRefresh)
  const validation = useConfigValidation()

  const loading = config.loading || stats.loading || overview.loading
  const error = config.error || stats.error || overview.error

  const clearAllErrors = useCallback(() => {
    config.clearError()
  }, [config.clearError])

  // 获取系统健康状况
  const getSystemHealth = useCallback(() => {
    if (!stats.stats || !overview.overview) {
      return { status: 'unknown', message: '数据加载中...' }
    }

    const successRate = stats.stats.success_rate
    const todaySuccessRate = overview.overview.success_rate_today
    const activeRetries = overview.overview.active_retries

    if (successRate < 0.5 || todaySuccessRate < 0.3) {
      return { 
        status: 'critical', 
        message: '重试成功率过低，系统可能存在严重问题' 
      }
    }

    if (successRate < 0.8 || activeRetries > 100) {
      return { 
        status: 'warning', 
        message: '重试性能有待改善，建议检查配置' 
      }
    }

    return { 
      status: 'good', 
      message: '系统运行正常' 
    }
  }, [stats.stats, overview.overview])

  // 获取配置建议
  const getConfigRecommendations = useCallback(() => {
    const recommendations: string[] = []

    if (!stats.stats || !config.config) {
      return recommendations
    }

    if (stats.stats.success_rate < 0.7) {
      recommendations.push('考虑调整重试策略，增加重试次数或调整重试间隔')
    }

    if (config.config.max_daily_retries < 1000 && stats.stats.total_retries > config.config.max_daily_retries * 0.8) {
      recommendations.push('每日重试限制可能过低，建议适当增加')
    }

    if (stats.stats.average_attempts > 3) {
      recommendations.push('平均重试次数较高，建议优化重试策略或检查支付网关问题')
    }

    const commonError = stats.getMostCommonError()
    if (commonError && commonError.percentage > 50) {
      recommendations.push(`最常见错误类型是${commonError.error_type}，建议针对性优化`)
    }

    return recommendations
  }, [stats.stats, stats.getMostCommonError, config.config])

  // 一键优化配置
  const optimizeConfig = useCallback(async () => {
    if (!stats.stats || !config.config) {
      return { success: false, error: '缺少必要数据进行优化' }
    }

    const updates: UpdateRetryConfigRequest = {}

    // 根据统计数据调整配置
    if (stats.stats.success_rate < 0.7) {
      updates.max_daily_retries = Math.min(config.config.max_daily_retries * 1.5, 10000)
    }

    if (stats.stats.average_attempts > 3) {
      updates.retry_window_hours = Math.max(config.config.retry_window_hours * 0.8, 1)
    }

    if (Object.keys(updates).length === 0) {
      return { success: true, message: '当前配置已经比较优化' }
    }

    return config.updateConfig(updates)
  }, [stats.stats, config.config, config.updateConfig])

  return {
    config: config.config,
    stats: stats.stats,
    overview: overview.overview,
    loading,
    error,
    validation,
    clearAllErrors,
    updateConfig: config.updateConfig,
    refreshStats: stats.refreshStats,
    refreshOverview: overview.refreshOverview,
    getSystemHealth,
    getConfigRecommendations,
    optimizeConfig
  }
}