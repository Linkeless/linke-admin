'use client'

/**
 * 订单查询 Hooks
 * 
 * 基于 React Query 实现的订单数据查询钩子集合
 * 支持订单列表、详情、统计、分析等功能
 * 遵循统一的缓存策略和错误处理机制
 * 
 * 任务21实现：财务查询Hooks - 订单管理模块
 */

import { useQuery, useInfiniteQuery, UseQueryOptions, UseInfiniteQueryOptions } from '@tanstack/react-query'
import { orderService } from '@/lib/order-service'
import { queryKeys } from '@/lib/query-keys'
import { createQueryOptions, DataType } from '@/lib/cache-strategies'
import { reactQueryErrorUtils } from '@/lib/error-handler'
import {
  SubscriptionOrderResponse,
  OrderQueryParams,
  OrderStatsResponse,
  OrderAnalyticsParams,
  OrdersApiResponse,
  ApiResponse
} from '@/lib/order-types'

// ==================== 类型定义 ====================

/**
 * 订单列表查询参数
 */
export interface UseOrdersParams extends OrderQueryParams {
  enabled?: boolean
}

/**
 * 订单详情查询参数
 */
export interface UseOrderParams {
  id: number
  enabled?: boolean
}

/**
 * 订单统计查询参数
 */
export interface UseOrderAnalyticsParams extends OrderAnalyticsParams {
  enabled?: boolean
}

/**
 * 用户订单查询参数
 */
export interface UseMyOrdersParams {
  limit?: number
  offset?: number
  enabled?: boolean
}

// ==================== 基础查询 Hooks ====================

/**
 * 获取订单列表 (管理员)
 * 支持分页、筛选、排序等功能
 */
export const useOrders = (params: UseOrdersParams = {}) => {
  const { enabled = true, ...queryParams } = params
  
  return useQuery({
    queryKey: queryKeys.orders.list(queryParams),
    queryFn: () => orderService.getOrders(queryParams),
    ...createQueryOptions(DataType.USER, {
      enabled,
      select: (data: OrdersApiResponse) => {
        // 数据转换和增强
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: data.data.map(order => ({
              ...order,
              // 添加计算属性
              statusConfig: getOrderStatusConfig(order.status),
              paymentMethodLabel: formatPaymentMethod(order.payment_method),
              totalAmount: formatCurrency(order.amount, order.currency),
              discountDisplay: formatDiscount(order.discount_amount, order.discount_type, order.discount_value),
              isRefundable: checkRefundable(order),
            }))
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'orders',
          operation: 'list',
          params: queryParams
        })
      }
    })
  })
}

/**
 * 获取单个订单详情 (管理员)
 */
export const useOrder = (params: UseOrderParams) => {
  const { id, enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => orderService.getOrderById(id),
    ...createQueryOptions(DataType.USER, {
      enabled: enabled && !!id,
      select: (data: ApiResponse<SubscriptionOrderResponse>) => {
        // 增强订单详情数据
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              statusConfig: getOrderStatusConfig(data.data.status),
              paymentMethodLabel: formatPaymentMethod(data.data.payment_method),
              totalAmount: formatCurrency(data.data.amount, data.data.currency),
              discountDisplay: formatDiscount(data.data.discount_amount, data.data.discount_type, data.data.discount_value),
              isRefundable: checkRefundable(data.data),
              refundableAmountFormatted: data.data.refundable_amount 
                ? formatCurrency(data.data.refundable_amount, data.data.currency)
                : null,
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'orders',
          operation: 'detail',
          params: { id }
        })
      }
    })
  })
}

/**
 * 获取当前用户的订单列表 (用户端)
 */
export const useMyOrders = (params: UseMyOrdersParams = {}) => {
  const { enabled = true, ...queryParams } = params
  
  return useQuery({
    queryKey: queryKeys.orders.byUser('current', queryParams),
    queryFn: () => orderService.getMyOrders(queryParams),
    ...createQueryOptions(DataType.USER, {
      enabled,
      select: (data: OrdersApiResponse) => {
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: data.data.map(order => ({
              ...order,
              statusConfig: getOrderStatusConfig(order.status),
              totalAmount: formatCurrency(order.amount, order.currency),
              canCancel: canCancelOrder(order),
            }))
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'orders',
          operation: 'my-orders',
          params: queryParams
        })
      }
    })
  })
}

/**
 * 获取我的单个订单详情 (用户端)
 */
export const useMyOrder = (params: UseOrderParams) => {
  const { id, enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.orders.detail(`my-${id}`),
    queryFn: () => orderService.getMyOrderById(id),
    ...createQueryOptions(DataType.USER, {
      enabled: enabled && !!id,
      select: (data: ApiResponse<SubscriptionOrderResponse>) => {
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              statusConfig: getOrderStatusConfig(data.data.status),
              totalAmount: formatCurrency(data.data.amount, data.data.currency),
              canCancel: canCancelOrder(data.data),
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'orders',
          operation: 'my-order-detail',
          params: { id }
        })
      }
    })
  })
}

// ==================== 统计数据 Hooks ====================

/**
 * 获取订单统计分析数据
 */
export const useOrderAnalytics = (params: UseOrderAnalyticsParams = {}) => {
  const { enabled = true, ...queryParams } = params
  
  return useQuery({
    queryKey: queryKeys.orders.stats(queryParams),
    queryFn: () => orderService.getOrderAnalytics(queryParams),
    ...createQueryOptions(DataType.STATS, {
      enabled,
      select: (data: ApiResponse<OrderStatsResponse>) => {
        // 统计数据可以在这里进行格式化和计算
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              // 添加格式化的统计数据
              formattedTotalRevenue: data.data.total_revenue 
                ? formatCurrency(data.data.total_revenue, data.data.currency || 'CNY')
                : '¥0',
              formattedAverageOrderValue: data.data.average_order_value
                ? formatCurrency(data.data.average_order_value, data.data.currency || 'CNY') 
                : '¥0',
              conversionRate: data.data.total_orders > 0 
                ? ((data.data.paid_orders / data.data.total_orders) * 100).toFixed(2) + '%'
                : '0%'
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'orders',
          operation: 'analytics',
          params: queryParams
        })
      }
    })
  })
}

// ==================== 无限查询 Hooks ====================

/**
 * 无限加载订单列表
 * 适用于需要滚动加载更多订单的场景
 */
export const useInfiniteOrders = (params: Omit<UseOrdersParams, 'offset'> & { limit?: number } = {}) => {
  const { enabled = true, limit = 20, ...queryParams } = params
  
  return useInfiniteQuery({
    queryKey: queryKeys.orders.list({ ...queryParams, limit }),
    queryFn: ({ pageParam = 0 }) => 
      orderService.getOrders({ ...queryParams, offset: pageParam, limit }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: OrdersApiResponse, allPages) => {
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
          module: 'orders',
          operation: 'infinite-list',
          params: queryParams
        })
      }
    }) as Partial<UseInfiniteQueryOptions<OrdersApiResponse, Error>>
  })
}

// ==================== 条件查询 Hooks ====================

/**
 * 获取待支付订单列表
 */
export const usePendingOrders = (params: Omit<UseOrdersParams, 'status'> = {}) => {
  return useOrders({
    ...params,
    status: 'pending' as const
  })
}

/**
 * 获取已支付订单列表
 */
export const usePaidOrders = (params: Omit<UseOrdersParams, 'status'> = {}) => {
  return useOrders({
    ...params,
    status: 'paid' as const
  })
}

/**
 * 获取失败订单列表
 */
export const useFailedOrders = (params: Omit<UseOrdersParams, 'status'> = {}) => {
  return useOrders({
    ...params,
    status: 'failed' as const
  })
}

/**
 * 获取已退款订单列表
 */
export const useRefundedOrders = (params: Omit<UseOrdersParams, 'status'> = {}) => {
  return useOrders({
    ...params,
    status: 'refunded' as const
  })
}

/**
 * 获取指定用户的订单列表
 */
export const useOrdersByUser = (userId: number, params: UseOrdersParams = {}) => {
  return useOrders({
    ...params,
    user_id: userId
  })
}

/**
 * 获取最近的订单（默认最近7天）
 */
export const useRecentOrders = (days: number = 7, params: UseOrdersParams = {}) => {
  const dateFrom = new Date()
  dateFrom.setDate(dateFrom.getDate() - days)
  
  return useOrders({
    ...params,
    date_from: dateFrom.toISOString().split('T')[0],
    // sort_by: 'created_at', // 移除，因为OrderQueryParams中没有这个字段
    // sort_order: 'desc'  // 移除，因为OrderQueryParams中没有这个字段
  })
}

// ==================== 工具函数 ====================

/**
 * 获取订单状态配置
 */
const getOrderStatusConfig = (status: string) => {
  const configs = {
    pending: { label: '待支付', color: 'bg-yellow-100 text-yellow-800', variant: 'outline' as const },
    paid: { label: '已支付', color: 'bg-green-100 text-green-800', variant: 'default' as const },
    completed: { label: '已完成', color: 'bg-green-100 text-green-800', variant: 'default' as const },
    failed: { label: '支付失败', color: 'bg-red-100 text-red-800', variant: 'destructive' as const },
    cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-800', variant: 'outline' as const },
    refunded: { label: '已退款', color: 'bg-blue-100 text-blue-800', variant: 'secondary' as const },
  }
  return configs[status as keyof typeof configs] || { label: status, color: 'bg-gray-100 text-gray-800', variant: 'outline' as const }
}

/**
 * 格式化支付方式
 */
const formatPaymentMethod = (method: string): string => {
  const methods = {
    credit_card: '信用卡',
    alipay: '支付宝',
    wechat: '微信支付',
    paypal: 'PayPal',
  }
  return methods[method as keyof typeof methods] || method
}

/**
 * 格式化货币金额
 */
const formatCurrency = (amount: number, currency: string = 'CNY'): string => {
  try {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(amount)
  } catch (error) {
    return `${currency} ${amount.toFixed(2)}`
  }
}

/**
 * 格式化折扣显示
 */
const formatDiscount = (discountAmount: number, discountType?: string, discountValue?: number): string | null => {
  if (!discountAmount || discountAmount <= 0) return null
  
  if (discountType === 'percentage' && discountValue) {
    return `${discountValue}% 折扣 (-¥${discountAmount.toFixed(2)})`
  } else if (discountType === 'fixed_amount' && discountValue) {
    return `固定金额折扣 (-¥${discountAmount.toFixed(2)})`
  }
  
  return `-¥${discountAmount.toFixed(2)}`
}

/**
 * 检查订单是否可退款
 */
const checkRefundable = (order: SubscriptionOrderResponse): boolean => {
  return order.status === 'paid' && !order.refundable_amount
}

/**
 * 检查订单是否可取消
 */
const canCancelOrder = (order: SubscriptionOrderResponse): boolean => {
  return order.status === 'pending'
}

/**
 * 订单查询相关的工具函数
 */
export const orderQueryUtils = {
  /**
   * 格式化订单号显示
   */
  formatOrderNumber: (orderNumber: string): string => {
    return orderNumber || '无订单号'
  },

  /**
   * 获取订单类型标签
   */
  getOrderTypeLabel: (type: string): string => {
    const types = {
      new: '新订单',
      renewal: '续费',
      upgrade: '升级',
      downgrade: '降级',
    }
    return types[type as keyof typeof types] || type
  },

  /**
   * 格式化时间显示
   */
  formatDateTime: (dateString: string): string => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  },

  /**
   * 计算订单年龄（距离创建时间）
   */
  getOrderAge: (createdAt: string): string => {
    const now = new Date()
    const created = new Date(createdAt)
    const diffInDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return '今天'
    if (diffInDays === 1) return '昨天'
    if (diffInDays < 7) return `${diffInDays}天前`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}周前`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}个月前`
    return `${Math.floor(diffInDays / 365)}年前`
  },

  formatCurrency,
  getOrderStatusConfig,
  formatPaymentMethod,
  checkRefundable,
  canCancelOrder,
}

// ==================== 默认导出 ====================

export default {
  useOrders,
  useOrder,
  useMyOrders,
  useMyOrder,
  useOrderAnalytics,
  useInfiniteOrders,
  usePendingOrders,
  usePaidOrders,
  useFailedOrders,
  useRefundedOrders,
  useOrdersByUser,
  useRecentOrders,
  orderQueryUtils
}