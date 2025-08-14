'use client'

/**
 * 用户查询 Hooks
 * 
 * 基于 React Query 实现的用户数据查询钩子集合
 * 支持用户列表、详情、搜索、按提供商筛选等功能
 * 遵循统一的缓存策略和错误处理机制
 */

import { useQuery, useInfiniteQuery, UseQueryOptions, UseInfiniteQueryOptions } from '@tanstack/react-query'
import { userService } from '@/lib/user-service'
import { queryKeys } from '@/lib/query-keys'
import { createQueryOptions, DataType } from '@/lib/cache-strategies'
import { reactQueryErrorUtils } from '@/lib/error-handler'
import {
  UserListResponse,
  UserDetailResponse,
  UserSearchResponse,
  UserProviderFilterResponse,
  UserSearchParams,
  UserStatsResponse,
  UserResponse
} from '@/lib/user-types'
import { StandardResponse } from '@/lib/types'

// ==================== 类型定义 ====================

/**
 * 用户列表查询参数
 */
export interface UseUsersParams extends UserSearchParams {
  enabled?: boolean
}

/**
 * 用户详情查询参数
 */
export interface UseUserParams {
  id: number | string
  enabled?: boolean
}

/**
 * 用户搜索查询参数
 */
export interface UseUserSearchParams extends UserSearchParams {
  q?: string
  enabled?: boolean
}

/**
 * 按提供商筛选用户参数
 */
export interface UseUsersByProviderParams {
  provider: string
  page?: number
  limit?: number
  enabled?: boolean
}

// ==================== 基础查询 Hooks ====================

/**
 * 获取用户列表
 * 支持分页、筛选、排序等功能
 */
export const useUsers = (params: UseUsersParams = {}) => {
  const { enabled = true, ...queryParams } = params
  
  return useQuery({
    queryKey: queryKeys.users.list(queryParams),
    queryFn: () => userService.getUsers(queryParams),
    ...createQueryOptions(DataType.USER, {
      enabled,
      select: (data: UserListResponse) => {
        // 数据转换和增强
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              items: data.data.items.map(user => ({
                ...user,
                // 添加计算属性
                displayName: userService.formatUserDisplayName(user),
                avatarUrl: userService.getUserAvatarUrl(user),
                providers: userService.getUserProviders(user),
                statusConfig: userService.getUserStatusBadgeConfig(user.status),
                roleConfig: userService.getUserRoleBadgeConfig(user.role),
              }))
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'users',
          operation: 'list',
          params: queryParams
        })
      }
    })
  })
}

/**
 * 获取已删除用户列表
 */
export const useDeletedUsers = (params: { page?: number; limit?: number; enabled?: boolean } = {}) => {
  const { enabled = true, ...queryParams } = params
  
  return useQuery({
    queryKey: queryKeys.users.list({ ...queryParams, status: 'deleted' }),
    queryFn: () => userService.getDeletedUsers(queryParams),
    ...createQueryOptions(DataType.USER, {
      enabled,
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'users',
          operation: 'deleted-list',
          params: queryParams
        })
      }
    })
  })
}

/**
 * 获取单个用户详情
 */
export const useUser = (params: UseUserParams) => {
  const { id, enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => userService.getUser(Number(id)),
    ...createQueryOptions(DataType.USER, {
      enabled: enabled && !!id,
      select: (data: UserDetailResponse) => {
        // 增强用户详情数据
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              displayName: userService.formatUserDisplayName(data.data),
              avatarUrl: userService.getUserAvatarUrl(data.data),
              providers: userService.getUserProviders(data.data),
              statusConfig: userService.getUserStatusBadgeConfig(data.data.status),
              roleConfig: userService.getUserRoleBadgeConfig(data.data.role),
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'users',
          operation: 'detail',
          params: { id }
        })
      }
    })
  })
}

// ==================== 搜索和筛选 Hooks ====================

/**
 * 搜索用户
 * 支持按姓名、邮箱、用户名等字段搜索
 */
export const useUserSearch = (params: UseUserSearchParams) => {
  const { enabled = true, ...searchParams } = params
  
  return useQuery({
    queryKey: queryKeys.users.search(searchParams.q || '', searchParams),
    queryFn: () => userService.searchUsers(searchParams),
    ...createQueryOptions(DataType.USER, {
      enabled: enabled && !!searchParams.q,
      select: (data: UserSearchResponse) => {
        // 搜索结果数据增强
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              items: data.data.items.map(user => ({
                ...user,
                displayName: userService.formatUserDisplayName(user),
                avatarUrl: userService.getUserAvatarUrl(user),
                providers: userService.getUserProviders(user),
                statusConfig: userService.getUserStatusBadgeConfig(user.status),
                roleConfig: userService.getUserRoleBadgeConfig(user.role),
              }))
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'users',
          operation: 'search',
          params: searchParams
        })
      }
    })
  })
}

/**
 * 按OAuth提供商筛选用户
 */
export const useUsersByProvider = (params: UseUsersByProviderParams) => {
  const { enabled = true, ...filterParams } = params
  
  return useQuery({
    queryKey: queryKeys.users.list({ provider: filterParams.provider, ...filterParams }),
    queryFn: () => userService.getUsersByProvider(filterParams),
    ...createQueryOptions(DataType.USER, {
      enabled: enabled && !!filterParams.provider,
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'users',
          operation: 'filter-by-provider',
          params: filterParams
        })
      }
    })
  })
}

// ==================== 统计数据 Hooks ====================

/**
 * 获取用户统计数据
 */
export const useUserStats = (options?: { enabled?: boolean }) => {
  const { enabled = true } = options || {}
  
  return useQuery({
    queryKey: queryKeys.users.stats(),
    queryFn: () => userService.getUserStats(),
    ...createQueryOptions(DataType.STATS, {
      enabled,
      select: (data: StandardResponse<UserStatsResponse>) => {
        // 统计数据可以在这里进行格式化和计算
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'users',
          operation: 'stats'
        })
      }
    })
  })
}

// ==================== 无限查询 Hooks ====================

/**
 * 无限加载用户列表
 * 适用于需要滚动加载更多用户的场景
 */
export const useInfiniteUsers = (params: Omit<UseUsersParams, 'page'> & { limit?: number } = {}) => {
  const { enabled = true, limit = 20, ...queryParams } = params
  
  return useInfiniteQuery({
    queryKey: queryKeys.users.list({ ...queryParams, limit }),
    queryFn: ({ pageParam = 1 }) => 
      userService.getUsers({ ...queryParams, page: pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: UserListResponse) => {
      if (lastPage.code === 0 && lastPage.data) {
        const { pagination } = lastPage.data
        const currentPage = pagination.page || 1
        const totalPages = pagination.total_pages || Math.ceil(pagination.total / pagination.limit)
        
        return currentPage < totalPages ? currentPage + 1 : undefined
      }
      return undefined
    },
    ...createQueryOptions(DataType.USER, {
      enabled,
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'users',
          operation: 'infinite-list',
          params: queryParams
        })
      }
    }) as Partial<UseInfiniteQueryOptions<UserListResponse, Error>>
  })
}

// ==================== 条件查询 Hooks ====================

/**
 * 获取活跃用户列表
 */
export const useActiveUsers = (params: Omit<UseUsersParams, 'status'> = {}) => {
  return useUsers({
    ...params,
    status: 'active'
  })
}

/**
 * 获取管理员用户列表
 */
export const useAdminUsers = (params: Omit<UseUsersParams, 'role'> = {}) => {
  return useUsers({
    ...params,
    role: 'admin'
  })
}

/**
 * 获取最近注册的用户
 */
export const useRecentUsers = (days: number = 7, params: UseUsersParams = {}) => {
  const dateFrom = new Date()
  dateFrom.setDate(dateFrom.getDate() - days)
  
  return useUsers({
    ...params,
    date_from: dateFrom.toISOString().split('T')[0],
    sort_by: 'created_at',
    sort_order: 'desc'
  })
}

// ==================== 批量查询 Hooks ====================

/**
 * 批量获取多个用户详情
 * 使用 Promise.all 并行获取，适用于需要同时获取多个用户信息的场景
 */
export const useUsersById = (userIds: (number | string)[], options?: { enabled?: boolean }) => {
  const { enabled = true } = options || {}
  
  return useQuery({
    queryKey: ['users', 'batch', userIds.sort()],
    queryFn: async () => {
      const users = await Promise.all(
        userIds.map(id => userService.getUser(Number(id)))
      )
      return users.filter(user => user.code === 0)
    },
    ...createQueryOptions(DataType.USER, {
      enabled: enabled && userIds.length > 0,
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'users',
          operation: 'batch-details',
          params: { userIds }
        })
      }
    })
  })
}

// ==================== 工具函数 ====================

/**
 * 用户查询相关的工具函数
 */
export const userQueryUtils = {
  /**
   * 检查用户是否可编辑
   */
  canEditUser: (user: UserResponse, currentUserRole: string): boolean => {
    return userService.canEditUser(user, currentUserRole)
  },

  /**
   * 检查用户是否可删除
   */
  canDeleteUser: (user: UserResponse, currentUserRole: string): boolean => {
    return userService.canDeleteUser(user, currentUserRole)
  },

  /**
   * 格式化用户显示名称
   */
  formatDisplayName: (user: UserResponse): string => {
    return userService.formatUserDisplayName(user)
  },

  /**
   * 获取用户头像URL
   */
  getAvatarUrl: (user: UserResponse): string => {
    return userService.getUserAvatarUrl(user)
  },

  /**
   * 格式化时间显示
   */
  formatDateTime: (dateString: string): string => {
    return userService.formatDateTime(dateString)
  },

  /**
   * 验证邮箱格式
   */
  validateEmail: (email: string): boolean => {
    return userService.validateEmail(email)
  },

  /**
   * 验证用户名格式
   */
  validateUsername: (username: string): boolean => {
    return userService.validateUsername(username)
  }
}

// ==================== 默认导出 ====================

export default {
  useUsers,
  useDeletedUsers,
  useUser,
  useUserSearch,
  useUsersByProvider,
  useUserStats,
  useInfiniteUsers,
  useActiveUsers,
  useAdminUsers,
  useRecentUsers,
  useUsersById,
  userQueryUtils
}