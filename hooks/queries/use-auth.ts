'use client'

/**
 * 认证查询 Hooks
 * 
 * 基于 React Query 实现的认证数据查询钩子集合
 * 支持用户信息、会话管理、权限验证等功能
 * 遵循统一的缓存策略和错误处理机制
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { authService } from '@/lib/auth-service'
import { queryKeys } from '@/lib/query-keys'
import { createQueryOptions, DataType } from '@/lib/cache-strategies'
import { reactQueryErrorUtils } from '@/lib/error-handler'
import {
  UserResponse,
  AuthorizeURLResponse,
  RefreshTokenResponse,
  StandardResponse
} from '@/lib/types'

// ==================== 类型定义 ====================

/**
 * 用户配置文件查询参数
 */
export interface UseAuthProfileParams {
  enabled?: boolean
  staleTime?: number
}

/**
 * OAuth提供商查询参数
 */
export interface UseOAuthProvidersParams {
  enabled?: boolean
}

/**
 * 权限查询参数
 */
export interface UsePermissionsParams {
  resource?: string
  action?: string
  enabled?: boolean
}

/**
 * 登录历史查询参数
 */
export interface UseLoginHistoryParams {
  userId?: string | number
  limit?: number
  page?: number
  enabled?: boolean
}

// ==================== 认证状态查询 Hooks ====================

/**
 * 获取当前用户配置文件
 */
export const useAuthProfile = (params: UseAuthProfileParams = {}) => {
  const { enabled = true, staleTime = 5 * 60 * 1000 } = params // 默认5分钟缓存
  
  return useQuery({
    queryKey: queryKeys.auth.profile(),
    queryFn: () => authService.getProfile(),
    ...createQueryOptions(DataType.USER, {
      enabled,
      staleTime,
      retry: (failureCount, error) => {
        // 认证失败不重试
        if (error && typeof error === 'object' && 'status' in error) {
          return (error as any).status !== 401 && failureCount < 3
        }
        return failureCount < 3
      },
      select: (data: UserResponse) => ({
        ...data,
        // 增强用户数据
        displayName: data.name || data.email || '未知用户',
        isAdmin: data.role === 'admin' || data.role === 'system',
        isSystemAdmin: data.role === 'system',
        permissions: data.permissions || [],
        
        // 格式化时间显示
        formattedCreatedAt: data.created_at ? new Date(data.created_at).toLocaleDateString() : '未知',
        formattedLastLogin: data.last_login_at ? new Date(data.last_login_at).toLocaleString() : '从未登录',
        
        // 状态指示
        isActive: data.status === 'active',
        statusText: data.status === 'active' ? '活跃' :
                   data.status === 'inactive' ? '未激活' :
                   data.status === 'suspended' ? '已暂停' :
                   data.status === 'banned' ? '已禁用' : '未知',
        statusColor: data.status === 'active' ? 'green' :
                    data.status === 'inactive' ? 'gray' :
                    data.status === 'suspended' ? 'orange' : 'red',
        
        // 角色显示
        roleText: data.role === 'system' ? '系统管理员' :
                 data.role === 'admin' ? '管理员' : '用户',
        roleColor: data.role === 'system' ? 'purple' :
                  data.role === 'admin' ? 'blue' : 'gray'
      }),
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'auth',
          operation: 'profile'
        })
      }
    })
  })
}

/**
 * 获取OAuth提供商列表
 */
export const useOAuthProviders = (params: UseOAuthProvidersParams = {}) => {
  const { enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.auth.providers(),
    queryFn: () => authService.getOAuthProviders(),
    ...createQueryOptions(DataType.CONFIG, {
      enabled,
      staleTime: 10 * 60 * 1000, // 10分钟缓存，提供商列表变化较少
      select: (data: string[]) => {
        // 增强提供商数据
        const providerConfigs = data.map(provider => ({
          id: provider,
          name: provider,
          displayName: getProviderDisplayName(provider),
          icon: getProviderIcon(provider),
          color: getProviderColor(provider),
          description: getProviderDescription(provider),
          isPopular: ['google', 'github', 'microsoft'].includes(provider.toLowerCase())
        }))
        
        // 按流行度排序
        return providerConfigs.sort((a, b) => {
          if (a.isPopular && !b.isPopular) return -1
          if (!a.isPopular && b.isPopular) return 1
          return a.displayName.localeCompare(b.displayName)
        })
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'auth',
          operation: 'providers'
        })
      }
    })
  })
}

/**
 * 获取OAuth授权URL
 */
export const useOAuthURL = (params: { provider: string; redirectUri?: string; enabled?: boolean }) => {
  const { provider, redirectUri, enabled = true } = params
  
  return useQuery({
    queryKey: [...queryKeys.auth.all, 'oauth-url', provider, redirectUri],
    queryFn: () => authService.getOAuthURL(provider, redirectUri),
    ...createQueryOptions(DataType.CONFIG, {
      enabled: enabled && !!provider,
      staleTime: 0, // 不缓存授权URL，每次都重新生成
      cacheTime: 0,
      select: (data: AuthorizeURLResponse) => ({
        ...data,
        // 增强授权URL数据
        providerName: getProviderDisplayName(provider),
        isSecure: data.auth_url.startsWith('https://'),
        hasState: data.auth_url.includes('state='),
        
        // 解析URL参数
        urlParams: new URL(data.auth_url).searchParams,
        
        // 安全检查
        securityScore: calculateUrlSecurityScore(data.auth_url)
      }),
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'auth',
          operation: 'oauth-url',
          params: { provider, redirectUri }
        })
      }
    })
  })
}

// ==================== 权限查询 Hooks ====================

/**
 * 获取用户权限列表
 */
export const usePermissions = (params: UsePermissionsParams = {}) => {
  const { resource, action, enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.auth.permissions(),
    queryFn: async () => {
      // 从用户配置文件中获取权限信息
      const profile = await authService.getProfile()
      return profile.permissions || []
    },
    ...createQueryOptions(DataType.CONFIG, {
      enabled,
      select: (permissions: string[]) => {
        const permissionList = permissions.map(permission => {
          const [res, act] = permission.split(':')
          return {
            id: permission,
            resource: res,
            action: act,
            displayName: formatPermissionDisplayName(res, act),
            category: getPermissionCategory(res),
            level: getPermissionLevel(act)
          }
        })
        
        // 如果指定了资源或操作，进行筛选
        let filteredPermissions = permissionList
        if (resource) {
          filteredPermissions = filteredPermissions.filter(p => p.resource === resource)
        }
        if (action) {
          filteredPermissions = filteredPermissions.filter(p => p.action === action)
        }
        
        // 按类别和级别分组
        const groupedPermissions = filteredPermissions.reduce((groups, permission) => {
          const category = permission.category
          if (!groups[category]) {
            groups[category] = []
          }
          groups[category].push(permission)
          return groups
        }, {} as Record<string, typeof permissionList>)
        
        return {
          all: permissionList,
          filtered: filteredPermissions,
          grouped: groupedPermissions,
          categories: Object.keys(groupedPermissions),
          hasPermission: (res: string, act: string) => 
            permissionList.some(p => p.resource === res && p.action === act)
        }
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'auth',
          operation: 'permissions',
          params: { resource, action }
        })
      }
    })
  })
}

/**
 * 检查特定权限
 */
export const useHasPermission = (resource: string, action: string) => {
  const { data: permissions } = usePermissions({ enabled: !!resource && !!action })
  
  return {
    hasPermission: permissions?.hasPermission(resource, action) ?? false,
    isLoading: !permissions,
    permissions
  }
}

// ==================== 会话管理查询 Hooks ====================

/**
 * 获取用户会话信息
 */
export const useSessions = (params: { enabled?: boolean } = {}) => {
  const { enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.auth.sessions(),
    queryFn: async () => {
      // 这里需要根据实际API来实现获取会话信息的逻辑
      // 暂时返回模拟数据
      const currentSession = {
        id: 'current',
        device: navigator.userAgent,
        ip: 'Unknown',
        location: 'Unknown',
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        isCurrent: true
      }
      return [currentSession]
    },
    ...createQueryOptions(DataType.USER, {
      enabled,
      select: (sessions: any[]) => ({
        sessions: sessions.map(session => ({
          ...session,
          formattedCreatedAt: new Date(session.createdAt).toLocaleString(),
          formattedLastActivity: new Date(session.lastActivity).toLocaleString(),
          deviceInfo: parseUserAgent(session.device),
          duration: Math.floor((Date.now() - new Date(session.createdAt).getTime()) / 1000 / 60) + ' 分钟'
        })),
        currentSession: sessions.find(s => s.isCurrent),
        totalSessions: sessions.length,
        activeSessions: sessions.filter(s => 
          Date.now() - new Date(s.lastActivity).getTime() < 30 * 60 * 1000 // 30分钟内活跃
        ).length
      }),
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'auth',
          operation: 'sessions'
        })
      }
    })
  })
}

/**
 * 获取登录历史
 */
export const useLoginHistory = (params: UseLoginHistoryParams = {}) => {
  const { userId, limit = 20, page = 1, enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.auth.loginHistory(userId),
    queryFn: async () => {
      // 这里需要根据实际API来实现获取登录历史的逻辑
      // 暂时返回模拟数据
      return {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          total_pages: 0
        }
      }
    },
    ...createQueryOptions(DataType.LIST, {
      enabled,
      select: (data: { data: any[]; pagination: any }) => ({
        ...data,
        data: data.data.map(login => ({
          ...login,
          formattedLoginAt: new Date(login.login_at).toLocaleString(),
          deviceInfo: parseUserAgent(login.user_agent),
          success: login.status === 'success',
          statusText: login.status === 'success' ? '成功' : 
                     login.status === 'failed' ? '失败' : 
                     login.status === 'blocked' ? '被阻止' : '未知',
          statusColor: login.status === 'success' ? 'green' :
                      login.status === 'failed' ? 'red' : 
                      login.status === 'blocked' ? 'orange' : 'gray'
        }))
      }),
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'auth',
          operation: 'login-history',
          params: { userId, limit, page }
        })
      }
    })
  })
}

// ==================== 验证查询 Hooks ====================

/**
 * 验证当前认证状态
 */
export const useAuthStatus = (params: { enabled?: boolean } = {}) => {
  const { enabled = true } = params
  
  const profileQuery = useAuthProfile({ enabled })
  
  return {
    isAuthenticated: !!profileQuery.data && !profileQuery.isError,
    isLoading: profileQuery.isLoading,
    user: profileQuery.data,
    error: profileQuery.error,
    refetch: profileQuery.refetch
  }
}

/**
 * 验证管理员权限
 */
export const useAdminStatus = (params: { enabled?: boolean } = {}) => {
  const { enabled = true } = params
  
  const authStatus = useAuthStatus({ enabled })
  
  return {
    isAdmin: authStatus.user?.isAdmin ?? false,
    isSystemAdmin: authStatus.user?.isSystemAdmin ?? false,
    role: authStatus.user?.role,
    canAccessAdmin: authStatus.user?.isAdmin ?? false,
    isLoading: authStatus.isLoading,
    error: authStatus.error
  }
}

// ==================== 工具函数 ====================

/**
 * 获取OAuth提供商显示名称
 */
function getProviderDisplayName(provider: string): string {
  const displayNames: Record<string, string> = {
    google: 'Google',
    github: 'GitHub',
    microsoft: 'Microsoft',
    facebook: 'Facebook',
    twitter: 'Twitter',
    linkedin: 'LinkedIn',
    apple: 'Apple',
    discord: 'Discord',
    telegram: 'Telegram'
  }
  return displayNames[provider.toLowerCase()] || provider
}

/**
 * 获取OAuth提供商图标
 */
function getProviderIcon(provider: string): string {
  const icons: Record<string, string> = {
    google: '🔍',
    github: '🐱',
    microsoft: '🪟',
    facebook: '📘',
    twitter: '🐦',
    linkedin: '💼',
    apple: '🍎',
    discord: '💬',
    telegram: '📨'
  }
  return icons[provider.toLowerCase()] || '🔗'
}

/**
 * 获取OAuth提供商颜色
 */
function getProviderColor(provider: string): string {
  const colors: Record<string, string> = {
    google: '#4285f4',
    github: '#333333',
    microsoft: '#0078d4',
    facebook: '#1877f2',
    twitter: '#1da1f2',
    linkedin: '#0a66c2',
    apple: '#000000',
    discord: '#5865f2',
    telegram: '#0088cc'
  }
  return colors[provider.toLowerCase()] || '#6b7280'
}

/**
 * 获取OAuth提供商描述
 */
function getProviderDescription(provider: string): string {
  const descriptions: Record<string, string> = {
    google: '使用 Google 账号登录',
    github: '使用 GitHub 账号登录',
    microsoft: '使用 Microsoft 账号登录',
    facebook: '使用 Facebook 账号登录',
    twitter: '使用 Twitter 账号登录',
    linkedin: '使用 LinkedIn 账号登录',
    apple: '使用 Apple ID 登录',
    discord: '使用 Discord 账号登录',
    telegram: '使用 Telegram 账号登录'
  }
  return descriptions[provider.toLowerCase()] || `使用 ${provider} 账号登录`
}

/**
 * 计算授权URL安全评分
 */
function calculateUrlSecurityScore(url: string): number {
  let score = 0
  
  if (url.startsWith('https://')) score += 40
  if (url.includes('state=')) score += 20
  if (url.includes('nonce=')) score += 20
  if (url.includes('code_challenge=')) score += 20
  
  return score
}

/**
 * 格式化权限显示名称
 */
function formatPermissionDisplayName(resource: string, action: string): string {
  const resourceNames: Record<string, string> = {
    users: '用户',
    orders: '订单',
    subscriptions: '订阅',
    servers: '服务器',
    tickets: '工单',
    settings: '设置'
  }
  
  const actionNames: Record<string, string> = {
    read: '查看',
    write: '编辑',
    create: '创建',
    delete: '删除',
    manage: '管理'
  }
  
  const resourceName = resourceNames[resource] || resource
  const actionName = actionNames[action] || action
  
  return `${resourceName}${actionName}`
}

/**
 * 获取权限类别
 */
function getPermissionCategory(resource: string): string {
  const categories: Record<string, string> = {
    users: '用户管理',
    orders: '财务管理',
    subscriptions: '订阅管理',
    servers: '服务器管理',
    tickets: '客户支持',
    settings: '系统设置'
  }
  return categories[resource] || '其他'
}

/**
 * 获取权限级别
 */
function getPermissionLevel(action: string): number {
  const levels: Record<string, number> = {
    read: 1,
    write: 2,
    create: 3,
    delete: 4,
    manage: 5
  }
  return levels[action] || 0
}

/**
 * 解析用户代理字符串
 */
function parseUserAgent(userAgent: string) {
  const isWindows = userAgent.includes('Windows')
  const isMac = userAgent.includes('Mac')
  const isLinux = userAgent.includes('Linux')
  const isAndroid = userAgent.includes('Android')
  const isiOS = userAgent.includes('iPhone') || userAgent.includes('iPad')
  
  const isChrome = userAgent.includes('Chrome')
  const isFirefox = userAgent.includes('Firefox')
  const isSafari = userAgent.includes('Safari') && !isChrome
  const isEdge = userAgent.includes('Edge')
  
  return {
    os: isWindows ? 'Windows' :
        isMac ? 'macOS' :
        isLinux ? 'Linux' :
        isAndroid ? 'Android' :
        isiOS ? 'iOS' : 'Unknown',
    browser: isChrome ? 'Chrome' :
             isFirefox ? 'Firefox' :
             isSafari ? 'Safari' :
             isEdge ? 'Edge' : 'Unknown',
    isMobile: isAndroid || isiOS
  }
}

/**
 * 认证查询相关的工具函数
 */
export const authQueryUtils = {
  getProviderDisplayName,
  getProviderIcon,
  getProviderColor,
  getProviderDescription,
  formatPermissionDisplayName,
  parseUserAgent,
  calculateUrlSecurityScore
}

// ==================== 默认导出 ====================

export default {
  // 认证状态
  useAuthProfile,
  useAuthStatus,
  useAdminStatus,
  
  // OAuth相关
  useOAuthProviders,
  useOAuthURL,
  
  // 权限相关
  usePermissions,
  useHasPermission,
  
  // 会话相关
  useSessions,
  useLoginHistory,
  
  // 工具函数
  authQueryUtils
}