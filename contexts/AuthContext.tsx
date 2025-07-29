'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api, setTokens, clearTokens, getToken } from '@/lib/api'
import { 
  UserResponse, 
  LoginRequest, 
  AuthResponse, 
  AuthorizeURLRequest, 
  AuthorizeURLResponse,
  TokenExchangeRequest,
  StandardResponse,
  ApiError 
} from '@/lib/types'

interface AuthContextType {
  user: UserResponse | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  loginWithOAuth: (provider: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // 初始化认证状态
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = getToken()
        if (savedToken) {
          setToken(savedToken)
          // 验证token有效性并获取用户信息
          await validateToken()
        }
      } catch (error) {
        clearTokens()
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  // 验证token并获取用户信息
  const validateToken = async () => {
    try {
      const response: StandardResponse<UserResponse> = await api.get('/auth/profile')
      if (response.code === 0 && response.data) {
        setUser(response.data)
        return true
      } else {
        throw new Error(response.message || 'Failed to get user profile')
      }
    } catch (error) {
      clearTokens()
      setToken(null)
      setUser(null)
      return false
    }
  }

  // 本地账户登录
  const login = async (credentials: LoginRequest) => {
    try {
      const response: StandardResponse<AuthResponse> = await api.post('/auth/login', credentials)
      
      if (response.code === 0 && response.data) {
        const { token: tokenData, user: userData } = response.data
        
        // 存储认证信息
        setTokens(tokenData.access_token, tokenData.refresh_token)
        setToken(tokenData.access_token)
        setUser(userData)
      } else {
        throw new ApiError(response.message || '登录失败', response.code)
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError('登录失败，请稍后重试', 500)
    }
  }

  // OAuth登录
  const loginWithOAuth = async (provider: string) => {
    try {
      const urlRequest: AuthorizeURLRequest = {
        provider,
        redirect_uri: `${window.location.origin}/auth/callback?provider=${provider}`,
      }
      
      const response: StandardResponse<AuthorizeURLResponse> = await api.post('/auth/url', urlRequest)
      
      if (response.code === 0 && response.data) {
        // 跳转到第三方授权页面
        window.location.href = response.data.auth_url
      } else {
        throw new ApiError(response.message || 'OAuth登录失败', response.code)
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(`${provider} 登录失败`, 500)
    }
  }

  // 处理OAuth回调
  const handleOAuthCallback = async (code: string, state?: string, provider?: string) => {
    try {
      const tokenRequest: TokenExchangeRequest = {
        code,
        provider: provider || 'google',
        state,
      }

      const response: StandardResponse<AuthResponse> = await api.post('/auth/token', tokenRequest)

      if (response.code === 0 && response.data) {
        const { token: tokenData, user: userData } = response.data
        
        // 存储认证信息
        setTokens(tokenData.access_token, tokenData.refresh_token)
        setToken(tokenData.access_token)
        setUser(userData)
        
        return true
      } else {
        throw new ApiError(response.message || 'OAuth登录失败', response.code)
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError('OAuth登录处理失败', 500)
    }
  }

  // 登出
  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      // Logout error handled silently
    } finally {
      setUser(null)
      setToken(null)
      clearTokens()
    }
  }

  // Token刷新
  const refreshToken = async () => {
    try {
      const response: StandardResponse<{ access_token: string }> = await api.post('/auth/refresh')
      
      if (response.code === 0 && response.data) {
        const newToken = response.data.access_token
        setTokens(newToken)
        setToken(newToken)
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  const contextValue: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    loginWithOAuth,
    logout,
    refreshToken,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// 导出OAuth回调处理函数供外部使用
export const handleOAuthCallback = async (code: string, state?: string, provider?: string): Promise<AuthResponse> => {
  const tokenRequest: TokenExchangeRequest = {
    code, 
    provider: provider || 'google',
    state,
  }

  const response: StandardResponse<AuthResponse> = await api.post('/auth/token', tokenRequest)

  if (response.code === 0 && response.data) {
    return response.data
  } else {
    throw new ApiError(response.message || 'OAuth登录失败', response.code)
  }
}