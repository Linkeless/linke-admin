'use client'

import { z } from 'zod'

// ==================== 统一错误处理系统 ====================

// 错误类型枚举
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  CLIENT_ERROR = 'CLIENT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  CIRCUIT_BREAKER_ERROR = 'CIRCUIT_BREAKER_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CACHE_ERROR = 'CACHE_ERROR'
}

// 错误严重程度
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// 标准化错误接口
export interface StandardError {
  type: ErrorType
  severity: ErrorSeverity
  message: string
  code?: string | number
  details?: Record<string, any>
  timestamp: number
  requestId?: string
  userId?: string
  context?: Record<string, any>
  stackTrace?: string
  isRetryable: boolean
  retryAfter?: number
  recovery?: {
    action: string
    description: string
    automated: boolean
  }
}

// 验证错误详情
export interface ValidationErrorDetails {
  field: string
  message: string
  value?: any
  code?: string
}

// 扩展的验证错误
export interface ValidationError extends StandardError {
  type: ErrorType.VALIDATION_ERROR
  validationErrors: ValidationErrorDetails[]
}

// 网络错误详情
export interface NetworkError extends StandardError {
  type: ErrorType.NETWORK_ERROR
  url?: string
  method?: string
  timeout?: number
  retryCount?: number
}

// API错误详情
export interface ApiError extends StandardError {
  type: ErrorType.API_ERROR
  statusCode: number
  endpoint: string
  method: string
  response?: any
}

// 错误处理配置
interface ErrorHandlerConfig {
  enableLogging: boolean
  enableReporting: boolean
  reportingEndpoint?: string
  enableRecovery: boolean
  maxRetries: number
  retryDelay: number
}

const DEFAULT_CONFIG: ErrorHandlerConfig = {
  enableLogging: true,
  enableReporting: false,
  enableRecovery: true,
  maxRetries: 3,
  retryDelay: 1000
}

// 错误分析器
class ErrorAnalyzer {
  static analyzeError(error: any): {
    type: ErrorType
    severity: ErrorSeverity
    isRetryable: boolean
    retryAfter?: number
  } {
    // 网络错误
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        type: ErrorType.NETWORK_ERROR,
        severity: ErrorSeverity.MEDIUM,
        isRetryable: true,
        retryAfter: 5000
      }
    }

    // 超时错误
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return {
        type: ErrorType.TIMEOUT_ERROR,
        severity: ErrorSeverity.MEDIUM,
        isRetryable: true,
        retryAfter: 3000
      }
    }

    // HTTP状态码错误
    if (error.response?.status) {
      const status = error.response.status
      
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
          severity: ErrorSeverity.LOW,
          isRetryable: false
        }
      }
      
      if (status === 429) {
        return {
          type: ErrorType.RATE_LIMIT_ERROR,
          severity: ErrorSeverity.MEDIUM,
          isRetryable: true,
          retryAfter: error.response.headers?.['retry-after'] ? 
                     parseInt(error.response.headers['retry-after']) * 1000 : 60000
        }
      }
      
      if (status >= 500) {
        return {
          type: ErrorType.SERVER_ERROR,
          severity: ErrorSeverity.HIGH,
          isRetryable: true,
          retryAfter: 10000
        }
      }
      
      if (status >= 400) {
        return {
          type: ErrorType.CLIENT_ERROR,
          severity: ErrorSeverity.MEDIUM,
          isRetryable: false
        }
      }
    }

    // Zod验证错误
    if (error instanceof z.ZodError) {
      return {
        type: ErrorType.VALIDATION_ERROR,
        severity: ErrorSeverity.LOW,
        isRetryable: false
      }
    }

    // 电路熔断器错误
    if (error.message?.includes('Circuit breaker')) {
      return {
        type: ErrorType.CIRCUIT_BREAKER_ERROR,
        severity: ErrorSeverity.HIGH,
        isRetryable: true,
        retryAfter: 60000
      }
    }

    // 缓存错误
    if (error.message?.includes('cache') || error.message?.includes('Cache')) {
      return {
        type: ErrorType.CACHE_ERROR,
        severity: ErrorSeverity.LOW,
        isRetryable: true,
        retryAfter: 5000
      }
    }

    // 默认未知错误
    return {
      type: ErrorType.UNKNOWN_ERROR,
      severity: ErrorSeverity.MEDIUM,
      isRetryable: true,
      retryAfter: 5000
    }
  }

  static generateRecoveryAction(error: StandardError): StandardError['recovery'] {
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
        return {
          action: 'retry_with_backoff',
          description: '检查网络连接并重试',
          automated: true
        }
      
      case ErrorType.AUTHENTICATION_ERROR:
        return {
          action: 'redirect_to_login',
          description: '请重新登录',
          automated: true
        }
      
      case ErrorType.AUTHORIZATION_ERROR:
        return {
          action: 'show_permission_error',
          description: '联系管理员获取权限',
          automated: false
        }
      
      case ErrorType.RATE_LIMIT_ERROR:
        return {
          action: 'wait_and_retry',
          description: '请求过于频繁，请稍后再试',
          automated: true
        }
      
      case ErrorType.SERVER_ERROR:
        return {
          action: 'retry_with_fallback',
          description: '服务器暂时不可用，尝试使用缓存数据',
          automated: true
        }
      
      case ErrorType.VALIDATION_ERROR:
        return {
          action: 'show_validation_errors',
          description: '请检查输入数据格式',
          automated: false
        }
      
      case ErrorType.CIRCUIT_BREAKER_ERROR:
        return {
          action: 'use_fallback_data',
          description: '服务暂时不可用，显示缓存数据',
          automated: true
        }
      
      default:
        return {
          action: 'show_generic_error',
          description: '发生了未知错误，请稍后重试',
          automated: false
        }
    }
  }
}

// 错误上报器
class ErrorReporter {
  private config: ErrorHandlerConfig

  constructor(config: ErrorHandlerConfig) {
    this.config = config
  }

  async report(error: StandardError): Promise<void> {
    if (!this.config.enableReporting) return

    try {
      // 发送错误报告到监控系统
      if (this.config.reportingEndpoint) {
        await fetch(this.config.reportingEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...error,
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: Date.now()
          })
        })
      }

      // 本地日志记录
      if (this.config.enableLogging) {
        this.logError(error)
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  private logError(error: StandardError): void {
    const logLevel = this.getLogLevel(error.severity)
    
    const logMessage = `[${error.type}] ${error.message}`
    const logData = {
      ...error,
      url: window.location.href,
      userAgent: navigator.userAgent
    }

    switch (logLevel) {
      case 'error':
        console.error(logMessage, logData)
        break
      case 'warn':
        console.warn(logMessage, logData)
        break
      case 'info':
        console.info(logMessage, logData)
        break
      default:
        console.log(logMessage, logData)
    }
  }

  private getLogLevel(severity: ErrorSeverity): 'error' | 'warn' | 'info' | 'log' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error'
      case ErrorSeverity.MEDIUM:
        return 'warn'
      case ErrorSeverity.LOW:
        return 'info'
      default:
        return 'log'
    }
  }
}

// 主要的错误处理器
export class ErrorHandler {
  private config: ErrorHandlerConfig
  private reporter: ErrorReporter
  private errorHistory: StandardError[] = []
  private maxHistorySize = 100

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.reporter = new ErrorReporter(this.config)
  }

  // 处理错误的主要方法
  async handle(error: any, context?: Record<string, any>): Promise<StandardError> {
    const analysis = ErrorAnalyzer.analyzeError(error)
    
    const standardError: StandardError = {
      ...analysis,
      message: this.extractMessage(error),
      code: this.extractCode(error),
      details: this.extractDetails(error),
      timestamp: Date.now(),
      context: context || {},
      stackTrace: error.stack,
      recovery: ErrorAnalyzer.generateRecoveryAction({ ...analysis } as StandardError)
    }

    // 添加到历史记录
    this.addToHistory(standardError)

    // 上报错误
    await this.reporter.report(standardError)

    // 执行自动恢复
    if (this.config.enableRecovery && standardError.recovery?.automated) {
      await this.executeRecovery(standardError)
    }

    return standardError
  }

  // 处理验证错误
  handleValidationError(zodError: z.ZodError, context?: Record<string, any>): ValidationError {
    const validationErrors: ValidationErrorDetails[] = zodError.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      value: err.path.reduce((obj, key) => obj?.[key], zodError as any),
      code: err.code
    }))

    const standardError: ValidationError = {
      type: ErrorType.VALIDATION_ERROR,
      severity: ErrorSeverity.LOW,
      message: `数据验证失败: ${validationErrors.length} 个字段有错误`,
      validationErrors,
      timestamp: Date.now(),
      context: context || {},
      isRetryable: false,
      recovery: {
        action: 'show_validation_errors',
        description: '请检查并修正输入数据',
        automated: false
      }
    }

    this.addToHistory(standardError)
    this.reporter.report(standardError)

    return standardError
  }

  // 处理网络错误
  handleNetworkError(
    error: any, 
    requestInfo: { url?: string; method?: string; timeout?: number }
  ): NetworkError {
    const networkError: NetworkError = {
      type: ErrorType.NETWORK_ERROR,
      severity: ErrorSeverity.MEDIUM,
      message: `网络请求失败: ${error.message}`,
      url: requestInfo.url,
      method: requestInfo.method,
      timeout: requestInfo.timeout,
      timestamp: Date.now(),
      isRetryable: true,
      retryAfter: 5000,
      recovery: {
        action: 'retry_with_backoff',
        description: '检查网络连接并重试',
        automated: true
      }
    }

    this.addToHistory(networkError)
    this.reporter.report(networkError)

    return networkError
  }

  // 处理API错误
  handleApiError(
    error: any,
    requestInfo: { endpoint: string; method: string; statusCode: number }
  ): ApiError {
    const analysis = ErrorAnalyzer.analyzeError(error)
    
    const apiError: ApiError = {
      ...analysis,
      type: ErrorType.API_ERROR,
      message: `API请求失败: ${error.message}`,
      statusCode: requestInfo.statusCode,
      endpoint: requestInfo.endpoint,
      method: requestInfo.method,
      response: error.response?.data,
      timestamp: Date.now(),
      recovery: ErrorAnalyzer.generateRecoveryAction({ ...analysis } as StandardError)
    }

    this.addToHistory(apiError)
    this.reporter.report(apiError)

    return apiError
  }

  // 获取错误历史
  getErrorHistory(): StandardError[] {
    return [...this.errorHistory]
  }

  // 清理错误历史
  clearErrorHistory(): void {
    this.errorHistory = []
  }

  // 获取错误统计
  getErrorStats(): {
    total: number
    byType: Record<ErrorType, number>
    bySeverity: Record<ErrorSeverity, number>
    recentErrors: StandardError[]
  } {
    const byType = {} as Record<ErrorType, number>
    const bySeverity = {} as Record<ErrorSeverity, number>

    for (const error of this.errorHistory) {
      byType[error.type] = (byType[error.type] || 0) + 1
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1
    }

    const recentErrors = this.errorHistory
      .slice(-10)
      .sort((a, b) => b.timestamp - a.timestamp)

    return {
      total: this.errorHistory.length,
      byType,
      bySeverity,
      recentErrors
    }
  }

  // 私有方法
  private extractMessage(error: any): string {
    if (typeof error === 'string') return error
    if (error.message) return error.message
    if (error.response?.data?.message) return error.response.data.message
    return '未知错误'
  }

  private extractCode(error: any): string | number | undefined {
    if (error.code) return error.code
    if (error.response?.status) return error.response.status
    if (error.response?.data?.code) return error.response.data.code
    return undefined
  }

  private extractDetails(error: any): Record<string, any> | undefined {
    const details: Record<string, any> = {}
    
    if (error.response) {
      details.response = {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data
      }
    }
    
    if (error.config) {
      details.request = {
        url: error.config.url,
        method: error.config.method,
        headers: error.config.headers,
        timeout: error.config.timeout
      }
    }

    return Object.keys(details).length > 0 ? details : undefined
  }

  private addToHistory(error: StandardError): void {
    this.errorHistory.push(error)
    
    // 保持历史记录大小限制
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(-this.maxHistorySize)
    }
  }

  private async executeRecovery(error: StandardError): Promise<void> {
    try {
      switch (error.recovery?.action) {
        case 'redirect_to_login':
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
          break
          
        case 'retry_with_backoff':
          // 这里可以添加自动重试逻辑
          console.log('Executing automatic retry...')
          break
          
        case 'use_fallback_data':
          // 这里可以添加使用缓存数据的逻辑
          console.log('Using fallback data...')
          break
          
        default:
          console.log(`Recovery action not implemented: ${error.recovery?.action}`)
      }
    } catch (recoveryError) {
      console.error('Recovery execution failed:', recoveryError)
    }
  }
}

// 全局错误处理器实例
export const globalErrorHandler = new ErrorHandler()

// 工具函数
export const errorUtils = {
  // 检查错误是否可重试
  isRetryable: (error: StandardError): boolean => error.isRetryable,
  
  // 获取重试延迟
  getRetryDelay: (error: StandardError): number => error.retryAfter || 5000,
  
  // 格式化错误消息给用户显示
  formatUserMessage: (error: StandardError): string => {
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
        return '网络连接失败，请检查网络设置后重试'
      case ErrorType.AUTHENTICATION_ERROR:
        return '登录已过期，请重新登录'
      case ErrorType.AUTHORIZATION_ERROR:
        return '您没有权限执行此操作'
      case ErrorType.NOT_FOUND_ERROR:
        return '请求的资源不存在'
      case ErrorType.RATE_LIMIT_ERROR:
        return '请求过于频繁，请稍后再试'
      case ErrorType.SERVER_ERROR:
        return '服务器暂时不可用，请稍后再试'
      case ErrorType.VALIDATION_ERROR:
        return '输入数据格式有误，请检查后重试'
      default:
        return '操作失败，请稍后重试'
    }
  },
  
  // 检查错误严重程度
  isCritical: (error: StandardError): boolean => 
    error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH,
  
  // 创建用户友好的错误对象
  createUserFriendlyError: (error: StandardError) => ({
    message: errorUtils.formatUserMessage(error),
    canRetry: error.isRetryable,
    retryAfter: error.retryAfter,
    recovery: error.recovery
  })
}

// 便捷的错误显示函数
export const showError = (error: unknown, title = '操作失败') => {
  const standardError = globalErrorHandler.handleError(error, title)
  const userFriendlyError = errorUtils.createUserFriendlyError(standardError)
  
  // 这里可以集成toast库显示错误
  if (typeof window !== 'undefined') {
    console.error(`${title}: ${userFriendlyError.message}`)
    // 如果有toast库，可以在这里调用
    // toast.error(userFriendlyError.message)
  }
  
  return userFriendlyError
}

// 便捷的成功消息显示函数
export const showSuccess = (message: string, description?: string) => {
  if (typeof window !== 'undefined') {
    console.log(`成功: ${message}${description ? ` - ${description}` : ''}`)
    // 如果有toast库，可以在这里调用
    // toast.success(message, { description })
  }
}

// 主错误处理器别名，保持向后兼容
export const errorHandler = globalErrorHandler