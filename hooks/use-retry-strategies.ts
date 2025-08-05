/**
 * 支付重试策略相关Hooks
 * 提供重试策略管理功能
 */

import { useState, useCallback, useEffect } from 'react'
import { paymentRetryService } from '@/lib/payment-retry-service'
import type {
  RetryStrategy,
  CreateRetryStrategyRequest,
  UpdateRetryStrategyRequest,
  RetryStrategiesQueryParams,
  RetryStrategiesApiResponse,
  StrategyPerformance,
  BatchOperation
} from '@/lib/payment-retry-types'

// 重试策略列表Hook
export function useRetryStrategies(initialParams?: RetryStrategiesQueryParams) {
  const [strategies, setStrategies] = useState<RetryStrategy[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [queryParams, setQueryParams] = useState<RetryStrategiesQueryParams>(initialParams || {})

  const fetchStrategies = useCallback(async (params?: RetryStrategiesQueryParams) => {
    setLoading(true)
    setError(null)

    try {
      const response = await paymentRetryService.getRetryStrategies(params || queryParams)
      setStrategies(response.data)
      setTotal(response.total)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取重试策略失败'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [queryParams])

  const updateQueryParams = useCallback((newParams: Partial<RetryStrategiesQueryParams>) => {
    const updatedParams = { ...queryParams, ...newParams }
    setQueryParams(updatedParams)
    return fetchStrategies(updatedParams)
  }, [queryParams, fetchStrategies])

  const refreshStrategies = useCallback(() => {
    return fetchStrategies()
  }, [fetchStrategies])

  const searchStrategies = useCallback((searchTerm: string) => {
    return updateQueryParams({ offset: 0 })
  }, [updateQueryParams])

  const changePage = useCallback((page: number, pageSize: number) => {
    return updateQueryParams({
      offset: (page - 1) * pageSize,
      limit: pageSize
    })
  }, [updateQueryParams])

  const changeFilters = useCallback((filters: Partial<RetryStrategiesQueryParams>) => {
    return updateQueryParams({ ...filters, offset: 0 })
  }, [updateQueryParams])

  const changeSorting = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    return updateQueryParams({
      sort_by: sortBy as 'name' | 'created_at' | 'updated_at',
      sort_order: sortOrder
    })
  }, [updateQueryParams])

  // 初始加载数据
  useEffect(() => {
    fetchStrategies()
  }, [])

  return {
    strategies,
    total,
    loading,
    error,
    queryParams,
    fetchStrategies,
    updateQueryParams,
    refreshStrategies,
    searchStrategies,
    changePage,
    changeFilters,
    changeSorting
  }
}

// 单个重试策略Hook
export function useRetryStrategy(id?: string) {
  const [strategy, setStrategy] = useState<RetryStrategy | null>(null)
  const [performance, setPerformance] = useState<StrategyPerformance | null>(null)
  const [loading, setLoading] = useState(false)
  const [performanceLoading, setPerformanceLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStrategy = useCallback(async (strategyId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await paymentRetryService.getRetryStrategy(strategyId)
      setStrategy(response.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取重试策略失败'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPerformance = useCallback(async (strategyId: string, days: number = 30) => {
    setPerformanceLoading(true)

    try {
      const response = await paymentRetryService.getStrategyPerformance(strategyId, days)
      setPerformance(response.data)
    } catch (err) {
      console.error('获取策略性能失败:', err)
    } finally {
      setPerformanceLoading(false)
    }
  }, [])

  useEffect(() => {
    if (id) {
      fetchStrategy(id)
      fetchPerformance(id)
    }
  }, [id, fetchStrategy, fetchPerformance])

  return {
    strategy,
    performance,
    loading,
    performanceLoading,
    error,
    fetchStrategy,
    fetchPerformance,
    setStrategy
  }
}

// 重试策略操作Hook
export function useRetryStrategyOperations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createStrategy = useCallback(async (data: CreateRetryStrategyRequest) => {
    setLoading(true)
    setError(null)

    try {
      // 验证策略配置
      const validationErrors = paymentRetryService.validateRetryStrategy(data)
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join('; '))
      }

      const response = await paymentRetryService.createRetryStrategy(data)
      return { success: true, data: response.data }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建重试策略失败'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  const updateStrategy = useCallback(async (id: string, data: UpdateRetryStrategyRequest) => {
    setLoading(true)
    setError(null)

    try {
      // 验证策略配置
      const validationErrors = paymentRetryService.validateRetryStrategy(data)
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join('; '))
      }

      const response = await paymentRetryService.updateRetryStrategy(id, data)
      return { success: true, data: response.data }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新重试策略失败'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteStrategy = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      await paymentRetryService.deleteRetryStrategy(id)
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除重试策略失败'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  const toggleStrategy = useCallback(async (id: string, enabled: boolean) => {
    setLoading(true)
    setError(null)

    try {
      const response = await paymentRetryService.updateRetryStrategy(id, { enabled })
      return { success: true, data: response.data }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '切换策略状态失败'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  const batchOperation = useCallback(async (operation: BatchOperation) => {
    setLoading(true)
    setError(null)

    try {
      let result
      switch (operation.action) {
        case 'enable':
          result = await paymentRetryService.batchEnableStrategies(operation.ids)
          break
        case 'disable':
          result = await paymentRetryService.batchDisableStrategies(operation.ids)
          break
        case 'delete':
          result = await paymentRetryService.batchDeleteStrategies(operation.ids)
          break
        default:
          throw new Error(`不支持的批量操作: ${operation.action}`)
      }
      return { success: true, data: result.data }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '批量操作失败'
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
    createStrategy,
    updateStrategy,
    deleteStrategy,
    toggleStrategy,
    batchOperation,
    clearError
  }
}

// 策略配置选项Hook
export function useStrategyOptions() {
  const [errorConditions, setErrorConditions] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOptions = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [errorConditionsResponse, paymentMethodsResponse] = await Promise.all([
        paymentRetryService.getErrorConditions(),
        paymentRetryService.getPaymentMethods()
      ])

      setErrorConditions(errorConditionsResponse.data)
      setPaymentMethods(paymentMethodsResponse.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取配置选项失败'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getRetryIntervalPresets = useCallback(() => {
    return paymentRetryService.getRetryIntervalPresets()
  }, [])

  const getErrorTypeOptions = useCallback(() => {
    return paymentRetryService.getErrorTypeOptions()
  }, [])

  const formatRetryInterval = useCallback((seconds: number) => {
    return paymentRetryService.formatRetryInterval(seconds)
  }, [])

  const calculateNextRetryTime = useCallback((currentAttempt: number, retryIntervals: number[]) => {
    return paymentRetryService.calculateNextRetryTime(currentAttempt, retryIntervals)
  }, [])

  useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  return {
    errorConditions,
    paymentMethods,
    loading,
    error,
    fetchOptions,
    getRetryIntervalPresets,
    getErrorTypeOptions,
    formatRetryInterval,
    calculateNextRetryTime
  }
}

// 综合策略管理Hook
export function useStrategyManagement(initialParams?: RetryStrategiesQueryParams) {
  const strategiesList = useRetryStrategies(initialParams)
  const operations = useRetryStrategyOperations()
  const options = useStrategyOptions()

  const loading = strategiesList.loading || operations.loading || options.loading
  const error = strategiesList.error || operations.error || options.error

  const clearAllErrors = useCallback(() => {
    operations.clearError()
  }, [operations.clearError])

  // 创建策略并刷新列表
  const createAndRefresh = useCallback(async (data: CreateRetryStrategyRequest) => {
    const result = await operations.createStrategy(data)
    if (result.success) {
      await strategiesList.refreshStrategies()
    }
    return result
  }, [operations.createStrategy, strategiesList.refreshStrategies])

  // 更新策略并刷新列表
  const updateAndRefresh = useCallback(async (id: string, data: UpdateRetryStrategyRequest) => {
    const result = await operations.updateStrategy(id, data)
    if (result.success) {
      await strategiesList.refreshStrategies()
    }
    return result
  }, [operations.updateStrategy, strategiesList.refreshStrategies])

  // 删除策略并刷新列表
  const deleteAndRefresh = useCallback(async (id: string) => {
    const result = await operations.deleteStrategy(id)
    if (result.success) {
      await strategiesList.refreshStrategies()
    }
    return result
  }, [operations.deleteStrategy, strategiesList.refreshStrategies])

  // 批量操作并刷新列表
  const batchOperationAndRefresh = useCallback(async (operation: BatchOperation) => {
    const result = await operations.batchOperation(operation)
    if (result.success) {
      await strategiesList.refreshStrategies()
    }
    return result
  }, [operations.batchOperation, strategiesList.refreshStrategies])

  return {
    ...strategiesList,
    operations,
    options,
    loading,
    error,
    clearAllErrors,
    createAndRefresh,
    updateAndRefresh,
    deleteAndRefresh,
    batchOperationAndRefresh
  }
}