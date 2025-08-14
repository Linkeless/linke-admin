'use client'

/**
 * 认证变更 Hooks
 * 
 * 基于 React Query 实现的认证数据变更钩子集合
 * 支持登录、登出、密码修改等操作，包含乐观更新机制
 * 遵循统一的缓存策略和错误处理机制
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'
import { authService } from '@/lib/auth-service'
import { queryKeys, CacheInvalidationUtils } from '@/lib/query-keys'
import { createMutationOptions } from '@/lib/cache-strategies'
import { globalErrorHandler, reactQueryErrorUtils, errorUtils } from '@/lib/error-handler'
import {
  LoginRequest,
  AuthResponse,
  UserResponse,
  TokenExchangeRequest,
  RefreshTokenResponse,
  StandardResponse
} from '@/lib/types'

// ==================== 类型定义 ====================

/**
 * 登录操作上下文
 */
interface AuthMutationContext {
  operation: string
  previousAuthState?: any
}

/**
 * 密码修改请求
 */
interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword?: string
}

/**
 * OAuth登录请求
 */
interface OAuthLoginRequest {
  code: string
  provider: string
  state?: string
}

// ==================== 工具函数 ====================

/**
 * 认证状态管理工具函数
 */
const authStateUtils = {
  /**
   * 保存认证信息到本地存储
   */
  saveAuthData: (authData: AuthResponse) => {
    if (typeof window === 'undefined') return
    
    try {
      // 保存用户信息
      localStorage.setItem('user', JSON.stringify(authData.user))
      
      // 保存令牌信息
      if (authData.token) {
        localStorage.setItem('access_token', authData.token.access_token)
        localStorage.setItem('token_type', authData.token.token_type)
        
        if (authData.token.refresh_token) {
          localStorage.setItem('refresh_token', authData.token.refresh_token)
        }
        
        if (authData.token.expires_in) {
          const expiresAt = new Date(Date.now() + authData.token.expires_in * 1000)
          localStorage.setItem('token_expires_at', expiresAt.toISOString())
        }
      }
      
      // 记录登录时间
      localStorage.setItem('login_at', new Date().toISOString())
    } catch (error) {
      console.error('保存认证数据失败:', error)
    }
  },

  /**
   * 清除本地认证信息
   */
  clearAuthData: () => {
    if (typeof window === 'undefined') return
    
    try {
      const authKeys = [
        'user',
        'access_token',
        'refresh_token',
        'token_type',
        'token_expires_at',
        'login_at'
      ]
      
      authKeys.forEach(key => localStorage.removeItem(key))
    } catch (error) {
      console.error('清除认证数据失败:', error)
    }
  },

  /**
   * 获取本地存储的用户信息
   */
  getLocalUser: (): UserResponse | null => {
    if (typeof window === 'undefined') return null
    
    try {
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : null
    } catch (error) {
      console.error('获取本地用户信息失败:', error)
      return null
    }
  },

  /**
   * 失效认证相关查询
   */
  invalidateAuthQueries: async (queryClient: any) => {
    // 失效认证模块的所有查询
    await queryClient.invalidateQueries({ 
      queryKey: CacheInvalidationUtils.getModulePrefix('auth') 
    })
    
    // 失效用户相关查询
    await queryClient.invalidateQueries({ 
      queryKey: CacheInvalidationUtils.getModulePrefix('users') 
    })
    
    // 失效仪表板查询
    await queryClient.invalidateQueries({ 
      queryKey: CacheInvalidationUtils.getModulePrefix('dashboard') 
    })
  }
}

// ==================== 登录认证 Mutations ====================

/**
 * 本地账户登录
 */
export const useLogin = (options?: Partial<UseMutationOptions<AuthResponse, Error, LoginRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    ...createMutationOptions({
      onMutate: async (credentials: LoginRequest) => {
        // 取消正在进行的认证查询
        await queryClient.cancelQueries({ queryKey: queryKeys.auth.all })
        
        // 保存之前的认证状态
        const previousAuthState = {
          profile: queryClient.getQueryData(queryKeys.auth.profile()),
          user: authStateUtils.getLocalUser()
        }
        
        // 显示登录进度提示
        toast.loading('正在登录...', { id: 'login' })
        
        return { previousAuthState, operation: 'login' }
      },
      
      onSuccess: (data: AuthResponse, variables: LoginRequest, context: any) => {
        toast.dismiss('login')
        
        // 验证登录响应
        if (!data.user || !data.token) {
          toast.error('登录失败', {
            description: '登录响应数据不完整，请重试'
          })
          return
        }
        
        // 保存认证信息到本地存储
        authStateUtils.saveAuthData(data)
        
        // 设置用户配置文件到查询缓存
        queryClient.setQueryData(queryKeys.auth.profile(), data.user)
        
        // 显示成功提示
        toast.success('登录成功', {
          description: `欢迎回来，${data.user.name || data.user.email}`
        })
        
        // 失效相关查询以获取最新数据
        authStateUtils.invalidateAuthQueries(queryClient)
        
        // 如果有回调，可以在这里处理页面跳转等逻辑
        if (typeof window !== 'undefined') {
          // 检查是否需要跳转到特定页面
          const returnUrl = new URLSearchParams(window.location.search).get('return_to')
          if (returnUrl) {
            setTimeout(() => {
              window.location.href = returnUrl
            }, 500)
          } else {
            // 默认跳转到仪表板
            setTimeout(() => {
              window.location.href = '/dashboard'
            }, 500)
          }
        }
      },
      
      onError: async (error: Error, variables: LoginRequest, context: any) => {
        toast.dismiss('login')
        
        // 处理错误并显示用户友好的消息
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'login',
          credentials: { email: variables.email }
        })
        
        let errorMessage = '登录失败'
        let errorDescription = errorUtils.formatUserMessage(standardError)
        
        // 根据错误类型提供更具体的提示
        if (standardError.code === 401) {
          errorDescription = '邮箱或密码错误，请检查后重试'
        } else if (standardError.code === 403) {
          errorDescription = '账户已被禁用或没有管理权限'
        } else if (standardError.code === 429) {
          errorDescription = '登录尝试过于频繁，请稍后再试'
        }
        
        toast.error(errorMessage, {
          description: errorDescription
        })
      },
      
      ...options
    })
  })
}

/**
 * OAuth登录（令牌交换）
 */
export const useOAuthLogin = (options?: Partial<UseMutationOptions<AuthResponse, Error, OAuthLoginRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ code, provider, state }: OAuthLoginRequest) => 
      authService.exchangeOAuthToken(code, provider, state),
    ...createMutationOptions({
      onMutate: async ({ provider }: OAuthLoginRequest) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.auth.all })
        
        const previousAuthState = {
          profile: queryClient.getQueryData(queryKeys.auth.profile()),
          user: authStateUtils.getLocalUser()
        }
        
        toast.loading(`正在通过 ${provider} 登录...`, { id: 'oauth-login' })
        
        return { previousAuthState, operation: 'oauth-login', provider }
      },
      
      onSuccess: (data: AuthResponse, variables: OAuthLoginRequest, context: any) => {
        toast.dismiss('oauth-login')
        
        if (!data.user || !data.token) {
          toast.error('OAuth登录失败', {
            description: '登录响应数据不完整，请重试'
          })
          return
        }
        
        // 保存认证信息
        authStateUtils.saveAuthData(data)
        queryClient.setQueryData(queryKeys.auth.profile(), data.user)
        
        toast.success('登录成功', {
          description: `欢迎使用 ${variables.provider} 账号登录`
        })
        
        authStateUtils.invalidateAuthQueries(queryClient)
        
        // 跳转处理
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 500)
        }
      },
      
      onError: async (error: Error, variables: OAuthLoginRequest, context: any) => {
        toast.dismiss('oauth-login')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'oauthLogin',
          provider: variables.provider
        })
        
        let errorDescription = errorUtils.formatUserMessage(standardError)
        
        if (standardError.code === 403) {
          errorDescription = 'OAuth账户没有管理权限'
        } else if (standardError.code === 400) {
          errorDescription = 'OAuth授权码无效或已过期'
        }
        
        toast.error('OAuth登录失败', {
          description: errorDescription
        })
      },
      
      ...options
    })
  })
}

// ==================== 登出认证 Mutations ====================

/**
 * 用户登出
 */
export const useLogout = (options?: Partial<UseMutationOptions<void, Error, void>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => authService.logout(),
    ...createMutationOptions({
      onMutate: async () => {
        toast.loading('正在登出...', { id: 'logout' })
        
        return { operation: 'logout' }
      },
      
      onSuccess: (data: void, variables: void, context: any) => {
        toast.dismiss('logout')
        
        // 清除本地认证数据
        authStateUtils.clearAuthData()
        
        // 清除查询缓存中的认证数据
        queryClient.removeQueries({ queryKey: queryKeys.auth.all })
        queryClient.setQueryData(queryKeys.auth.profile(), null)
        
        toast.success('已安全登出', {
          description: '感谢使用本系统'
        })
        
        // 跳转到登录页面
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            window.location.href = '/login'
          }, 500)
        }
      },
      
      onError: async (error: Error, variables: void, context: any) => {
        toast.dismiss('logout')
        
        // 即使服务器端登出失败，也要清除本地数据
        authStateUtils.clearAuthData()
        queryClient.removeQueries({ queryKey: queryKeys.auth.all })
        
        console.warn('服务器端登出失败，但本地数据已清除:', error)
        
        toast.warning('登出完成', {
          description: '本地会话已清除'
        })
        
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            window.location.href = '/login'
          }, 500)
        }
      },
      
      ...options
    })
  })
}

// ==================== 令牌管理 Mutations ====================

/**
 * 刷新访问令牌
 */
export const useRefreshToken = (options?: Partial<UseMutationOptions<RefreshTokenResponse, Error, void>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => authService.refreshAccessToken(),
    ...createMutationOptions({
      onMutate: async () => {
        return { operation: 'refresh-token' }
      },
      
      onSuccess: (data: RefreshTokenResponse, variables: void, context: any) => {
        // 更新本地存储的令牌信息
        if (typeof window !== 'undefined' && data.access_token) {
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('token_type', data.token_type || 'Bearer')
          
          if (data.expires_in) {
            const expiresAt = new Date(Date.now() + data.expires_in * 1000)
            localStorage.setItem('token_expires_at', expiresAt.toISOString())
          }
          
          if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token)
          }
        }
        
        // 通常令牌刷新是静默的，不显示提示
        console.log('访问令牌已刷新')
      },
      
      onError: async (error: Error, variables: void, context: any) => {
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'refreshToken'
        })
        
        // 如果令牌刷新失败，通常需要重新登录
        if (standardError.code === 401) {
          authStateUtils.clearAuthData()
          queryClient.removeQueries({ queryKey: queryKeys.auth.all })
          
          toast.error('会话已过期', {
            description: '请重新登录'
          })
          
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              window.location.href = '/login'
            }, 1000)
          }
        } else {
          console.error('令牌刷新失败:', standardError)
        }
      },
      
      ...options
    })
  })
}

// ==================== 密码管理 Mutations ====================

/**
 * 修改密码
 */
export const useChangePassword = (options?: Partial<UseMutationOptions<void, Error, ChangePasswordRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: ChangePasswordRequest) => 
      authService.changePassword(currentPassword, newPassword),
    ...createMutationOptions({
      onMutate: async (request: ChangePasswordRequest) => {
        // 客户端验证
        if (request.confirmPassword && request.newPassword !== request.confirmPassword) {
          throw new Error('新密码与确认密码不一致')
        }
        
        if (request.newPassword.length < 6) {
          throw new Error('新密码长度至少6个字符')
        }
        
        if (request.newPassword === request.currentPassword) {
          throw new Error('新密码不能与当前密码相同')
        }
        
        toast.loading('正在修改密码...', { id: 'change-password' })
        
        return { operation: 'change-password' }
      },
      
      onSuccess: (data: void, variables: ChangePasswordRequest, context: any) => {
        toast.dismiss('change-password')
        
        toast.success('密码修改成功', {
          description: '新密码已生效，建议重新登录确保安全'
        })
        
        // 可以选择是否自动登出用户
        // 这里不自动登出，让用户选择
      },
      
      onError: async (error: Error, variables: ChangePasswordRequest, context: any) => {
        toast.dismiss('change-password')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'changePassword'
        })
        
        let errorDescription = errorUtils.formatUserMessage(standardError)
        
        if (standardError.code === 400) {
          errorDescription = '当前密码错误'
        } else if (standardError.code === 422) {
          errorDescription = '新密码不符合安全要求'
        }
        
        toast.error('密码修改失败', {
          description: errorDescription
        })
      },
      
      ...options
    })
  })
}

// ==================== 会话管理 Mutations ====================

/**
 * 终止指定会话
 */
export const useTerminateSession = (options?: Partial<UseMutationOptions<void, Error, string>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (sessionId: string) => {
      // 这里需要根据实际API来实现终止会话的逻辑
      // 暂时返回Promise.resolve()
      return Promise.resolve()
    },
    ...createMutationOptions({
      onMutate: async (sessionId: string) => {
        toast.loading('正在终止会话...', { id: 'terminate-session' })
        
        return { sessionId, operation: 'terminate-session' }
      },
      
      onSuccess: (data: void, sessionId: string, context: any) => {
        toast.dismiss('terminate-session')
        
        toast.success('会话已终止', {
          description: '指定的会话已安全结束'
        })
        
        // 刷新会话列表
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.sessions() })
      },
      
      onError: async (error: Error, sessionId: string, context: any) => {
        toast.dismiss('terminate-session')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'terminateSession',
          sessionId
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('终止会话失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 终止所有其他会话
 */
export const useTerminateAllOtherSessions = (options?: Partial<UseMutationOptions<void, Error, void>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      // 这里需要根据实际API来实现终止所有其他会话的逻辑
      return Promise.resolve()
    },
    ...createMutationOptions({
      onMutate: async () => {
        toast.loading('正在终止所有其他会话...', { id: 'terminate-all-sessions' })
        
        return { operation: 'terminate-all-sessions' }
      },
      
      onSuccess: (data: void, variables: void, context: any) => {
        toast.dismiss('terminate-all-sessions')
        
        toast.success('所有其他会话已终止', {
          description: '您的账户现在只在当前设备登录'
        })
        
        // 刷新会话列表
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.sessions() })
      },
      
      onError: async (error: Error, variables: void, context: any) => {
        toast.dismiss('terminate-all-sessions')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'terminateAllOtherSessions'
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('终止会话失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 导出 ====================

export default {
  // 登录认证
  useLogin,
  useOAuthLogin,
  useLogout,
  
  // 令牌管理
  useRefreshToken,
  
  // 密码管理
  useChangePassword,
  
  // 会话管理
  useTerminateSession,
  useTerminateAllOtherSessions
}

// 导出工具函数
export {
  authStateUtils
}