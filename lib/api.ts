import axios, { AxiosInstance, AxiosResponse } from 'axios'

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
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // 如果是401错误且未重试过，尝试刷新Token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const refreshed = await refreshToken()
        if (refreshed) {
          // 重试原请求
          const token = getToken()
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`
          }
          return apiClient.request(originalRequest)
        }
      } catch (refreshError) {
        // 刷新失败，跳转到登录页
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
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
  localStorage.setItem('auth_token', accessToken)
  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken)
  }
}

export const clearTokens = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem('auth_token')
  localStorage.removeItem('refresh_token')
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
  async request<T>(config: any): Promise<T> {
    const response: AxiosResponse<T> = await apiClient.request(config)
    return response.data
  },

  // GET请求
  async get<T>(url: string, params?: any): Promise<T> {
    const response: AxiosResponse<T> = await apiClient.get(url, { params })
    return response.data
  },

  // POST请求
  async post<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await apiClient.post(url, data)
    return response.data
  },

  // PUT请求
  async put<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await apiClient.put(url, data)
    return response.data
  },

  // PATCH请求
  async patch<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await apiClient.patch(url, data)
    return response.data
  },

  // DELETE请求
  async delete<T>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await apiClient.delete(url)
    return response.data
  }
}

export default api