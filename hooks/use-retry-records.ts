/**
 * 支付重试记录相关Hooks
 * 提供重试记录管理和监控功能
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { paymentRetryService } from '@/lib/payment-retry-service'
import type {
  RetryRecord,
  PaymentRetryHistory,
  ManualRetryRequest,
  RetryRecordsQueryParams,
  RetryRecordsApiResponse,
  RetryRecordDetail,
  RealtimeMonitoringData,
  FilterState,
  SortState,
  TimeRange
} from '@/lib/payment-retry-types'

// 重试记录列表Hook
export function useRetryRecords(initialParams?: RetryRecordsQueryParams) {
  const [records, setRecords] = useState<RetryRecord[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [queryParams, setQueryParams] = useState<RetryRecordsQueryParams>(initialParams || {})

  const fetchRecords = useCallback(async (params?: RetryRecordsQueryParams) => {
    setLoading(true)
    setError(null)

    try {
      const response = await paymentRetryService.getRetryRecords(params || queryParams)
      setRecords(response.data)
      setTotal(response.total)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取重试记录失败'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [queryParams])

  const updateQueryParams = useCallback((newParams: Partial<RetryRecordsQueryParams>) => {
    const updatedParams = { ...queryParams, ...newParams }
    setQueryParams(updatedParams)
    return fetchRecords(updatedParams)
  }, [queryParams, fetchRecords])

  const refreshRecords = useCallback(() => {
    return fetchRecords()
  }, [fetchRecords])

  const changePage = useCallback((page: number, pageSize: number) => {
    return updateQueryParams({
      offset: (page - 1) * pageSize,
      limit: pageSize
    })
  }, [updateQueryParams])

  const changeFilters = useCallback((filters: Partial<RetryRecordsQueryParams>) => {
    return updateQueryParams({ ...filters, offset: 0 })
  }, [updateQueryParams])

  const changeSorting = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    return updateQueryParams({
      sort_by: sortBy as 'retry_at' | 'completed_at' | 'attempt_number',
      sort_order: sortOrder
    })
  }, [updateQueryParams])

  const searchByPaymentId = useCallback((paymentId: string) => {
    return updateQueryParams({ payment_id: paymentId, offset: 0 })
  }, [updateQueryParams])

  // 初始加载数据
  useEffect(() => {
    fetchRecords()
  }, [])

  return {
    records,
    total,
    loading,
    error,
    queryParams,
    fetchRecords,
    updateQueryParams,
    refreshRecords,
    changePage,
    changeFilters,
    changeSorting,
    searchByPaymentId
  }
}

// 支付重试历史Hook
export function usePaymentRetryHistory(paymentId?: string) {
  const [history, setHistory] = useState<PaymentRetryHistory | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await paymentRetryService.getPaymentRetryHistory(id)
      setHistory(response.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取支付重试历史失败'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshHistory = useCallback(() => {
    if (paymentId) {
      return fetchHistory(paymentId)
    }
  }, [paymentId, fetchHistory])

  useEffect(() => {
    if (paymentId) {
      fetchHistory(paymentId)
    }
  }, [paymentId, fetchHistory])

  return {
    history,
    loading,
    error,
    fetchHistory,
    refreshHistory
  }
}

// 重试记录详情Hook
export function useRetryRecordDetail(recordId?: string) {
  const [detail, setDetail] = useState<RetryRecordDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDetail = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await paymentRetryService.getRetryRecordDetail(id)
      setDetail(response.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取重试记录详情失败'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (recordId) {
      fetchDetail(recordId)
    }
  }, [recordId, fetchDetail])

  return {
    detail,
    loading,
    error,
    fetchDetail
  }
}

// 重试操作Hook
export function useRetryOperations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const manualRetry = useCallback(async (request: ManualRetryRequest) => {
    setLoading(true)
    setError(null)

    try {
      const response = await paymentRetryService.manualRetryPayment(request)
      return { success: true, data: response.data }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '手动重试失败'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  const cancelRetry = useCallback(async (paymentId: string, reason?: string) => {
    setLoading(true)
    setError(null)

    try {
      await paymentRetryService.cancelRetry(paymentId, reason)
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '取消重试失败'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    manualRetry,
    cancelRetry,
    clearError
  }
}

// 实时监控Hook
export function useRealtimeMonitoring(autoRefresh: boolean = true, refreshInterval: number = 30000) {
  const [data, setData] = useState<RealtimeMonitoringData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await paymentRetryService.getRealtimeMonitoringData()
      setData(response.data)
      setLastUpdated(new Date())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取实时监控数据失败'
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
      intervalRef.current = setInterval(fetchData, refreshInterval)
    }
  }, [autoRefresh, refreshInterval, fetchData])

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

  useEffect(() => {
    fetchData()
    startAutoRefresh()

    return () => {
      stopAutoRefresh()
    }
  }, [fetchData, startAutoRefresh, stopAutoRefresh])

  return {
    data,
    loading,
    error,
    lastUpdated,
    fetchData,
    toggleAutoRefresh,
    startAutoRefresh,
    stopAutoRefresh
  }
}

// 过滤器管理Hook
export function useRetryRecordFilters(initialFilters?: Partial<FilterState>) {
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    error_type: 'all',
    strategy_id: 'all',
    time_range: '24h',
    ...initialFilters
  })

  const updateFilter = useCallback(<K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({
      status: 'all',
      error_type: 'all',
      strategy_id: 'all',
      time_range: '24h'
    })
  }, [])

  const getQueryParams = useCallback((): RetryRecordsQueryParams => {
    const params: RetryRecordsQueryParams = {}

    if (filters.status !== 'all') {
      params.status = filters.status
    }

    if (filters.error_type !== 'all') {
      params.error_type = filters.error_type
    }

    if (filters.strategy_id !== 'all') {
      params.strategy_id = filters.strategy_id
    }

    // 处理时间范围
    if (filters.time_range !== 'custom') {
      const now = new Date()
      const hours = {
        '1h': 1,
        '6h': 6,
        '24h': 24,
        '7d': 24 * 7,
        '30d': 24 * 30
      }[filters.time_range] || 24

      params.start_date = new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString()
      params.end_date = now.toISOString()
    } else if (filters.start_date && filters.end_date) {
      params.start_date = filters.start_date
      params.end_date = filters.end_date
    }

    return params
  }, [filters])

  return {
    filters,
    updateFilter,
    updateFilters,
    resetFilters,
    getQueryParams
  }
}

// 排序管理Hook
export function useRetryRecordSorting(initialSort?: SortState) {
  const [sortState, setSortState] = useState<SortState>(
    initialSort || { field: 'retry_at', direction: 'desc' }
  )

  const updateSort = useCallback((field: string) => {
    setSortState(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }))
  }, [])

  const resetSort = useCallback(() => {
    setSortState({ field: 'retry_at', direction: 'desc' })
  }, [])

  const getQueryParams = useCallback((): Pick<RetryRecordsQueryParams, 'sort_by' | 'sort_order'> => {
    return {
      sort_by: sortState.field as 'retry_at' | 'completed_at' | 'attempt_number',
      sort_order: sortState.direction
    }
  }, [sortState])

  return {
    sortState,
    updateSort,
    resetSort,
    getQueryParams
  }
}

// 综合重试记录管理Hook
export function useRetryRecordManagement(
  initialParams?: RetryRecordsQueryParams,
  initialFilters?: Partial<FilterState>
) {
  const records = useRetryRecords(initialParams)
  const operations = useRetryOperations()
  const filters = useRetryRecordFilters(initialFilters)
  const sorting = useRetryRecordSorting()

  const loading = records.loading || operations.loading
  const error = records.error || operations.error

  const clearAllErrors = useCallback(() => {
    operations.clearError()
  }, [operations.clearError])

  // 应用过滤器和排序
  const applyFiltersAndSort = useCallback(() => {
    const filterParams = filters.getQueryParams()
    const sortParams = sorting.getQueryParams()
    return records.updateQueryParams({ ...filterParams, ...sortParams, offset: 0 })
  }, [filters.getQueryParams, sorting.getQueryParams, records.updateQueryParams])

  // 重置所有过滤器和排序
  const resetAll = useCallback(() => {
    filters.resetFilters()
    sorting.resetSort()
    return records.updateQueryParams({})
  }, [filters.resetFilters, sorting.resetSort, records.updateQueryParams])

  // 手动重试并刷新记录
  const manualRetryAndRefresh = useCallback(async (request: ManualRetryRequest) => {
    const result = await operations.manualRetry(request)
    if (result.success) {
      await records.refreshRecords()
    }
    return result
  }, [operations.manualRetry, records.refreshRecords])

  // 取消重试并刷新记录
  const cancelRetryAndRefresh = useCallback(async (paymentId: string, reason?: string) => {
    const result = await operations.cancelRetry(paymentId, reason)
    if (result.success) {
      await records.refreshRecords()
    }
    return result
  }, [operations.cancelRetry, records.refreshRecords])

  return {
    ...records,
    operations,
    filters,
    sorting,
    loading,
    error,
    clearAllErrors,
    applyFiltersAndSort,
    resetAll,
    manualRetryAndRefresh,
    cancelRetryAndRefresh
  }
}