'use client'

import { useState, useEffect, useRef } from 'react'
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

  // 获取概览数据
  const fetchOverview = async () => {
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
  }

  // 获取用户增长数据
  const fetchUserGrowth = async () => {
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
  }

  // 获取收入趋势数据
  const fetchRevenueTrend = async () => {
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
  }

  // 刷新所有数据
  const refreshAll = async () => {
    if (!mountedRef.current) return
    
    await Promise.all([
      fetchOverview(),
      fetchUserGrowth(),
      fetchRevenueTrend()
    ])
  }

  // 初始化数据获取
  useEffect(() => {
    fetchOverview()

    return () => {
      mountedRef.current = false
    }
  }, []) // 只在组件挂载时执行

  return {
    ...state,
    actions: {
      refreshAll,
      fetchOverview,
      fetchUserGrowth,
      fetchRevenueTrend
    }
  }
}