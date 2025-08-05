'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { setTokens, clearTokens, getToken } from '@/lib/api'
import { authService } from '@/lib/auth-service'
import { 
  UserResponse, 
  LoginRequest, 
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
      const userData = await authService.getProfile()
      setUser(userData)
      return true
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
      const authData = await authService.login(credentials)
      
      // 存储认证信息
      setTokens(authData.token.access_token, authData.token.refresh_token)
      setToken(authData.token.access_token)
      setUser(authData.user)
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
      const oauthData = await authService.getOAuthURL(provider)
      // 跳转到第三方授权页面
      window.location.href = oauthData.auth_url
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
      const authData = await authService.exchangeOAuthToken(code, provider || 'google', state)
      
      // 存储认证信息
      setTokens(authData.token.access_token, authData.token.refresh_token)
      setToken(authData.token.access_token)
      setUser(authData.user)
      
      return true
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
      await authService.logout()
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
      const tokenData = await authService.refreshAccessToken()
      setTokens(tokenData.access_token, tokenData.refresh_token)
      setToken(tokenData.access_token)
      return true
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
export const handleOAuthCallback = async (code: string, state?: string, provider?: string) => {
  return await authService.exchangeOAuthToken(code, provider || 'google', state)
}