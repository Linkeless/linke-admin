'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ==================== 错误恢复和重试Hook ====================

interface RetryConfig {
  maxRetries: number
  initialDelay: number
  maxDelay: number
  backoffMultiplier: number
  jitter: boolean // 添加随机抖动避免雷群效应
}

interface ErrorRecoveryConfig {
  retry: RetryConfig
  circuitBreaker: {
    failureThreshold: number
    resetTimeout: number
    halfOpenMaxCalls: number
  }
  fallback: {
    enabled: boolean
    data?: any
    queryFn?: () => Promise<any>
  }
}

interface ErrorState {
  error: Error | null
  isRetrying: boolean
  retryCount: number
  lastRetryAt: number | null
  canRetry: boolean
  nextRetryAt: number | null
}

interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  failureCount: number
  lastFailureAt: number | null
  nextAttemptAt: number | null
  halfOpenCallsCount: number
}

const DEFAULT_CONFIG: ErrorRecoveryConfig = {
  retry: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true
  },
  circuitBreaker: {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
    halfOpenMaxCalls: 3
  },
  fallback: {
    enabled: true
  }
}

// 计算下次重试时间
function calculateNextRetryDelay(
  retryCount: number,
  config: RetryConfig
): number {
  let delay = Math.min(
    config.initialDelay * Math.pow(config.backoffMultiplier, retryCount),
    config.maxDelay
  )

  if (config.jitter) {
    // 添加 ±25% 的随机抖动
    const jitterRange = delay * 0.25
    delay += (Math.random() - 0.5) * 2 * jitterRange
  }

  return Math.max(delay, 0)
}

// 判断错误是否可重试
function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase()
  
  // 不可重试的错误类型
  const nonRetryableErrors = [
    '权限不足',
    'unauthorized',
    'forbidden',
    '参数错误',
    'validation error',
    'bad request'
  ]
  
  return !nonRetryableErrors.some(pattern => message.includes(pattern))
}

// 错误分类
function categorizeError(error: Error): {
  category: 'network' | 'server' | 'client' | 'unknown'
  severity: 'low' | 'medium' | 'high'
  isRetryable: boolean
} {
  const message = error.message.toLowerCase()
  
  // 网络错误
  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return { category: 'network', severity: 'medium', isRetryable: true }
  }
  
  // 服务器错误 (5xx)
  if (message.includes('server') || message.includes('internal error') || message.includes('503') || message.includes('502')) {
    return { category: 'server', severity: 'high', isRetryable: true }
  }
  
  // 客户端错误 (4xx)
  if (message.includes('400') || message.includes('401') || message.includes('403') || message.includes('404')) {
    return { category: 'client', severity: 'low', isRetryable: false }
  }
  
  return { category: 'unknown', severity: 'medium', isRetryable: true }
}

// 电路熔断器类
class CircuitBreaker {
  private state: CircuitBreakerState = {
    state: 'CLOSED',
    failureCount: 0,
    lastFailureAt: null,
    nextAttemptAt: null,
    halfOpenCallsCount: 0
  }

  constructor(private config: ErrorRecoveryConfig['circuitBreaker']) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    const now = Date.now()

    // 检查电路状态
    if (this.state.state === 'OPEN') {
      if (now < this.state.nextAttemptAt!) {
        throw new Error('Circuit breaker is OPEN')
      }
      // 转换到半开状态
      this.state.state = 'HALF_OPEN'
      this.state.halfOpenCallsCount = 0
    }

    if (this.state.state === 'HALF_OPEN' && this.state.halfOpenCallsCount >= this.config.halfOpenMaxCalls) {
      throw new Error('Circuit breaker is HALF_OPEN and max calls exceeded')
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    if (this.state.state === 'HALF_OPEN') {
      this.state.halfOpenCallsCount++
      if (this.state.halfOpenCallsCount >= this.config.halfOpenMaxCalls) {
        // 恢复到关闭状态
        this.state.state = 'CLOSED'
        this.state.failureCount = 0
        this.state.halfOpenCallsCount = 0
      }
    } else {
      this.state.failureCount = 0
    }
  }

  private onFailure(): void {
    this.state.failureCount++
    this.state.lastFailureAt = Date.now()

    if (this.state.state === 'HALF_OPEN') {
      // 半开状态失败，立即回到开启状态
      this.state.state = 'OPEN'
      this.state.nextAttemptAt = Date.now() + this.config.resetTimeout
    } else if (this.state.failureCount >= this.config.failureThreshold) {
      // 失败次数达到阈值，开启电路熔断器
      this.state.state = 'OPEN'
      this.state.nextAttemptAt = Date.now() + this.config.resetTimeout
    }
  }

  getState(): CircuitBreakerState {
    return { ...this.state }
  }

  reset(): void {
    this.state = {
      state: 'CLOSED',
      failureCount: 0,
      lastFailureAt: null,
      nextAttemptAt: null,
      halfOpenCallsCount: 0
    }
  }
}

export function useErrorRecovery<T>({
  queryFn,
  config = {},
  enabled = true,
  onSuccess,
  onError,
  onRetry,
  onMaxRetriesReached,
  onCircuitOpen
}: {
  queryFn: () => Promise<T>
  config?: Partial<ErrorRecoveryConfig>
  enabled?: boolean
  onSuccess?: (data: T, retryCount: number) => void
  onError?: (error: Error, errorInfo: ReturnType<typeof categorizeError>) => void
  onRetry?: (retryCount: number, nextRetryAt: number) => void
  onMaxRetriesReached?: (finalError: Error) => void
  onCircuitOpen?: (circuitState: CircuitBreakerState) => void
}) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
    lastRetryAt: null,
    canRetry: true,
    nextRetryAt: null
  })

  const mountedRef = useRef(true)
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null)
  const circuitBreakerRef = useRef<CircuitBreaker | null>(null)

  const mergedConfig = {
    retry: { ...DEFAULT_CONFIG.retry, ...config.retry },
    circuitBreaker: { ...DEFAULT_CONFIG.circuitBreaker, ...config.circuitBreaker },
    fallback: { ...DEFAULT_CONFIG.fallback, ...config.fallback }
  }

  // 初始化电路熔断器
  useEffect(() => {
    circuitBreakerRef.current = new CircuitBreaker(mergedConfig.circuitBreaker)
  }, [mergedConfig.circuitBreaker])

  // 执行查询的核心函数
  const executeQuery = useCallback(async (isRetry: boolean = false): Promise<void> => {
    if (!enabled || !mountedRef.current) return

    setIsLoading(true)
    
    if (isRetry) {
      setErrorState(prev => ({
        ...prev,
        isRetrying: true,
        lastRetryAt: Date.now()
      }))
    } else {
      setErrorState(prev => ({
        ...prev,
        error: null,
        retryCount: 0,
        canRetry: true,
        nextRetryAt: null
      }))
    }

    try {
      // 使用电路熔断器执行查询
      const result = await circuitBreakerRef.current!.execute(queryFn)
      
      if (mountedRef.current) {
        setData(result)
        setErrorState(prev => ({
          ...prev,
          error: null,
          isRetrying: false
        }))
        
        onSuccess?.(result, errorState.retryCount)
      }
      
    } catch (error) {
      const err = error as Error
      const errorInfo = categorizeError(err)
      
      if (mountedRef.current) {
        const newRetryCount = isRetry ? errorState.retryCount + 1 : 1
        const canRetry = errorInfo.isRetryable && 
                        newRetryCount <= mergedConfig.retry.maxRetries &&
                        !err.message.includes('Circuit breaker is OPEN')
        
        let nextRetryAt: number | null = null
        
        if (canRetry) {
          const delay = calculateNextRetryDelay(newRetryCount - 1, mergedConfig.retry)
          nextRetryAt = Date.now() + delay
          
          // 设置重试定时器
          retryTimerRef.current = setTimeout(() => {
            if (mountedRef.current) {
              executeQuery(true)
            }
          }, delay)
          
          onRetry?.(newRetryCount, nextRetryAt)
        } else if (newRetryCount > mergedConfig.retry.maxRetries) {
          onMaxRetriesReached?.(err)
        }
        
        // 检查电路熔断器状态
        const circuitState = circuitBreakerRef.current!.getState()
        if (circuitState.state === 'OPEN') {
          onCircuitOpen?.(circuitState)
        }
        
        setErrorState({
          error: err,
          isRetrying: canRetry,
          retryCount: newRetryCount,
          lastRetryAt: isRetry ? Date.now() : null,
          canRetry,
          nextRetryAt
        })
        
        onError?.(err, errorInfo)
        
        // 如果启用了降级处理且不能重试，尝试使用降级数据
        if (!canRetry && mergedConfig.fallback.enabled) {
          await handleFallback()
        }
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [enabled, queryFn, errorState.retryCount, mergedConfig, onSuccess, onError, onRetry, onMaxRetriesReached, onCircuitOpen])

  // 降级处理
  const handleFallback = useCallback(async (): Promise<void> => {
    if (!mergedConfig.fallback.enabled) return

    try {
      let fallbackData: T | null = null
      
      if (mergedConfig.fallback.queryFn) {
        // 使用降级查询函数
        fallbackData = await mergedConfig.fallback.queryFn()
      } else if (mergedConfig.fallback.data) {
        // 使用静态降级数据
        fallbackData = mergedConfig.fallback.data
      }
      
      if (fallbackData && mountedRef.current) {
        setData(fallbackData)
        console.warn('Using fallback data due to persistent errors')
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError)
    }
  }, [mergedConfig.fallback])

  // 手动重试
  const retry = useCallback((): void => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }
    
    executeQuery(true)
  }, [executeQuery])

  // 重置错误状态
  const resetError = useCallback((): void => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }
    
    setErrorState({
      error: null,
      isRetrying: false,
      retryCount: 0,
      lastRetryAt: null,
      canRetry: true,
      nextRetryAt: null
    })
    
    circuitBreakerRef.current?.reset()
  }, [])

  // 强制执行（绕过电路熔断器）
  const forceExecute = useCallback(async (): Promise<void> => {
    if (!enabled || !mountedRef.current) return

    resetError()
    setIsLoading(true)

    try {
      const result = await queryFn()
      
      if (mountedRef.current) {
        setData(result)
        onSuccess?.(result, 0)
      }
    } catch (error) {
      const err = error as Error
      const errorInfo = categorizeError(err)
      
      if (mountedRef.current) {
        setErrorState(prev => ({
          ...prev,
          error: err,
          canRetry: errorInfo.isRetryable
        }))
        
        onError?.(err, errorInfo)
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [enabled, queryFn, resetError, onSuccess, onError])

  // 初始执行
  useEffect(() => {
    if (enabled) {
      executeQuery()
    }
  }, [enabled]) // 只在enabled变化时执行

  // 清理定时器
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current)
      }
    }
  }, [])

  return {
    data,
    isLoading,
    ...errorState,
    
    // 电路熔断器状态
    circuitBreakerState: circuitBreakerRef.current?.getState() || null,
    
    // 控制方法
    retry,
    resetError,
    forceExecute,
    
    // 工具方法
    getTimeUntilNextRetry: (): number => {
      if (!errorState.nextRetryAt) return 0
      return Math.max(0, errorState.nextRetryAt - Date.now())
    },
    
    // 错误分析
    getErrorAnalysis: (): ReturnType<typeof categorizeError> | null => {
      return errorState.error ? categorizeError(errorState.error) : null
    }
  }
}

// 错误恢复工具函数
export const errorRecoveryUtils = {
  // 分析错误
  categorizeError,
  
  // 检查是否可重试
  isRetryableError,
  
  // 计算重试延迟
  calculateRetryDelay: calculateNextRetryDelay,
  
  // 创建带有错误恢复的查询函数
  withErrorRecovery: <T>(
    queryFn: () => Promise<T>,
    config?: Partial<ErrorRecoveryConfig>
  ) => {
    return (options?: {
      onSuccess?: (data: T) => void
      onError?: (error: Error) => void
    }) => {
      // 这里可以返回一个封装了错误恢复逻辑的Hook
      // 在实际使用中会配合useErrorRecovery使用
      return { queryFn, config, ...options }
    }
  }
}