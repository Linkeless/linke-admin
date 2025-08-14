'use client'

import { z } from 'zod'
import { toast } from 'sonner'

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
    const validationErrors: ValidationErrorDetails[] = zodError.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
      value: issue.path.reduce((obj, key) => obj?.[key], zodError as any),
      code: issue.code
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

  // React Query查询错误处理
  async handleQueryError(error: any, context?: Record<string, any>): Promise<StandardError> {
    const analysis = ErrorAnalyzer.analyzeError(error)
    
    const standardError: StandardError = {
      ...analysis,
      message: this.extractMessage(error),
      code: this.extractCode(error),
      details: {
        ...this.extractDetails(error),
        queryType: 'query',
        queryContext: context
      },
      timestamp: Date.now(),
      context: { ...context, errorSource: 'react-query-query' },
      stackTrace: error.stack,
      recovery: ErrorAnalyzer.generateRecoveryAction({ ...analysis } as StandardError)
    }

    // 添加到历史记录
    this.addToHistory(standardError)

    // 上报错误
    await this.reporter.report(standardError)

    // 显示用户友好的错误信息
    this.showQueryErrorToUser(standardError)

    // 执行自动恢复（特别是401错误的重新登录）
    if (this.config.enableRecovery && standardError.recovery?.automated) {
      await this.executeRecovery(standardError)
    }

    // 对于认证错误，立即触发重新登录
    if (standardError.type === ErrorType.AUTHENTICATION_ERROR) {
      await this.handleAuthenticationError()
    }

    return standardError
  }

  // React Query变更错误处理
  async handleMutationError(error: any, context?: Record<string, any>): Promise<StandardError> {
    const analysis = ErrorAnalyzer.analyzeError(error)
    
    const standardError: StandardError = {
      ...analysis,
      message: this.extractMessage(error),
      code: this.extractCode(error),
      details: {
        ...this.extractDetails(error),
        queryType: 'mutation',
        mutationContext: context
      },
      timestamp: Date.now(),
      context: { ...context, errorSource: 'react-query-mutation' },
      stackTrace: error.stack,
      recovery: ErrorAnalyzer.generateRecoveryAction({ ...analysis } as StandardError)
    }

    // 添加到历史记录
    this.addToHistory(standardError)

    // 上报错误
    await this.reporter.report(standardError)

    // 显示用户友好的错误信息
    this.showMutationErrorToUser(standardError)

    // 执行自动恢复
    if (this.config.enableRecovery && standardError.recovery?.automated) {
      await this.executeRecovery(standardError)
    }

    // 对于认证错误，立即触发重新登录
    if (standardError.type === ErrorType.AUTHENTICATION_ERROR) {
      await this.handleAuthenticationError()
    }

    return standardError
  }

  // 处理认证错误（自动重新登录）
  private async handleAuthenticationError(): Promise<void> {
    try {
      // 清理本地存储的认证信息
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        
        // 显示认证错误提示
        toast.warning('登录已过期，正在跳转到登录页...', {
          duration: 3000,
          description: '请重新登录以继续使用'
        })
        
        // 触发重新登录事件，让应用层处理
        const authEvent = new CustomEvent('auth:logout', {
          detail: { reason: 'token_expired', automated: true }
        })
        window.dispatchEvent(authEvent)
        
        // 延迟重定向，给应用层时间处理
        setTimeout(() => {
          if (window.location.pathname !== '/login') {
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
          }
        }, 1000)
      }
    } catch (error) {
      console.error('Failed to handle authentication error:', error)
    }
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

  // 显示Query错误给用户
  private showQueryErrorToUser(error: StandardError): void {
    if (typeof window === 'undefined') return
    
    // 401错误由认证处理器处理，不显示额外toast
    if (error.type === ErrorType.AUTHENTICATION_ERROR) {
      return
    }
    
    // 403权限错误
    if (error.type === ErrorType.AUTHORIZATION_ERROR) {
      toast.error('访问被拒绝', {
        description: '您没有权限执行此操作',
        duration: 5000
      })
      return
    }
    
    // 网络错误
    if (error.type === ErrorType.NETWORK_ERROR) {
      toast.error('网络连接失败', {
        description: '请检查网络连接并重试',
        duration: 8000,
        action: {
          label: '重试',
          onClick: () => {
            // 刷新当前页面以重新加载数据
            window.location.reload()
          }
        }
      })
      return
    }
    
    // 服务器错误
    if (error.type === ErrorType.SERVER_ERROR) {
      toast.error('服务暂时不可用', {
        description: '请稍后再试，如问题持续请联系技术支持',
        duration: 8000,
        action: error.isRetryable ? {
          label: '重试',
          onClick: () => {
            window.location.reload()
          }
        } : undefined
      })
      return
    }
    
    // 其他可显示的错误
    if (reactQueryErrorUtils.shouldShowToUser(error)) {
      const message = reactQueryErrorUtils.formatQueryErrorMessage(error)
      
      if (error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL) {
        toast.error(message, {
          duration: 10000,
          description: error.code ? `错误代码: ${error.code}` : undefined
        })
      } else {
        toast.warning(message, {
          duration: 5000
        })
      }
    }
  }
  
  // 显示Mutation错误给用户
  private showMutationErrorToUser(error: StandardError): void {
    if (typeof window === 'undefined') return
    
    // 401错误由认证处理器处理
    if (error.type === ErrorType.AUTHENTICATION_ERROR) {
      return
    }
    
    // 验证错误
    if (error.type === ErrorType.VALIDATION_ERROR) {
      toast.error('输入数据有误', {
        description: '请检查表单数据并重试',
        duration: 5000
      })
      return
    }
    
    // 权限错误
    if (error.type === ErrorType.AUTHORIZATION_ERROR) {
      toast.error('操作被拒绝', {
        description: '您没有权限执行此操作',
        duration: 5000
      })
      return
    }
    
    // 网络错误
    if (error.type === ErrorType.NETWORK_ERROR) {
      toast.error('操作失败', {
        description: '网络连接失败，请检查网络后重试',
        duration: 8000,
        action: {
          label: '重试',
          onClick: () => {
            console.log('Manual retry requested for mutation')
          }
        }
      })
      return
    }
    
    // 服务器错误
    if (error.type === ErrorType.SERVER_ERROR) {
      toast.error('操作失败', {
        description: '服务器暂时不可用，请稍后重试',
        duration: 8000
      })
      return
    }
    
    // 业务错误（显示后端返回的具体信息）
    if (error.type === ErrorType.CLIENT_ERROR || error.type === ErrorType.API_ERROR) {
      const message = error.message || '操作失败'
      toast.error(message, {
        duration: 5000,
        description: error.code ? `错误代码: ${error.code}` : undefined
      })
      return
    }
    
    // 其他错误
    if (reactQueryErrorUtils.shouldShowToUser(error)) {
      const message = reactQueryErrorUtils.formatQueryErrorMessage(error)
      toast.error(message, {
        duration: 5000
      })
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
export const showError = async (error: unknown, title = '操作失败') => {
  const standardError = await globalErrorHandler.handle(error, { title })
  const userFriendlyError = errorUtils.createUserFriendlyError(standardError)
  
  // 使用Toast显示错误信息
  if (typeof window !== 'undefined') {
    console.error(`${title}: ${userFriendlyError.message}`)
    
    // 根据错误严重程度选择不同的toast类型
    if (errorUtils.isCritical(standardError)) {
      toast.error(userFriendlyError.message, {
        duration: 10000, // 严重错误显示更长时间
        description: `错误代码: ${standardError.code || 'UNKNOWN'}`,
        action: userFriendlyError.canRetry ? {
          label: '重试',
          onClick: () => {
            // 可以通过回调实现重试逻辑
            console.log('Retry action triggered')
          }
        } : undefined
      })
    } else {
      toast.error(userFriendlyError.message, {
        duration: 5000,
        action: userFriendlyError.canRetry ? {
          label: '重试',
          onClick: () => {
            console.log('Retry action triggered')
          }
        } : undefined
      })
    }
  }
  
  return userFriendlyError
}

// 便捷的成功消息显示函数
export const showSuccess = (message: string, description?: string) => {
  if (typeof window !== 'undefined') {
    console.log(`成功: ${message}${description ? ` - ${description}` : ''}`)
    toast.success(message, {
      description,
      duration: 3000
    })
  }
}

// React Query专用工具函数
export const reactQueryErrorUtils = {
  // 处理React Query查询错误
  handleQueryError: async (error: any, context?: Record<string, any>) => {
    return await globalErrorHandler.handleQueryError(error, context)
  },

  // 处理React Query变更错误
  handleMutationError: async (error: any, context?: Record<string, any>) => {
    return await globalErrorHandler.handleMutationError(error, context)
  },

  // 检查是否应该重试查询 - 增强版
  shouldRetryQuery: (error: any, failureCount: number): boolean => {
    // 先分析错误
    const analysis = ErrorAnalyzer.analyzeError(error)
    
    // 认证错误和授权错误不重试
    if (analysis.type === ErrorType.AUTHENTICATION_ERROR || 
        analysis.type === ErrorType.AUTHORIZATION_ERROR) {
      return false
    }
    
    // 验证错误和404错误不重试
    if (analysis.type === ErrorType.VALIDATION_ERROR || 
        analysis.type === ErrorType.NOT_FOUND_ERROR) {
      return false
    }
    
    // 网络错误和服务器错误可以多重试几次
    if (analysis.type === ErrorType.NETWORK_ERROR || 
        analysis.type === ErrorType.SERVER_ERROR || 
        analysis.type === ErrorType.TIMEOUT_ERROR) {
      return analysis.isRetryable && failureCount < 3
    }
    
    // 其他错误最多重试1次
    return analysis.isRetryable && failureCount < 1
  },

  // 获取重试延迟 - 智能退避策略
  getRetryDelay: (failureCount: number, error?: any): number => {
    if (!error) {
      return Math.min(1000 * Math.pow(2, failureCount), 30000)
    }
    
    const analysis = ErrorAnalyzer.analyzeError(error)
    
    // 如果错误分析提供了重试延迟，使用它
    if (analysis.retryAfter) {
      return Math.min(analysis.retryAfter, 30000)
    }
    
    // 网络错误使用更长的延迟
    if (analysis.type === ErrorType.NETWORK_ERROR) {
      const baseDelay = 5000 // 5秒基础延迟
      const exponentialDelay = baseDelay * Math.pow(2, failureCount)
      const jitter = Math.random() * 2000 // 随机抖动
      return Math.min(exponentialDelay + jitter, 60000) // 最大60秒
    }
    
    // 服务器错误使用固定延迟
    if (analysis.type === ErrorType.SERVER_ERROR) {
      return 10000 + (failureCount * 5000) // 10秒, 15秒, 20秒
    }
    
    // 限流错误使用更长的延迟
    if (analysis.type === ErrorType.RATE_LIMIT_ERROR) {
      return Math.max(analysis.retryAfter || 60000, 30000) // 至少30秒
    }
    
    // 其他错误使用标准指数退避
    const baseDelay = 1000
    const exponentialDelay = baseDelay * Math.pow(2, failureCount)
    const jitter = Math.random() * 1000
    return Math.min(exponentialDelay + jitter, 30000)
  },

  // 格式化React Query错误消息
  formatQueryErrorMessage: (error: StandardError): string => {
    const baseMessage = errorUtils.formatUserMessage(error)
    
    // 为查询错误添加特定的上下文信息
    if (error.details?.queryType === 'query') {
      return `数据加载失败: ${baseMessage}`
    } else if (error.details?.queryType === 'mutation') {
      return `操作执行失败: ${baseMessage}`
    }
    
    return baseMessage
  },

  // 检查错误是否需要显示给用户
  shouldShowToUser: (error: StandardError): boolean => {
    // 网络错误和服务器错误通常需要显示给用户
    if (error.type === ErrorType.NETWORK_ERROR || 
        error.type === ErrorType.SERVER_ERROR) {
      return true
    }
    
    // 认证和授权错误通常已经有专门的处理，不需要额外显示
    if (error.type === ErrorType.AUTHENTICATION_ERROR || 
        error.type === ErrorType.AUTHORIZATION_ERROR) {
      return false
    }
    
    // 验证错误和客户端错误需要显示给用户
    if (error.type === ErrorType.VALIDATION_ERROR || 
        error.type === ErrorType.CLIENT_ERROR || 
        error.type === ErrorType.API_ERROR) {
      return true
    }
    
    // 超时错误需要显示
    if (error.type === ErrorType.TIMEOUT_ERROR) {
      return true
    }
    
    // 其他情况根据严重程度决定
    return error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL
  },
  
  // 创建React Query错误统计信息
  createErrorStats: (errors: StandardError[]) => {
    const stats = {
      total: errors.length,
      byType: {} as Record<ErrorType, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      bySource: {} as Record<string, number>,
      retryableCount: 0,
      networkErrors: 0,
      serverErrors: 0,
      authErrors: 0,
      recentErrors: errors.slice(-10)
    }
    
    errors.forEach(error => {
      // 按类型统计
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1
      
      // 按严重程度统计
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1
      
      // 按来源统计
      const source = error.context?.errorSource || 'unknown'
      stats.bySource[source] = (stats.bySource[source] || 0) + 1
      
      // 特殊统计
      if (error.isRetryable) stats.retryableCount++
      if (error.type === ErrorType.NETWORK_ERROR) stats.networkErrors++
      if (error.type === ErrorType.SERVER_ERROR) stats.serverErrors++
      if (error.type === ErrorType.AUTHENTICATION_ERROR) stats.authErrors++
    })
    
    return stats
  }
}

// 暴露ErrorAnalyzer供外部使用
export { ErrorAnalyzer }

// 主错误处理器别名，保持向后兼容
export const errorHandler = globalErrorHandler