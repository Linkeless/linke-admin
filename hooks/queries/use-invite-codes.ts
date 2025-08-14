'use client'

/**
 * 邀请码查询 Hooks
 * 
 * 基于 React Query 实现的邀请码数据查询钩子集合
 * 支持邀请码列表、详情、统计、使用记录等功能
 * 遵循统一的缓存策略和错误处理机制
 * 
 * 任务34实现：快速迁移推荐系统 - 邀请码管理模块
 */

import { useQuery, useInfiniteQuery, UseQueryOptions, UseInfiniteQueryOptions } from '@tanstack/react-query'
import { inviteCodeService } from '@/lib/invite-code-service'
import { queryKeys } from '@/lib/query-keys'
import { createQueryOptions, DataType } from '@/lib/cache-strategies'
import { reactQueryErrorUtils } from '@/lib/error-handler'
import {
  InviteCodeResponse,
  InviteCodeQueryParams,
  InviteCodeStatsResponse,
  InviteCodeUsageResponse,
  InviteCodeUsageQueryParams,
  InviteCodesApiResponse,
  InviteCodeUsagesApiResponse,
  ApiResponse
} from '@/lib/invite-code-types'

// ==================== 类型定义 ====================

/**
 * 邀请码列表查询参数
 */
export interface UseInviteCodesParams extends InviteCodeQueryParams {
  enabled?: boolean
}

/**
 * 邀请码详情查询参数
 */
export interface UseInviteCodeParams {
  id: number
  enabled?: boolean
}

/**
 * 邀请码统计查询参数
 */
export interface UseInviteCodeStatsParams {
  enabled?: boolean
}

/**
 * 通过邀请码获取详情参数
 */
export interface UseInviteCodeByCodeParams {
  code: string
  enabled?: boolean
}

/**
 * 用户邀请码查询参数
 */
export interface UseUserInviteCodesParams extends InviteCodeQueryParams {
  userId: number
  enabled?: boolean
}

/**
 * 邀请码使用记录查询参数
 */
export interface UseInviteCodeUsagesParams extends InviteCodeUsageQueryParams {
  enabled?: boolean
}

// ==================== 基础查询 Hooks ====================

/**
 * 获取邀请码列表
 * 支持分页、筛选、排序等功能
 */
export const useInviteCodes = (params: UseInviteCodesParams = {}) => {
  const { enabled = true, ...queryParams } = params
  
  return useQuery({
    queryKey: queryKeys.inviteCodes.list(queryParams),
    queryFn: () => inviteCodeService.getInviteCodes(queryParams),
    ...createQueryOptions(DataType.USER, {
      enabled,
      select: (data: InviteCodesApiResponse) => {
        // 数据转换和增强
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: data.data.map(inviteCode => ({
              ...inviteCode,
              // 添加计算属性
              statusConfig: getInviteCodeStatusConfig(inviteCode.status),
              usageRate: calculateUsageRate(inviteCode.used_count, inviteCode.max_uses),
              isExpired: checkInviteCodeExpired(inviteCode),
              isNearLimit: checkInviteCodeNearLimit(inviteCode),
              canUse: checkInviteCodeCanUse(inviteCode),
              remainingDays: getRemainingDays(inviteCode.valid_until),
              formattedValidPeriod: formatValidPeriod(inviteCode.valid_from, inviteCode.valid_until),
              usageProgress: calculateUsageProgress(inviteCode.used_count, inviteCode.max_uses),
            }))
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'invite-codes',
          operation: 'list',
          params: queryParams
        })
      }
    })
  })
}

/**
 * 获取单个邀请码详情
 */
export const useInviteCode = (params: UseInviteCodeParams) => {
  const { id, enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.inviteCodes.detail(id),
    queryFn: () => inviteCodeService.getInviteCode(id),
    ...createQueryOptions(DataType.USER, {
      enabled: enabled && !!id,
      select: (data: ApiResponse<InviteCodeResponse>) => {
        // 增强邀请码详情数据
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              statusConfig: getInviteCodeStatusConfig(data.data.status),
              usageRate: calculateUsageRate(data.data.used_count, data.data.max_uses),
              isExpired: checkInviteCodeExpired(data.data),
              isNearLimit: checkInviteCodeNearLimit(data.data),
              canUse: checkInviteCodeCanUse(data.data),
              remainingDays: getRemainingDays(data.data.valid_until),
              formattedValidPeriod: formatValidPeriod(data.data.valid_from, data.data.valid_until),
              usageProgress: calculateUsageProgress(data.data.used_count, data.data.max_uses),
              canEdit: canEditInviteCode(data.data),
              canDelete: canDeleteInviteCode(data.data),
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'invite-codes',
          operation: 'detail',
          params: { id }
        })
      }
    })
  })
}

/**
 * 获取邀请码统计数据
 */
export const useInviteCodeStats = (params: UseInviteCodeStatsParams = {}) => {
  const { enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.inviteCodes.stats(),
    queryFn: () => inviteCodeService.getInviteCodeStats(),
    ...createQueryOptions(DataType.STATS, {
      enabled,
      select: (data: ApiResponse<InviteCodeStatsResponse>) => {
        // 统计数据格式化和计算
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              // 添加格式化的统计数据
              totalCodesFormatted: formatNumber(data.data.total_codes),
              totalUsesFormatted: formatNumber(data.data.total_uses),
              totalRegistrationsFormatted: formatNumber(data.data.total_registrations),
              activeRate: data.data.total_codes > 0 
                ? ((data.data.active_codes / data.data.total_codes) * 100).toFixed(1) + '%'
                : '0%',
              usageRate: data.data.total_codes > 0 
                ? ((data.data.total_uses / data.data.total_codes) * 100).toFixed(1) + '%'
                : '0%',
              conversionRate: data.data.total_uses > 0 
                ? ((data.data.total_registrations / data.data.total_uses) * 100).toFixed(1) + '%'
                : '0%',
              averageUsesPerCode: data.data.total_codes > 0 
                ? (data.data.total_uses / data.data.total_codes).toFixed(1)
                : '0',
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'invite-codes',
          operation: 'stats'
        })
      }
    })
  })
}

/**
 * 通过邀请码获取详情
 */
export const useInviteCodeByCode = (params: UseInviteCodeByCodeParams) => {
  const { code, enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.inviteCodes.validate(code),
    queryFn: async () => {
      // 通过列表查询找到对应的邀请码
      const response = await inviteCodeService.getInviteCodes({ search: code, limit: 1 })
      if (response.code === 0 && response.data && response.data.length > 0) {
        const inviteCode = response.data.find(item => item.code === code)
        if (inviteCode) {
          return {
            code: 0,
            message: 'success',
            data: inviteCode
          } as ApiResponse<InviteCodeResponse>
        }
      }
      return {
        code: 404,
        message: '邀请码不存在',
        data: null
      } as ApiResponse<InviteCodeResponse>
    },
    ...createQueryOptions(DataType.USER, {
      enabled: enabled && !!code,
      select: (data: ApiResponse<InviteCodeResponse>) => {
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              statusConfig: getInviteCodeStatusConfig(data.data.status),
              canUse: checkInviteCodeCanUse(data.data),
              remainingUses: data.data.is_unlimited ? null : data.data.remaining_uses,
              isExpired: checkInviteCodeExpired(data.data),
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'invite-codes',
          operation: 'validate',
          params: { code }
        })
      }
    })
  })
}

/**
 * 获取指定用户的邀请码列表
 */
export const useUserInviteCodes = (params: UseUserInviteCodesParams) => {
  const { userId, enabled = true, ...queryParams } = params
  
  return useQuery({
    queryKey: queryKeys.inviteCodes.byCreator(userId),
    queryFn: () => inviteCodeService.getInviteCodes({ 
      ...queryParams, 
      // 假设可以通过created_by字段过滤用户的邀请码
      // 如果API不支持此字段，需要在客户端过滤
    }),
    ...createQueryOptions(DataType.USER, {
      enabled: enabled && !!userId,
      select: (data: InviteCodesApiResponse) => {
        if (data.code === 0 && data.data) {
          // 在客户端过滤用户创建的邀请码
          const userCodes = data.data.filter(code => code.created_by === userId)
          return {
            ...data,
            data: userCodes.map(inviteCode => ({
              ...inviteCode,
              statusConfig: getInviteCodeStatusConfig(inviteCode.status),
              usageRate: calculateUsageRate(inviteCode.used_count, inviteCode.max_uses),
              canUse: checkInviteCodeCanUse(inviteCode),
            })),
            total: userCodes.length
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'invite-codes',
          operation: 'by-user',
          params: { userId, ...queryParams }
        })
      }
    })
  })
}

/**
 * 获取邀请码使用记录
 */
export const useInviteCodeUsages = (params: UseInviteCodeUsagesParams = {}) => {
  const { enabled = true, ...queryParams } = params
  
  return useQuery({
    queryKey: [...queryKeys.inviteCodes.all, 'usages', { filters: queryParams }],
    queryFn: () => inviteCodeService.getInviteCodeUsages(queryParams),
    ...createQueryOptions(DataType.USER, {
      enabled,
      select: (data: InviteCodeUsagesApiResponse) => {
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: data.data.map(usage => ({
              ...usage,
              formattedUsedAt: formatDateTime(usage.used_at),
              relativeTime: formatRelativeTime(usage.used_at),
              isRecent: isRecentUsage(usage.used_at),
            }))
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'invite-codes',
          operation: 'usages',
          params: queryParams
        })
      }
    })
  })
}

// ==================== 无限查询 Hooks ====================

/**
 * 无限加载邀请码列表
 * 适用于需要滚动加载更多邀请码的场景
 */
export const useInfiniteInviteCodes = (params: Omit<UseInviteCodesParams, 'offset'> & { limit?: number } = {}) => {
  const { enabled = true, limit = 20, ...queryParams } = params
  
  return useInfiniteQuery({
    queryKey: queryKeys.inviteCodes.list({ ...queryParams, limit }),
    queryFn: ({ pageParam = 0 }) => 
      inviteCodeService.getInviteCodes({ ...queryParams, offset: pageParam, limit }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: InviteCodesApiResponse, allPages) => {
      if (lastPage.code === 0 && lastPage.data) {
        const currentOffset = allPages.length * limit
        const hasMore = lastPage.data.length === limit
        return hasMore ? currentOffset : undefined
      }
      return undefined
    },
    ...createQueryOptions(DataType.USER, {
      enabled,
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'invite-codes',
          operation: 'infinite-list',
          params: queryParams
        })
      }
    }) as Partial<UseInfiniteQueryOptions<InviteCodesApiResponse, Error>>
  })
}

// ==================== 条件查询 Hooks ====================

/**
 * 获取活跃的邀请码列表
 */
export const useActiveInviteCodes = (params: Omit<UseInviteCodesParams, 'status'> = {}) => {
  return useInviteCodes({
    ...params,
    status: 'active' as const
  })
}

/**
 * 获取已过期的邀请码列表
 */
export const useExpiredInviteCodes = (params: Omit<UseInviteCodesParams, 'status'> = {}) => {
  return useInviteCodes({
    ...params,
    status: 'expired' as const
  })
}

/**
 * 获取不活跃的邀请码列表
 */
export const useInactiveInviteCodes = (params: Omit<UseInviteCodesParams, 'status'> = {}) => {
  return useInviteCodes({
    ...params,
    status: 'inactive' as const
  })
}

/**
 * 获取无限制使用的邀请码
 */
export const useUnlimitedInviteCodes = (params: UseInviteCodesParams = {}) => {
  return useQuery({
    queryKey: queryKeys.inviteCodes.list({ ...params, is_unlimited: true }),
    queryFn: () => inviteCodeService.getInviteCodes({ ...params, is_unlimited: true }),
    ...createQueryOptions(DataType.USER, {
      enabled: params.enabled !== false,
      select: (data: InviteCodesApiResponse) => {
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: data.data.map(inviteCode => ({
              ...inviteCode,
              statusConfig: getInviteCodeStatusConfig(inviteCode.status),
              canUse: checkInviteCodeCanUse(inviteCode),
            }))
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'invite-codes',
          operation: 'unlimited',
          params
        })
      }
    })
  })
}

/**
 * 获取即将过期的邀请码（7天内过期）
 */
export const useExpiringInviteCodes = (days: number = 7, params: UseInviteCodesParams = {}) => {
  return useQuery({
    queryKey: queryKeys.inviteCodes.list({ ...params, expiring_days: days }),
    queryFn: async () => {
      const response = await inviteCodeService.getInviteCodes({ ...params, status: 'active' })
      if (response.code === 0 && response.data) {
        // 在客户端过滤即将过期的邀请码
        const now = new Date()
        const daysLater = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
        
        const expiringCodes = response.data.filter(code => {
          if (!code.valid_until) return false
          const expireDate = new Date(code.valid_until)
          return expireDate >= now && expireDate <= daysLater
        })
        
        return {
          ...response,
          data: expiringCodes,
          total: expiringCodes.length
        }
      }
      return response
    },
    ...createQueryOptions(DataType.USER, {
      enabled: params.enabled !== false,
      select: (data: InviteCodesApiResponse) => {
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: data.data.map(inviteCode => ({
              ...inviteCode,
              statusConfig: getInviteCodeStatusConfig(inviteCode.status),
              remainingDays: getRemainingDays(inviteCode.valid_until),
              urgencyLevel: getExpiryUrgencyLevel(inviteCode.valid_until),
            }))
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'invite-codes',
          operation: 'expiring',
          params: { days, ...params }
        })
      }
    })
  })
}

// ==================== 工具函数 ====================

/**
 * 获取邀请码状态配置
 */
const getInviteCodeStatusConfig = (status: string) => {
  const configs = {
    active: { label: '活跃', color: 'bg-green-100 text-green-800', variant: 'default' as const },
    inactive: { label: '禁用', color: 'bg-gray-100 text-gray-800', variant: 'secondary' as const },
    expired: { label: '已过期', color: 'bg-red-100 text-red-800', variant: 'destructive' as const },
  }
  return configs[status as keyof typeof configs] || { label: status, color: 'bg-gray-100 text-gray-800', variant: 'outline' as const }
}

/**
 * 计算使用率
 */
const calculateUsageRate = (usedCount: number, maxUses: number): number => {
  if (maxUses <= 0) return 0
  return Math.round((usedCount / maxUses) * 100)
}

/**
 * 计算使用进度
 */
const calculateUsageProgress = (usedCount: number, maxUses: number): { current: number; max: number; percentage: number } => {
  return {
    current: usedCount,
    max: maxUses,
    percentage: calculateUsageRate(usedCount, maxUses)
  }
}

/**
 * 检查邀请码是否已过期
 */
const checkInviteCodeExpired = (inviteCode: InviteCodeResponse): boolean => {
  if (!inviteCode.valid_until) return false
  return new Date(inviteCode.valid_until) < new Date()
}

/**
 * 检查邀请码是否接近使用限制
 */
const checkInviteCodeNearLimit = (inviteCode: InviteCodeResponse): boolean => {
  if (inviteCode.is_unlimited) return false
  return inviteCode.remaining_uses <= 5
}

/**
 * 检查邀请码是否可用
 */
const checkInviteCodeCanUse = (inviteCode: InviteCodeResponse): boolean => {
  if (inviteCode.status !== 'active') return false
  if (checkInviteCodeExpired(inviteCode)) return false
  if (!inviteCode.is_unlimited && inviteCode.remaining_uses <= 0) return false
  return true
}

/**
 * 获取剩余天数
 */
const getRemainingDays = (validUntil?: string): number | null => {
  if (!validUntil) return null
  const now = new Date()
  const expireDate = new Date(validUntil)
  const diffTime = expireDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
}

/**
 * 格式化有效期显示
 */
const formatValidPeriod = (validFrom?: string, validUntil?: string): string => {
  if (!validFrom && !validUntil) return '永久有效'
  if (!validFrom) return `有效至 ${formatDate(validUntil!)}`
  if (!validUntil) return `自 ${formatDate(validFrom)} 起有效`
  return `${formatDate(validFrom)} 至 ${formatDate(validUntil)}`
}

/**
 * 格式化数字
 */
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('zh-CN').format(num)
}

/**
 * 格式化时间显示
 */
const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * 格式化日期显示
 */
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * 格式化相对时间
 */
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) {
    return '刚刚'
  } else if (diffMins < 60) {
    return `${diffMins}分钟前`
  } else if (diffHours < 24) {
    return `${diffHours}小时前`
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return formatDateTime(dateString)
  }
}

/**
 * 检查是否为最近使用
 */
const isRecentUsage = (usedAt: string): boolean => {
  const date = new Date(usedAt)
  const now = new Date()
  const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  return diffHours < 24
}

/**
 * 获取过期紧急程度
 */
const getExpiryUrgencyLevel = (validUntil?: string): 'high' | 'medium' | 'low' => {
  const remainingDays = getRemainingDays(validUntil)
  if (remainingDays === null) return 'low'
  if (remainingDays <= 1) return 'high'
  if (remainingDays <= 3) return 'medium'
  return 'low'
}

/**
 * 检查邀请码是否可编辑
 */
const canEditInviteCode = (inviteCode: InviteCodeResponse): boolean => {
  // 已过期或已禁用的邀请码仍然可以编辑状态和有效期
  return true
}

/**
 * 检查邀请码是否可删除
 */
const canDeleteInviteCode = (inviteCode: InviteCodeResponse): boolean => {
  // 未使用或使用次数较少的邀请码可以删除
  return inviteCode.used_count === 0 || inviteCode.status === 'inactive'
}

/**
 * 邀请码查询相关的工具函数
 */
export const inviteCodeQueryUtils = {
  formatDateTime,
  formatDate,
  formatRelativeTime,
  formatNumber,
  getInviteCodeStatusConfig,
  calculateUsageRate,
  checkInviteCodeExpired,
  checkInviteCodeNearLimit,
  checkInviteCodeCanUse,
  getRemainingDays,
  formatValidPeriod,
}

// ==================== 默认导出 ====================

export default {
  useInviteCodes,
  useInviteCode,
  useInviteCodeStats,
  useInviteCodeByCode,
  useUserInviteCodes,
  useInviteCodeUsages,
  useInfiniteInviteCodes,
  useActiveInviteCodes,
  useExpiredInviteCodes,
  useInactiveInviteCodes,
  useUnlimitedInviteCodes,
  useExpiringInviteCodes,
  inviteCodeQueryUtils
}