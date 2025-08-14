import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig, InternalAxiosRequestConfig, AxiosHeaders } from 'axios'
import { globalErrorHandler, ErrorType } from './error-handler'

// 业务错误接口
interface BusinessError extends Error {
  code: number
  data: unknown
}

// 增强的请求配置接口
interface EnhancedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _timestamp?: number
  _requestId?: string
  _retryCount?: number
  _retry?: boolean
}

// API配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1'

// 生成唯一请求ID
const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
})

// 请求拦截器 - 自动添加Bearer Token和请求元数据
apiClient.interceptors.request.use(
  (config: EnhancedAxiosRequestConfig) => {
    // 添加时间戳和请求ID用于调试
    config._timestamp = Date.now()
    config._requestId = generateRequestId()
    config._retryCount = config._retryCount || 0

    // 添加请求头
    const token = getToken()
    if (token) {
      if (!config.headers) {
        config.headers = new AxiosHeaders()
      }
      config.headers.Authorization = `Bearer ${token}`
    }

    // 添加请求ID到headers便于追踪
    if (config.headers) {
      config.headers['X-Request-ID'] = config._requestId
      config.headers['X-Request-Timestamp'] = config._timestamp.toString()
    }

    // 在开发环境下记录请求日志
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        requestId: config._requestId,
        timestamp: config._timestamp,
        headers: config.headers,
        data: config.data
      })
    }

    return config
  },
  (error) => {
    console.error('[API Request Error]', error)
    return Promise.reject(error)
  }
)

// 响应拦截器 - 增强错误处理和React Query集成
apiClient.interceptors.response.use(
  (response) => {
    const config = response.config as EnhancedAxiosRequestConfig
    
    // 在开发环境下记录响应日志
    if (process.env.NODE_ENV === 'development') {
      const duration = config._timestamp ? Date.now() - config._timestamp : 0
      console.log(`[API Response] ${config.method?.toUpperCase()} ${config.url}`, {
        requestId: config._requestId,
        status: response.status,
        duration: `${duration}ms`,
        data: response.data
      })
    }

    // 检查业务层错误码
    if (response.data && response.data.code !== undefined && response.data.code !== 0) {
      const businessError = new Error(response.data.message || '请求失败')
      businessError.name = 'BusinessError'
      ;(businessError as BusinessError).code = response.data.code
      ;(businessError as BusinessError).data = response.data

      // 增强错误信息
      const enhancedError = {
        ...businessError,
        response,
        config,
        requestId: config._requestId,
        timestamp: config._timestamp,
        duration: config._timestamp ? Date.now() - config._timestamp : 0
      }

      throw enhancedError
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config as EnhancedAxiosRequestConfig
    const requestId = originalRequest?._requestId
    const timestamp = originalRequest?._timestamp
    const duration = timestamp ? Date.now() - timestamp : 0
    
    // 增强错误对象，添加调试信息
    const enhancedError = {
      ...error,
      requestId,
      timestamp,
      duration,
      retryCount: originalRequest?._retryCount || 0,
      endpoint: originalRequest?.url,
      method: originalRequest?.method?.toUpperCase()
    }

    // 网络错误处理
    if (!error.response) {
      const networkError = await globalErrorHandler.handleNetworkError(enhancedError, {
        url: originalRequest?.url,
        method: originalRequest?.method,
        timeout: originalRequest?.timeout
      })
      
      // 为React Query提供标准化错误格式
      const reactQueryError = new Error(networkError.message)
      reactQueryError.name = 'NetworkError'
      Object.assign(reactQueryError, {
        type: ErrorType.NETWORK_ERROR,
        severity: networkError.severity,
        isRetryable: networkError.isRetryable,
        retryAfter: networkError.retryAfter,
        requestId,
        timestamp,
        duration,
        details: networkError
      })
      
      console.error('[API Network Error]', reactQueryError)
      throw reactQueryError
    }

    const { status, data } = error.response

    // 在开发环境下记录错误响应
    if (process.env.NODE_ENV === 'development') {
      console.error(`[API Error Response] ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
        requestId,
        status,
        duration: `${duration}ms`,
        data,
        error: enhancedError
      })
    }

    // 处理不同的HTTP状态码
    switch (status) {
      case 401:
        // 如果未重试过，尝试刷新Token
        if (!originalRequest._retry) {
          originalRequest._retry = true
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1
          
          try {
            const refreshed = await refreshToken()
            if (refreshed) {
              // 重新设置Authorization头
              const token = getToken()
              if (token && originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`
              }
              
              // 记录重试日志
              if (process.env.NODE_ENV === 'development') {
                console.log(`[API Retry] ${originalRequest.method?.toUpperCase()} ${originalRequest.url}`, {
                  requestId,
                  retryCount: originalRequest._retryCount
                })
              }
              
              return apiClient.request(originalRequest)
            }
          } catch (refreshError) {
            // 刷新失败，处理认证错误
            const authError = await globalErrorHandler.handleApiError(enhancedError, {
              endpoint: originalRequest?.url || '',
              method: originalRequest?.method || '',
              statusCode: status
            })
            
            // 清除tokens并跳转登录页
            clearTokens()
            if (typeof window !== 'undefined') {
              window.location.href = '/login'
            }
            
            // 为React Query提供标准化错误格式
            const reactQueryError = new Error(authError.message)
            reactQueryError.name = 'AuthenticationError'
            Object.assign(reactQueryError, {
              type: ErrorType.AUTHENTICATION_ERROR,
              severity: authError.severity,
              isRetryable: false,
              requestId,
              timestamp,
              duration,
              details: authError
            })
            
            throw reactQueryError
          }
        }
        
        // Token刷新失败或已重试过，处理认证错误
        const authError = await globalErrorHandler.handleApiError(enhancedError, {
          endpoint: originalRequest?.url || '',
          method: originalRequest?.method || '',
          statusCode: status
        })
        
        clearTokens()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        
        // 为React Query提供标准化错误格式
        const reactQueryError = new Error(authError.message)
        reactQueryError.name = 'AuthenticationError'
        Object.assign(reactQueryError, {
          type: ErrorType.AUTHENTICATION_ERROR,
          severity: authError.severity,
          isRetryable: false,
          requestId,
          timestamp,
          duration,
          details: authError
        })
        
        throw reactQueryError

      case 403:
        const forbiddenError = await globalErrorHandler.handleApiError(enhancedError, {
          endpoint: originalRequest?.url || '',
          method: originalRequest?.method || '',
          statusCode: status
        })
        
        const forbiddenReactQueryError = new Error(forbiddenError.message)
        forbiddenReactQueryError.name = 'AuthorizationError'
        Object.assign(forbiddenReactQueryError, {
          type: ErrorType.AUTHORIZATION_ERROR,
          severity: forbiddenError.severity,
          isRetryable: false,
          requestId,
          timestamp,
          duration,
          details: forbiddenError
        })
        
        throw forbiddenReactQueryError

      case 404:
        const notFoundError = await globalErrorHandler.handleApiError(enhancedError, {
          endpoint: originalRequest?.url || '',
          method: originalRequest?.method || '',
          statusCode: status
        })
        
        const notFoundReactQueryError = new Error(notFoundError.message)
        notFoundReactQueryError.name = 'NotFoundError'
        Object.assign(notFoundReactQueryError, {
          type: ErrorType.NOT_FOUND_ERROR,
          severity: notFoundError.severity,
          isRetryable: false,
          requestId,
          timestamp,
          duration,
          details: notFoundError
        })
        
        throw notFoundReactQueryError

      case 422:
        // 表单验证错误，提供详细的验证信息
        const validationReactQueryError = new Error(data?.message || '数据验证失败')
        validationReactQueryError.name = 'ValidationError'
        Object.assign(validationReactQueryError, {
          type: ErrorType.VALIDATION_ERROR,
          severity: 'LOW',
          isRetryable: false,
          validationErrors: data?.errors || {},
          requestId,
          timestamp,
          duration,
          details: {
            statusCode: status,
            response: data,
            endpoint: originalRequest?.url,
            method: originalRequest?.method
          }
        })
        
        throw validationReactQueryError

      case 429:
        const rateLimitError = await globalErrorHandler.handleApiError(enhancedError, {
          endpoint: originalRequest?.url || '',
          method: originalRequest?.method || '',
          statusCode: status
        })
        
        const rateLimitReactQueryError = new Error(rateLimitError.message)
        rateLimitReactQueryError.name = 'RateLimitError'
        Object.assign(rateLimitReactQueryError, {
          type: ErrorType.RATE_LIMIT_ERROR,
          severity: rateLimitError.severity,
          isRetryable: true,
          retryAfter: error.response.headers?.['retry-after'] ? 
                     parseInt(error.response.headers['retry-after']) * 1000 : 60000,
          requestId,
          timestamp,
          duration,
          details: rateLimitError
        })
        
        throw rateLimitReactQueryError

      case 500:
      case 502:
      case 503:
      case 504:
        const serverError = await globalErrorHandler.handleApiError(enhancedError, {
          endpoint: originalRequest?.url || '',
          method: originalRequest?.method || '',
          statusCode: status
        })
        
        const serverReactQueryError = new Error(serverError.message)
        serverReactQueryError.name = 'ServerError'
        Object.assign(serverReactQueryError, {
          type: ErrorType.SERVER_ERROR,
          severity: serverError.severity,
          isRetryable: true,
          retryAfter: 10000,
          requestId,
          timestamp,
          duration,
          details: serverError
        })
        
        throw serverReactQueryError

      default:
        // 其他错误
        const genericError = await globalErrorHandler.handleApiError(enhancedError, {
          endpoint: originalRequest?.url || '',
          method: originalRequest?.method || '',
          statusCode: status
        })
        
        const genericReactQueryError = new Error(genericError.message)
        genericReactQueryError.name = 'ApiError'
        Object.assign(genericReactQueryError, {
          type: ErrorType.API_ERROR,
          severity: genericError.severity,
          isRetryable: status >= 500,
          requestId,
          timestamp,
          duration,
          details: genericError
        })
        
        throw genericReactQueryError
    }
  }
)

// Token管理函数
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('refresh_token')
}

export const setTokens = (accessToken: string, refreshToken?: string): void => {
  if (typeof window === 'undefined') return
  
  // 存储到localStorage
  localStorage.setItem('auth_token', accessToken)
  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken)
  }
  
  // 同时存储到cookie以供中间件使用
  const tokenExpiry = new Date()
  tokenExpiry.setHours(tokenExpiry.getHours() + 24) // 24小时过期
  
  document.cookie = `auth_token=${accessToken}; expires=${tokenExpiry.toUTCString()}; path=/; SameSite=Lax; ${location.protocol === 'https:' ? 'Secure' : ''}`
  
  if (refreshToken) {
    const refreshExpiry = new Date()
    refreshExpiry.setDate(refreshExpiry.getDate() + 7) // 7天过期
    document.cookie = `refresh_token=${refreshToken}; expires=${refreshExpiry.toUTCString()}; path=/; SameSite=Lax; ${location.protocol === 'https:' ? 'Secure' : ''}`
  }
}

export const clearTokens = (): void => {
  if (typeof window === 'undefined') return
  
  // 清除localStorage
  localStorage.removeItem('auth_token')
  localStorage.removeItem('refresh_token')
  
  // 清除cookies
  document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
}

// 刷新Token
export const refreshToken = async (): Promise<boolean> => {
  try {
    const refreshTokenValue = getRefreshToken()
    if (!refreshTokenValue) {
      return false
    }

    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
      headers: {
        Authorization: `Bearer ${refreshTokenValue}`
      }
    })

    if (response.data.code === 0) {
      const { access_token, refresh_token } = response.data.data
      setTokens(access_token, refresh_token)
      return true
    }
    
    return false
  } catch (error) {
    console.error('Token refresh failed:', error)
    return false
  }
}

// API方法 - 增强版本支持更好的错误处理
export const api = {
  // 通用请求方法
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await apiClient.request(config)
      return response.data
    } catch (error: any) {
      // 确保错误已经被响应拦截器处理，直接抛出
      throw error
    }
  },

  // GET请求
  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    try {
      const response: AxiosResponse<T> = await apiClient.get(url, { params })
      return response.data
    } catch (error: any) {
      // 为React Query提供更多上下文信息
      if (error.requestId) {
        error.queryKey = ['GET', url, params]
        error.queryType = 'query'
      }
      throw error
    }
  },

  // POST请求
  async post<T>(url: string, data?: unknown): Promise<T> {
    try {
      const response: AxiosResponse<T> = await apiClient.post(url, data)
      return response.data
    } catch (error: any) {
      // 为React Query提供更多上下文信息
      if (error.requestId) {
        error.mutationKey = ['POST', url]
        error.queryType = 'mutation'
        error.variables = data
      }
      throw error
    }
  },

  // PUT请求
  async put<T>(url: string, data?: unknown): Promise<T> {
    try {
      const response: AxiosResponse<T> = await apiClient.put(url, data)
      return response.data
    } catch (error: any) {
      // 为React Query提供更多上下文信息
      if (error.requestId) {
        error.mutationKey = ['PUT', url]
        error.queryType = 'mutation'
        error.variables = data
      }
      throw error
    }
  },

  // PATCH请求
  async patch<T>(url: string, data?: unknown): Promise<T> {
    try {
      const response: AxiosResponse<T> = await apiClient.patch(url, data)
      return response.data
    } catch (error: any) {
      // 为React Query提供更多上下文信息
      if (error.requestId) {
        error.mutationKey = ['PATCH', url]
        error.queryType = 'mutation'
        error.variables = data
      }
      throw error
    }
  },

  // DELETE请求
  async delete<T>(url: string): Promise<T> {
    try {
      const response: AxiosResponse<T> = await apiClient.delete(url)
      return response.data
    } catch (error: any) {
      // 为React Query提供更多上下文信息
      if (error.requestId) {
        error.mutationKey = ['DELETE', url]
        error.queryType = 'mutation'
      }
      throw error
    }
  },

  // Blob下载（用于文件下载）
  async downloadBlob(url: string, method: 'GET' | 'POST' = 'GET', data?: unknown): Promise<Blob> {
    try {
      const response: AxiosResponse<Blob> = await apiClient.request({
        url,
        method,
        data,
        responseType: 'blob'
      })
      return response.data
    } catch (error: any) {
      // 为React Query提供更多上下文信息
      if (error.requestId) {
        error.queryKey = [method, url, data]
        error.queryType = 'download'
      }
      throw error
    }
  }
}

// React Query集成工具函数
export const reactQueryApiUtils = {
  // 检查错误是否应该重试（用于React Query的retry配置）
  shouldRetry: (error: any, failureCount: number): boolean => {
    // 如果错误有isRetryable属性，使用它
    if (typeof error.isRetryable === 'boolean') {
      return error.isRetryable && failureCount < 3
    }
    
    // 认证和授权错误不重试
    if (error.type === ErrorType.AUTHENTICATION_ERROR || 
        error.type === ErrorType.AUTHORIZATION_ERROR) {
      return false
    }
    
    // 验证错误和客户端错误不重试
    if (error.type === ErrorType.VALIDATION_ERROR || 
        error.type === ErrorType.CLIENT_ERROR) {
      return false
    }
    
    // 404错误不重试
    if (error.type === ErrorType.NOT_FOUND_ERROR) {
      return false
    }
    
    // 网络错误和服务器错误可以重试，最多3次
    return failureCount < 3
  },

  // 获取重试延迟（用于React Query的retryDelay配置）
  getRetryDelay: (failureCount: number, error?: any): number => {
    // 如果错误有retryAfter属性，使用它
    if (error?.retryAfter && typeof error.retryAfter === 'number') {
      return error.retryAfter
    }
    
    // 使用指数退避算法：baseDelay * (2 ^ failureCount) + jitter
    const baseDelay = 1000
    const exponentialDelay = baseDelay * Math.pow(2, failureCount)
    const jitter = Math.random() * 1000 // 添加随机抖动避免雷群效应
    
    return Math.min(exponentialDelay + jitter, 30000) // 最大延迟30秒
  },

  // 提取用户友好的错误消息
  getErrorMessage: (error: any): string => {
    if (error.message) return error.message
    if (error.response?.data?.message) return error.response.data.message
    return '请求失败，请稍后重试'
  },

  // 检查是否为网络错误
  isNetworkError: (error: any): boolean => {
    return error.type === ErrorType.NETWORK_ERROR || !error.response
  },

  // 检查是否为服务器错误
  isServerError: (error: any): boolean => {
    return error.type === ErrorType.SERVER_ERROR || 
           (error.response?.status && error.response.status >= 500)
  },

  // 检查是否为认证错误
  isAuthError: (error: any): boolean => {
    return error.type === ErrorType.AUTHENTICATION_ERROR || 
           error.response?.status === 401
  },

  // 检查是否为权限错误
  isAuthorizationError: (error: any): boolean => {
    return error.type === ErrorType.AUTHORIZATION_ERROR || 
           error.response?.status === 403
  },

  // 检查是否为验证错误
  isValidationError: (error: any): boolean => {
    return error.type === ErrorType.VALIDATION_ERROR || 
           error.response?.status === 422 ||
           error.name === 'ValidationError'
  },

  // 获取验证错误详情
  getValidationErrors: (error: any): Record<string, string[]> => {
    if (error.validationErrors) {
      return error.validationErrors
    }
    if (error.response?.data?.errors) {
      return error.response.data.errors
    }
    return {}
  },

  // 创建React Query友好的错误对象
  createReactQueryError: (error: any, context?: Record<string, any>) => {
    return {
      message: reactQueryApiUtils.getErrorMessage(error),
      type: error.type || 'UNKNOWN_ERROR',
      severity: error.severity || 'MEDIUM',
      isRetryable: error.isRetryable || false,
      retryAfter: error.retryAfter,
      requestId: error.requestId,
      timestamp: error.timestamp,
      duration: error.duration,
      validationErrors: reactQueryApiUtils.getValidationErrors(error),
      originalError: error,
      context: { ...error.context, ...context }
    }
  }
}

// 为了向后兼容，导出一些常用的工具函数
export const { shouldRetry, getRetryDelay, getErrorMessage } = reactQueryApiUtils

export default api