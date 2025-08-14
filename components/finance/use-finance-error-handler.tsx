'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ErrorType, ErrorSeverity } from '@/lib/error-handler'

interface FinanceErrorHandlerOptions {
  module?: 'orders' | 'coupons' | 'invoices' | 'finance'
  showToast?: boolean
  redirectOnAuth?: boolean
  logErrors?: boolean
}

interface HandleErrorOptions {
  operation?: string
  context?: Record<string, any>
  silent?: boolean
  showRetry?: boolean
  onRetry?: () => void
}

/**
 * 财务模块统一错误处理Hook
 * 提供标准化的错误处理逻辑和用户反馈
 */
export function useFinanceErrorHandler(options: FinanceErrorHandlerOptions = {}) {
  const router = useRouter()
  
  const {
    module = 'finance',
    showToast = true,
    redirectOnAuth = true,
    logErrors = true
  } = options

  const moduleNames = {
    orders: '订单',
    coupons: '优惠券',
    invoices: '发票', 
    finance: '财务'
  }

  const handleError = useCallback((
    error: any,
    errorOptions: HandleErrorOptions = {}
  ) => {
    const {
      operation = '操作',
      context = {},
      silent = false,
      showRetry = false,
      onRetry
    } = errorOptions

    // 记录错误日志
    if (logErrors) {
      console.error(`${moduleNames[module]}${operation}错误:`, error, {
        module,
        operation,
        context,
        timestamp: new Date().toISOString()
      })
    }

    // 分析错误类型
    const errorInfo = analyzeError(error)
    
    // 处理特定错误类型
    switch (errorInfo.type) {
      case ErrorType.AUTHENTICATION_ERROR:
        if (!silent && showToast) {
          toast.error('认证失败', {
            description: '登录已过期，请重新登录'
          })
        }
        if (redirectOnAuth) {
          router.push('/login')
        }
        return

      case ErrorType.AUTHORIZATION_ERROR:
        if (!silent && showToast) {
          toast.error('权限不足', {
            description: '您没有权限执行此操作'
          })
        }
        return

      case ErrorType.NETWORK_ERROR:
        if (!silent && showToast) {
          toast.error('网络连接失败', {
            description: showRetry ? '请检查网络连接' : '请检查网络连接后重试',
            action: showRetry && onRetry ? {
              label: '重试',
              onClick: onRetry
            } : undefined
          })
        }
        return

      case ErrorType.VALIDATION_ERROR:
        if (!silent && showToast) {
          const message = getValidationErrorMessage(error)
          toast.error('数据验证失败', {
            description: message
          })
        }
        return

      case ErrorType.SERVER_ERROR:
        if (!silent && showToast) {
          toast.error('服务器错误', {
            description: `${moduleNames[module]}${operation}时服务器出现问题，请稍后重试`
          })
        }
        return

      default:
        if (!silent && showToast) {
          const message = getErrorMessage(error)
          toast.error(`${moduleNames[module]}${operation}失败`, {
            description: message || '发生未知错误，请稍后重试',
            action: showRetry && onRetry ? {
              label: '重试',
              onClick: onRetry
            } : undefined
          })
        }
    }
  }, [module, router, showToast, redirectOnAuth, logErrors])

  const handleQueryError = useCallback((error: any, queryInfo?: {
    queryKey?: any[]
    operation?: string
  }) => {
    const operation = queryInfo?.operation || '数据获取'
    handleError(error, { operation, silent: false })
  }, [handleError])

  const handleMutationError = useCallback((error: any, variables?: any, mutationInfo?: {
    operation?: string
    onRetry?: () => void
  }) => {
    const operation = mutationInfo?.operation || '操作'
    handleError(error, { 
      operation,
      context: { variables },
      showRetry: !!mutationInfo?.onRetry,
      onRetry: mutationInfo?.onRetry
    })
  }, [handleError])

  return {
    handleError,
    handleQueryError,
    handleMutationError
  }
}

/**
 * 分析错误类型和严重程度
 */
function analyzeError(error: any): {
  type: ErrorType
  severity: ErrorSeverity
  isRetryable: boolean
} {
  // 网络错误
  if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
    return {
      type: ErrorType.NETWORK_ERROR,
      severity: ErrorSeverity.MEDIUM,
      isRetryable: true
    }
  }

  // 超时错误
  if (error?.name === 'AbortError' || error?.message?.includes('timeout')) {
    return {
      type: ErrorType.TIMEOUT_ERROR,
      severity: ErrorSeverity.MEDIUM,
      isRetryable: true
    }
  }

  // HTTP状态码错误
  const status = error?.response?.status || error?.status
  if (status) {
    if (status === 401) {
      return {
        type: ErrorType.AUTHENTICATION_ERROR,
        severity: ErrorSeverity.HIGH,
        isRetryable: false
      }
    }
    
    if (status === 403) {
      return {
        type: ErrorType.AUTHORIZATION_ERROR,
        severity: ErrorSeverity.HIGH,
        isRetryable: false
      }
    }
    
    if (status === 404) {
      return {
        type: ErrorType.NOT_FOUND_ERROR,
        severity: ErrorSeverity.MEDIUM,
        isRetryable: false
      }
    }
    
    if (status >= 400 && status < 500) {
      return {
        type: ErrorType.CLIENT_ERROR,
        severity: ErrorSeverity.MEDIUM,
        isRetryable: false
      }
    }
    
    if (status >= 500) {
      return {
        type: ErrorType.SERVER_ERROR,
        severity: ErrorSeverity.HIGH,
        isRetryable: true
      }
    }
  }

  // 验证错误
  if (error?.name === 'ValidationError' || error?.validationErrors) {
    return {
      type: ErrorType.VALIDATION_ERROR,
      severity: ErrorSeverity.LOW,
      isRetryable: false
    }
  }

  // API错误
  if (error?.response || error?.code) {
    return {
      type: ErrorType.API_ERROR,
      severity: ErrorSeverity.MEDIUM,
      isRetryable: true
    }
  }

  // 默认为未知错误
  return {
    type: ErrorType.UNKNOWN_ERROR,
    severity: ErrorSeverity.MEDIUM,
    isRetryable: true
  }
}

/**
 * 获取验证错误消息
 */
function getValidationErrorMessage(error: any): string {
  if (error?.validationErrors && Array.isArray(error.validationErrors)) {
    return error.validationErrors.map((err: any) => err.message).join(', ')
  }
  
  if (error?.response?.data?.message) {
    return error.response.data.message
  }
  
  return '输入数据格式不正确'
}

/**
 * 获取通用错误消息
 */
function getErrorMessage(error: any): string {
  // API返回的错误消息
  if (error?.response?.data?.message) {
    return error.response.data.message
  }
  
  // 直接的错误消息
  if (error?.message) {
    return error.message
  }
  
  // 标准HTTP状态文本
  if (error?.response?.statusText) {
    return error.response.statusText
  }
  
  return ''
}

/**
 * React Query错误处理工具函数
 */
export const financeQueryErrorUtils = {
  /**
   * 为React Query查询添加标准错误处理
   */
  withErrorHandling: <T,>(
    queryFn: () => Promise<T>,
    module: 'orders' | 'coupons' | 'invoices' | 'finance' = 'finance'
  ) => {
    return async (): Promise<T> => {
      try {
        return await queryFn()
      } catch (error) {
        console.error(`${module}查询错误:`, error)
        throw error // 让React Query处理错误
      }
    }
  },

  /**
   * 获取查询重试配置
   */
  getRetryConfig: (errorType?: ErrorType) => {
    const config = {
      retry: (failureCount: number, error: any) => {
        const errorInfo = analyzeError(error)
        
        // 认证和授权错误不重试
        if (errorInfo.type === ErrorType.AUTHENTICATION_ERROR || 
            errorInfo.type === ErrorType.AUTHORIZATION_ERROR) {
          return false
        }
        
        // 客户端错误不重试
        if (errorInfo.type === ErrorType.CLIENT_ERROR || 
            errorInfo.type === ErrorType.VALIDATION_ERROR) {
          return false
        }
        
        // 其他错误最多重试2次
        return failureCount < 2
      },
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000)
    }
    
    return config
  }
}