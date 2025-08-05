import axios, { AxiosInstance, AxiosResponse } from 'axios'

// 业务错误接口
interface BusinessError extends Error {
  code: number
  data: unknown
}

// API配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1'

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 自动添加Bearer Token
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理认证错误和自动刷新Token
apiClient.interceptors.response.use(
  (response) => {
    // 检查业务层错误码
    if (response.data && response.data.code !== undefined && response.data.code !== 0) {
      const error = new Error(response.data.message || '请求失败')
      error.name = 'BusinessError'
      ;(error as BusinessError).code = response.data.code
      ;(error as BusinessError).data = response.data
      throw error
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    // 网络错误处理
    if (!error.response) {
      console.error('网络错误:', error.message)
      throw new Error('网络连接失败，请检查网络设置')
    }

    const { status, data } = error.response

    // 处理不同的HTTP状态码
    switch (status) {
      case 401:
        // 如果未重试过，尝试刷新Token
        if (!originalRequest._retry) {
          originalRequest._retry = true
          
          try {
            const refreshed = await refreshToken()
            if (refreshed) {
              // 重新设置Authorization头
              const token = getToken()
              if (token) {
                originalRequest.headers.Authorization = `Bearer ${token}`
              }
              return apiClient.request(originalRequest)
            }
          } catch (refreshError) {
            // 刷新失败，清除tokens并跳转登录页
            clearTokens()
            if (typeof window !== 'undefined') {
              window.location.href = '/login'
            }
            throw new Error('认证失败，请重新登录')
          }
        }
        
        // Token刷新失败或已重试过
        clearTokens()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        throw new Error('认证失败，请重新登录')

      case 403:
        throw new Error(data?.message || '权限不足，无法访问此资源')

      case 404:
        throw new Error(data?.message || '请求的资源不存在')

      case 422:
        // 表单验证错误
        throw {
          name: 'ValidationError',
          message: data?.message || '数据验证失败',
          errors: data?.errors || {},
        }

      case 429:
        throw new Error('请求过于频繁，请稍后再试')

      case 500:
        throw new Error(data?.message || '服务器内部错误，请稍后再试')

      case 502:
      case 503:
      case 504:
        throw new Error('服务暂时不可用，请稍后再试')

      default:
        throw new Error(data?.message || `请求失败 (${status})`)
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

// API方法
export const api = {
  // 通用请求方法
  async request<T>(config: unknown): Promise<T> {
    const response: AxiosResponse<T> = await apiClient.request(config)
    return response.data
  },

  // GET请求
  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response: AxiosResponse<T> = await apiClient.get(url, { params })
    return response.data
  },

  // POST请求
  async post<T>(url: string, data?: unknown): Promise<T> {
    const response: AxiosResponse<T> = await apiClient.post(url, data)
    return response.data
  },

  // PUT请求
  async put<T>(url: string, data?: unknown): Promise<T> {
    const response: AxiosResponse<T> = await apiClient.put(url, data)
    return response.data
  },

  // PATCH请求
  async patch<T>(url: string, data?: unknown): Promise<T> {
    const response: AxiosResponse<T> = await apiClient.patch(url, data)
    return response.data
  },

  // DELETE请求
  async delete<T>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await apiClient.delete(url)
    return response.data
  },

  // Blob下载（用于文件下载）
  async downloadBlob(url: string, method: 'GET' | 'POST' = 'GET', data?: unknown): Promise<Blob> {
    const response: AxiosResponse<Blob> = await apiClient.request({
      url,
      method,
      data,
      responseType: 'blob'
    })
    return response.data
  }
}

export default api