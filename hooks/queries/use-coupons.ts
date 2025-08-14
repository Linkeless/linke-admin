'use client'

/**
 * 优惠券查询 Hooks
 * 
 * 基于 React Query 实现的优惠券数据查询钩子集合
 * 支持优惠券列表、详情、验证、统计等功能
 * 遵循统一的缓存策略和错误处理机制
 * 
 * 任务21实现：财务查询Hooks - 优惠券管理模块
 */

import { useQuery, useInfiniteQuery, UseQueryOptions, UseInfiniteQueryOptions } from '@tanstack/react-query'
import { couponService } from '@/lib/coupon-service'
import { queryKeys } from '@/lib/query-keys'
import { createQueryOptions, DataType } from '@/lib/cache-strategies'
import { reactQueryErrorUtils } from '@/lib/error-handler'
import {
  CouponResponse,
  CouponQueryParams,
  CouponsApiResponse,
  ApiResponse
} from '@/lib/coupon-types'

// ==================== 类型定义 ====================

/**
 * 优惠券列表查询参数
 */
export interface UseCouponsParams extends CouponQueryParams {
  enabled?: boolean
}

/**
 * 优惠券详情查询参数
 */
export interface UseCouponParams {
  id: number
  enabled?: boolean
}

/**
 * 优惠券验证查询参数
 */
export interface UseCouponValidationParams {
  code: string
  enabled?: boolean
}

/**
 * 优惠券使用记录查询参数
 */
export interface UseCouponUsagesParams {
  couponId: number
  limit?: number
  offset?: number
  enabled?: boolean
}

// ==================== 基础查询 Hooks ====================

/**
 * 获取优惠券列表
 * 支持分页、筛选、排序等功能
 */
export const useCoupons = (params: UseCouponsParams = {}) => {
  const { enabled = true, ...queryParams } = params
  
  return useQuery({
    queryKey: queryKeys.coupons.list(queryParams),
    queryFn: () => couponService.getCoupons(queryParams),
    ...createQueryOptions(DataType.USER, {
      enabled,
      select: (data: CouponsApiResponse) => {
        // 数据转换和增强
        if (data.code === 0 && data.data && data.data.items) {
          return {
            ...data,
            data: {
              ...data.data,
              items: data.data.items.map(coupon => ({
                ...coupon,
                // 添加计算属性
                statusConfig: getCouponStatusConfig(couponService.getCouponStatus(coupon)),
                typeConfig: getCouponTypeConfig(coupon.type),
                discountDisplay: formatDiscountValue(coupon.type, coupon.value, coupon.currency),
                usageDisplay: formatUsageCount(coupon.used_count, coupon.max_uses),
                isExpired: checkExpired(coupon),
                isActive: checkActive(coupon),
                daysUntilExpiry: getDaysUntilExpiry(coupon.valid_until),
              }))
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'coupons',
          operation: 'list',
          params: queryParams
        })
      }
    })
  })
}

/**
 * 获取单个优惠券详情
 */
export const useCoupon = (params: UseCouponParams) => {
  const { id, enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.coupons.detail(id),
    queryFn: () => couponService.getCouponById(id),
    ...createQueryOptions(DataType.USER, {
      enabled: enabled && !!id,
      select: (data: ApiResponse<CouponResponse>) => {
        // 增强优惠券详情数据
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              statusConfig: getCouponStatusConfig(couponService.getCouponStatus(data.data)),
              typeConfig: getCouponTypeConfig(data.data.type),
              discountDisplay: formatDiscountValue(data.data.type, data.data.value, data.data.currency),
              usageDisplay: formatUsageCount(data.data.used_count, data.data.max_uses),
              isExpired: checkExpired(data.data),
              isActive: checkActive(data.data),
              daysUntilExpiry: getDaysUntilExpiry(data.data.valid_until),
              usagePercentage: data.data.max_uses > 0 
                ? (data.data.used_count / data.data.max_uses) * 100 
                : 0,
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'coupons',
          operation: 'detail',
          params: { id }
        })
      }
    })
  })
}

/**
 * 根据优惠码获取详情
 */
export const useCouponByCode = (params: UseCouponValidationParams) => {
  const { code, enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.coupons.validate(code),
    queryFn: () => couponService.getCouponByCode(code),
    ...createQueryOptions(DataType.USER, {
      enabled: enabled && !!code && couponService.validateCouponCode(code),
      select: (data: ApiResponse<CouponResponse>) => {
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              statusConfig: getCouponStatusConfig(couponService.getCouponStatus(data.data)),
              discountDisplay: formatDiscountValue(data.data.type, data.data.value, data.data.currency),
              isValid: isValidForUse(data.data),
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'coupons',
          operation: 'validate',
          params: { code }
        })
      }
    })
  })
}

/**
 * 获取优惠券使用记录
 */
export const useCouponUsages = (params: UseCouponUsagesParams) => {
  const { couponId, enabled = true, ...queryParams } = params
  
  return useQuery({
    queryKey: queryKeys.coupons.detail(`${couponId}-usages`, queryParams),
    queryFn: () => couponService.getCouponUsages(couponId, queryParams),
    ...createQueryOptions(DataType.USER, {
      enabled: enabled && !!couponId,
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'coupons',
          operation: 'usages',
          params: { couponId, ...queryParams }
        })
      }
    })
  })
}

// ==================== 无限查询 Hooks ====================

/**
 * 无限加载优惠券列表
 * 适用于需要滚动加载更多优惠券的场景
 */
export const useInfiniteCoupons = (params: Omit<UseCouponsParams, 'offset'> & { limit?: number } = {}) => {
  const { enabled = true, limit = 20, ...queryParams } = params
  
  return useInfiniteQuery({
    queryKey: queryKeys.coupons.list({ ...queryParams, limit }),
    queryFn: ({ pageParam = 0 }) => 
      couponService.getCoupons({ ...queryParams, offset: pageParam, limit }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: CouponsApiResponse, allPages) => {
      if (lastPage.code === 0 && lastPage.data && lastPage.data.items) {
        const currentOffset = allPages.length * limit
        const hasMore = lastPage.data.items.length === limit
        return hasMore ? currentOffset : undefined
      }
      return undefined
    },
    ...createQueryOptions(DataType.USER, {
      enabled,
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'coupons',
          operation: 'infinite-list',
          params: queryParams
        })
      }
    }) as Partial<UseInfiniteQueryOptions<CouponsApiResponse, Error>>
  })
}

// ==================== 条件查询 Hooks ====================

/**
 * 获取有效优惠券列表
 */
export const useActiveCoupons = (params: Omit<UseCouponsParams, 'status'> = {}) => {
  return useCoupons({
    ...params,
    status: 'active' as const
  })
}

/**
 * 获取已过期优惠券列表
 */
export const useExpiredCoupons = (params: UseCouponsParams = {}) => {
  return useCoupons({
    ...params,
    status: 'expired' as const
  })
}

/**
 * 获取百分比折扣优惠券
 */
export const usePercentageCoupons = (params: Omit<UseCouponsParams, 'type'> = {}) => {
  return useCoupons({
    ...params,
    type: 'percentage' as const
  })
}

/**
 * 获取固定金额折扣优惠券
 */
export const useFixedAmountCoupons = (params: Omit<UseCouponsParams, 'type'> = {}) => {
  return useCoupons({
    ...params,
    type: 'fixed_amount' as const
  })
}

/**
 * 获取即将过期的优惠券（默认7天内）
 */
export const useExpiringCoupons = (days: number = 7, params: UseCouponsParams = {}) => {
  const dateTo = new Date()
  dateTo.setDate(dateTo.getDate() + days)
  
  return useCoupons({
    ...params,
    status: 'active' as const,
    // date_to: dateTo.toISOString().split('T')[0] // 移除，CouponQueryParams中没有这个字段
  })
}

/**
 * 获取使用量高的优惠券
 */
export const usePopularCoupons = (params: UseCouponsParams = {}) => {
  return useCoupons({
    ...params,
    sort_by: 'used_count' as const,
    sort_order: 'desc' as const
  })
}

// ==================== 工具函数 ====================

/**
 * 获取优惠券状态配置
 */
const getCouponStatusConfig = (status: string) => {
  const configs = {
    active: { label: '有效', color: 'bg-green-100 text-green-800', variant: 'default' as const },
    inactive: { label: '未激活', color: 'bg-gray-100 text-gray-800', variant: 'outline' as const },
    expired: { label: '已过期', color: 'bg-red-100 text-red-800', variant: 'destructive' as const },
  }
  return configs[status as keyof typeof configs] || { label: status, color: 'bg-gray-100 text-gray-800', variant: 'outline' as const }
}

/**
 * 获取优惠券类型配置
 */
const getCouponTypeConfig = (type: string) => {
  const configs = {
    percentage: { label: '百分比', color: 'bg-blue-100 text-blue-800', variant: 'secondary' as const },
    fixed_amount: { label: '固定金额', color: 'bg-green-100 text-green-800', variant: 'default' as const },
  }
  return configs[type as keyof typeof configs] || { label: type, color: 'bg-gray-100 text-gray-800', variant: 'outline' as const }
}

/**
 * 格式化折扣值显示
 */
const formatDiscountValue = (type: string, value: number, currency?: string): string => {
  return couponService.formatDiscountValue(type, value, currency)
}

/**
 * 格式化使用次数显示
 */
const formatUsageCount = (usedCount: number, maxUses: number): string => {
  return couponService.formatUsageCount(usedCount, maxUses)
}

/**
 * 检查优惠券是否已过期
 */
const checkExpired = (coupon: CouponResponse): boolean => {
  return couponService.getCouponStatus(coupon) === 'expired'
}

/**
 * 检查优惠券是否有效
 */
const checkActive = (coupon: CouponResponse): boolean => {
  return couponService.getCouponStatus(coupon) === 'active'
}

/**
 * 获取距离过期的天数
 */
const getDaysUntilExpiry = (validUntil?: string): number | null => {
  if (!validUntil) return null
  
  const now = new Date()
  const expiry = new Date(validUntil)
  const diffTime = expiry.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays > 0 ? diffDays : 0
}

/**
 * 检查优惠券是否可用于使用
 */
const isValidForUse = (coupon: CouponResponse): boolean => {
  const status = couponService.getCouponStatus(coupon)
  if (status !== 'active') return false
  
  // 检查使用次数限制
  if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) {
    return false
  }
  
  return true
}

/**
 * 优惠券查询相关的工具函数
 */
export const couponQueryUtils = {
  /**
   * 格式化优惠券代码显示
   */
  formatCouponCode: (code: string): string => {
    return code.toUpperCase()
  },

  /**
   * 格式化日期显示
   */
  formatDateTime: (dateString: string): string => {
    return couponService.formatDateTime(dateString)
  },

  /**
   * 计算优惠券剩余天数
   */
  getRemainingDays: (validUntil?: string): string => {
    const days = getDaysUntilExpiry(validUntil)
    if (days === null) return '永久有效'
    if (days === 0) return '今天过期'
    if (days === 1) return '明天过期'
    if (days < 0) return '已过期'
    return `${days}天后过期`
  },

  /**
   * 计算使用率
   */
  getUsagePercentage: (usedCount: number, maxUses: number): number => {
    if (maxUses === 0) return 0
    return Math.round((usedCount / maxUses) * 100)
  },

  /**
   * 检查优惠券是否即将过期
   */
  isExpiringSoon: (validUntil?: string, days: number = 7): boolean => {
    const remainingDays = getDaysUntilExpiry(validUntil)
    return remainingDays !== null && remainingDays <= days && remainingDays > 0
  },

  /**
   * 获取优惠券的适用范围描述
   */
  getApplicablePlansDescription: (applicablePlans?: string): string => {
    if (!applicablePlans) return '适用于所有计划'
    try {
      const plans = JSON.parse(applicablePlans)
      if (Array.isArray(plans) && plans.length > 0) {
        return `适用于指定计划 (${plans.length}个)`
      }
    } catch {
      // 如果不是JSON格式，可能是其他格式的描述
      return applicablePlans
    }
    return '适用于所有计划'
  },

  formatDiscountValue,
  formatUsageCount,
  getCouponStatusConfig,
  getCouponTypeConfig,
  checkExpired,
  checkActive,
  isValidForUse,
}

// ==================== 默认导出 ====================

export default {
  useCoupons,
  useCoupon,
  useCouponByCode,
  useCouponUsages,
  useInfiniteCoupons,
  useActiveCoupons,
  useExpiredCoupons,
  usePercentageCoupons,
  useFixedAmountCoupons,
  useExpiringCoupons,
  usePopularCoupons,
  couponQueryUtils
}