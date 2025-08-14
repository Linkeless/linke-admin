import { api } from './api'
import {
  StandardResponse,
  LoginRequest,
  AuthResponse,
  UserResponse,
  AuthorizeURLRequest,
  AuthorizeURLResponse,
  TokenExchangeRequest,
  RefreshTokenResponse,
  ApiError
} from './types'

/**
 * 管理员认证服务
 * 提供完整的认证功能，包括本地登录、OAuth登录、token管理等
 */
export class AuthService {
  private static instance: AuthService
  
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  /**
   * 本地账户登录
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response: StandardResponse<AuthResponse> = await api.post('/auth/login', credentials)
      
      if (response.code === 0 && response.data) {
        // 验证用户是否有管理员权限
        if (response.data.user.role !== 'admin' && response.data.user.role !== 'system') {
          throw new ApiError('您没有管理员权限，无法访问此系统', 403)
        }
        
        return response.data
      } else {
        throw new ApiError(response.message || '登录失败', response.code || 500)
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError('登录失败，请稍后重试', 500)
    }
  }

  /**
   * 获取OAuth授权URL
   */
  async getOAuthURL(provider: string, redirectUri?: string): Promise<AuthorizeURLResponse> {
    try {
      const request: AuthorizeURLRequest = {
        provider,
        redirect_uri: redirectUri || `${window.location.origin}/auth/callback?provider=${provider}`,
      }
      
      const response: StandardResponse<AuthorizeURLResponse> = await api.post('/auth/url', request)
      
      if (response.code === 0 && response.data) {
        return response.data
      } else {
        throw new ApiError(response.message || 'OAuth授权URL获取失败', response.code || 500)
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(`${provider} 授权失败`, 500)
    }
  }

  /**
   * OAuth token交换
   */
  async exchangeOAuthToken(code: string, provider: string, state?: string): Promise<AuthResponse> {
    try {
      const request: TokenExchangeRequest = {
        code,
        provider,
        state,
      }

      const response: StandardResponse<AuthResponse> = await api.post('/auth/token', request)

      if (response.code === 0 && response.data) {
        // 验证用户是否有管理员权限
        if (response.data.user.role !== 'admin' && response.data.user.role !== 'system') {
          throw new ApiError('您没有管理员权限，无法访问此系统', 403)
        }
        
        return response.data
      } else {
        throw new ApiError(response.message || 'OAuth登录失败', response.code || 500)
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError('OAuth登录处理失败', 500)
    }
  }

  /**
   * 获取用户配置文件
   */
  async getProfile(): Promise<UserResponse> {
    try {
      const response: StandardResponse<UserResponse> = await api.get('/auth/profile')
      
      if (response.code === 0 && response.data) {
        return response.data
      } else {
        throw new ApiError(response.message || '获取用户信息失败', response.code || 500)
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError('获取用户信息失败', 500)
    }
  }

  /**
   * 刷新访问令牌
   */
  async refreshAccessToken(): Promise<RefreshTokenResponse> {
    try {
      const response: StandardResponse<RefreshTokenResponse> = await api.post('/auth/refresh')
      
      if (response.code === 0 && response.data) {
        return response.data
      } else {
        throw new ApiError(response.message || 'Token刷新失败', response.code || 500)
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError('Token刷新失败', 500)
    }
  }

  /**
   * 登出
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      // 登出错误可以静默处理，因为即使服务器端登出失败，客户端也会清除本地token
      console.warn('服务器端登出失败:', error)
    }
  }

  /**
   * 修改密码
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const response: StandardResponse<void> = await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      })
      
      if (response.code !== 0) {
        throw new ApiError(response.message || '密码修改失败', response.code || 500)
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError('密码修改失败', 500)
    }
  }

  /**
   * 获取支持的OAuth提供商列表
   */
  async getOAuthProviders(): Promise<string[]> {
    try {
      const response: StandardResponse<string[]> = await api.get('/auth/providers')
      
      if (response.code === 0 && response.data) {
        return response.data
      } else {
        return [] // 如果获取失败，返回空数组
      }
    } catch (error) {
      console.warn('获取OAuth提供商列表失败:', error)
      return []
    }
  }
}

// 导出单例实例
export const authService = AuthService.getInstance()
export default authService