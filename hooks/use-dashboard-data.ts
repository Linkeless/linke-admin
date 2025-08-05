'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { dashboardService } from '@/lib/dashboard-service'
import { 
  DashboardOverview, 
  UserGrowthData,
  RevenueTrendData,
  StatsQueryParams 
} from '@/lib/stats-types'

interface DashboardDataState {
  overview: DashboardOverview | null
  userGrowth: UserGrowthData[]
  revenueTrend: RevenueTrendData | null
  loading: {
    overview: boolean
    userGrowth: boolean
    revenueTrend: boolean
  }
  error: {
    overview: string | null
    userGrowth: string | null
    revenueTrend: string | null
  }
}

export function useDashboardData(params?: StatsQueryParams) {
  const [state, setState] = useState<DashboardDataState>({
    overview: null,
    userGrowth: [],
    revenueTrend: null,
    loading: {
      overview: true,
      userGrowth: false,
      revenueTrend: false
    },
    error: {
      overview: null,
      userGrowth: null,
      revenueTrend: null
    }
  })

  const mountedRef = useRef(true)

  // 获取概览数据 - 使用useCallback进行优化
  const fetchOverview = useCallback(async (force?: boolean) => {
    if (!mountedRef.current) return

    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, overview: true },
      error: { ...prev.error, overview: null }
    }))

    try {
      const overview = await dashboardService.getOverview(params)
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          overview,
          loading: { ...prev.loading, overview: false }
        }))
      }
    } catch (error) {
      if (mountedRef.current) {
        const errorMessage = error instanceof Error ? error.message : '获取概览数据失败'
        setState(prev => ({
          ...prev,
          loading: { ...prev.loading, overview: false },
          error: { ...prev.error, overview: errorMessage }
        }))
      }
    }
  }, [params])

  // 获取用户增长数据 - 使用useCallback进行优化
  const fetchUserGrowth = useCallback(async (force?: boolean) => {
    if (!mountedRef.current) return

    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, userGrowth: true },
      error: { ...prev.error, userGrowth: null }
    }))

    try {
      const userGrowth = await dashboardService.getUserGrowth(params)
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          userGrowth,
          loading: { ...prev.loading, userGrowth: false }
        }))
      }
    } catch (error) {
      if (mountedRef.current) {
        const errorMessage = error instanceof Error ? error.message : '获取用户增长数据失败'
        setState(prev => ({
          ...prev,
          loading: { ...prev.loading, userGrowth: false },
          error: { ...prev.error, userGrowth: errorMessage }
        }))
      }
    }
  }, [params])

  // 获取收入趋势数据 - 使用useCallback进行优化
  const fetchRevenueTrend = useCallback(async (force?: boolean) => {
    if (!mountedRef.current) return

    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, revenueTrend: true },
      error: { ...prev.error, revenueTrend: null }
    }))

    try {
      const revenueTrend = await dashboardService.getRevenueTrend(params)
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          revenueTrend,
          loading: { ...prev.loading, revenueTrend: false }
        }))
      }
    } catch (error) {
      if (mountedRef.current) {
        const errorMessage = error instanceof Error ? error.message : '获取收入趋势数据失败'
        setState(prev => ({
          ...prev,
          loading: { ...prev.loading, revenueTrend: false },
          error: { ...prev.error, revenueTrend: errorMessage }
        }))
      }
    }
  }, [params])

  // 刷新所有数据 - 使用useCallback进行优化
  const refreshAll = useCallback(async () => {
    if (!mountedRef.current) return
    
    await Promise.all([
      fetchOverview(),
      fetchUserGrowth(),
      fetchRevenueTrend()
    ])
  }, [fetchOverview, fetchUserGrowth, fetchRevenueTrend])

  // 初始化数据获取
  useEffect(() => {
    fetchOverview()

    return () => {
      mountedRef.current = false
    }
  }, []) // 只在组件挂载时执行

  // 计算派生状态 - 使用useMemo优化
  const isLoading = useMemo(() => 
    state.loading.overview || state.loading.userGrowth || state.loading.revenueTrend, 
    [state.loading]
  )

  const hasError = useMemo(() => 
    state.error.overview || state.error.userGrowth || state.error.revenueTrend,
    [state.error]
  )

  // 操作方法 - 使用useMemo防止不必要的重新创建
  const actions = useMemo(() => ({
    refreshAll,
    fetchOverview,
    fetchUserGrowth,
    fetchRevenueTrend
  }), [refreshAll, fetchOverview, fetchUserGrowth, fetchRevenueTrend])

  return {
    // 数据状态
    ...state,
    
    // 派生状态
    isLoading,
    hasError,
    
    // 操作方法
    actions
  }
}

// ==================== 相关工具Hook ====================

// 简化版Hook，只获取概览数据
export function useDashboardOverview(params?: StatsQueryParams) {
  const { overview, loading, error, actions } = useDashboardData(params)
  
  return useMemo(() => ({
    data: overview,
    isLoading: loading.overview,
    error: error.overview,
    refresh: actions.fetchOverview
  }), [overview, loading.overview, error.overview, actions.fetchOverview])
}

// 性能监控Hook - 简化版本
export function useDashboardPerformance() {
  const [metrics, setMetrics] = useState<{
    requestCount: number
    errorCount: number
    avgResponseTime: number
    cacheHitRate: number
  }>({ requestCount: 0, errorCount: 0, avgResponseTime: 0, cacheHitRate: 0 })
  
  // 定期更新性能指标
  useEffect(() => {
    const updateMetrics = async () => {
      try {
        const systemHealth = await dashboardService.getSystemHealth()
        if (systemHealth?.cache) {
          const cacheStats = systemHealth.cache
          setMetrics(prev => ({
            ...prev,
            cacheHitRate: cacheStats.valid / (cacheStats.valid + cacheStats.expired) || 0
          }))
        }
      } catch (error) {
        console.warn('Failed to update performance metrics:', error)
      }
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 60000) // 1分钟刷新一次

    return () => clearInterval(interval)
  }, [])
  
  return useMemo(() => ({
    metrics
  }), [metrics])
}