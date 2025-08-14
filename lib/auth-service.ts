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
      const response: AuthResponse = await api.post('/auth/login', credentials)
      
      // 验证响应数据完整性
      if (!response || !response.user || !response.token) {
        throw new ApiError('登录响应数据格式错误', 500)
      }
      
      // 验证用户是否有管理员权限
      if (response.user.role !== 'admin' && response.user.role !== 'system') {
        throw new ApiError('您没有管理员权限，无法访问此系统', 403)
      }
      
      // 验证token数据完整性
      if (!response.token.access_token || !response.token.token_type) {
        throw new ApiError('登录token数据不完整', 500)
      }
      
      return response
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
      
      const response: AuthorizeURLResponse = await api.post('/auth/url', request)
      
      // 验证响应数据完整性
      if (!response || !response.auth_url) {
        throw new ApiError('OAuth授权URL响应数据格式错误', 500)
      }
      
      return response
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

      const response: AuthResponse = await api.post('/auth/token', request)

      // 验证响应数据完整性
      if (!response || !response.user || !response.token) {
        throw new ApiError('OAuth登录响应数据格式错误', 500)
      }
      
      // 验证用户是否有管理员权限
      if (response.user.role !== 'admin' && response.user.role !== 'system') {
        throw new ApiError('您没有管理员权限，无法访问此系统', 403)
      }
      
      // 验证token数据完整性
      if (!response.token.access_token || !response.token.token_type) {
        throw new ApiError('OAuth登录token数据不完整', 500)
      }
      
      return response
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
      const response: string[] = await api.get('/auth/providers')
      
      // 验证响应数据类型
      if (!Array.isArray(response)) {
        console.warn('OAuth提供商列表响应格式不正确:', response)
        return [] // 如果格式不正确，返回空数组
      }
      
      return response
    } catch (error) {
      console.warn('获取OAuth提供商列表失败:', error)
      return []
    }
  }
}

// 导出单例实例
export const authService = AuthService.getInstance()
export default authService