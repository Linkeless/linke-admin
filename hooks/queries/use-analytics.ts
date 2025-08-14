'use client'

/**
 * 分析数据查询 Hooks
 * 
 * 基于 React Query 实现的分析数据查询钩子集合
 * 提供订阅分析和订单分析数据
 * 
 * 任务18实现：订阅分析页面React Query迁移
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { createQueryOptions, DataType } from '@/lib/cache-strategies'
import { reactQueryErrorUtils } from '@/lib/error-handler'
import { SubscriptionAnalytics, OrderAnalytics } from '@/lib/subscription-types'

// ==================== 类型定义 ====================

/**
 * 分析查询参数
 */
export interface UseAnalyticsParams {
  dateFrom?: string
  dateTo?: string
  enabled?: boolean
}

// ==================== 分析数据查询 Hooks ====================

/**
 * 获取订阅分析数据
 */
export const useSubscriptionAnalytics = (params: UseAnalyticsParams = {}) => {
  const { enabled = true, dateFrom, dateTo } = params
  
  return useQuery({
    queryKey: ['analytics', 'subscriptions', { dateFrom, dateTo }],
    queryFn: async (): Promise<SubscriptionAnalytics> => {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // 模拟订阅分析数据
      return {
        overview: {
          total_subscriptions: 1248,
          active_subscriptions: 987,
          trial_subscriptions: 156,
          expired_subscriptions: 78,
          cancelled_subscriptions: 27,
          total_revenue: 245680,
          monthly_recurring_revenue: 18950,
          annual_recurring_revenue: 227400,
          average_revenue_per_user: 248.95,
          churn_rate: 2.8,
          growth_rate: 12.5
        },
        trends: [
          { date: '2024-01-01', new_subscriptions: 45, cancelled_subscriptions: 8, revenue: 15420, active_users: 920 },
          { date: '2024-01-02', new_subscriptions: 52, cancelled_subscriptions: 6, revenue: 16890, active_users: 966 },
          { date: '2024-01-03', new_subscriptions: 38, cancelled_subscriptions: 12, revenue: 14230, active_users: 992 },
          { date: '2024-01-04', new_subscriptions: 61, cancelled_subscriptions: 4, revenue: 18750, active_users: 1049 },
          { date: '2024-01-05', new_subscriptions: 47, cancelled_subscriptions: 9, revenue: 16340, active_users: 1087 },
          { date: '2024-01-06', new_subscriptions: 55, cancelled_subscriptions: 7, revenue: 17680, active_users: 1135 },
          { date: '2024-01-07', new_subscriptions: 43, cancelled_subscriptions: 11, revenue: 15920, active_users: 1167 }
        ],
        plan_distribution: [
          { plan_id: 1, plan_name: '基础版月付', subscription_count: 456, revenue: 45600, percentage: 18.6 },
          { plan_id: 2, plan_name: '专业版月付', subscription_count: 312, revenue: 93600, percentage: 38.1 },
          { plan_id: 3, plan_name: '企业版月付', subscription_count: 189, revenue: 75600, percentage: 30.8 },
          { plan_id: 4, plan_name: '基础版年付', subscription_count: 156, revenue: 18720, percentage: 7.6 },
          { plan_id: 5, plan_name: '专业版年付', subscription_count: 98, revenue: 35280, percentage: 14.4 },
          { plan_id: 6, plan_name: '企业版年付', subscription_count: 37, revenue: 17760, percentage: 7.2 }
        ],
        user_metrics: {
          lifetime_value: 892.45,
          average_subscription_duration: 8.7,
          retention_rate: [
            { period: '1个月', rate: 94.2 },
            { period: '3个月', rate: 87.6 },
            { period: '6个月', rate: 79.3 },
            { period: '12个月', rate: 68.9 }
          ]
        }
      }
    },
    ...createQueryOptions(DataType.DYNAMIC, {
      enabled,
      staleTime: 5 * 60 * 1000, // 5分钟数据有效期
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'analytics',
          operation: 'subscription-analytics',
          params: { dateFrom, dateTo }
        })
      }
    })
  })
}

/**
 * 获取订单分析数据
 */
export const useOrderAnalytics = (params: UseAnalyticsParams = {}) => {
  const { enabled = true, dateFrom, dateTo } = params
  
  return useQuery({
    queryKey: ['analytics', 'orders', { dateFrom, dateTo }],
    queryFn: async (): Promise<OrderAnalytics> => {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 600))
      
      // 模拟订单分析数据
      return {
        overview: {
          total_orders: 2156,
          completed_orders: 2034,
          pending_orders: 87,
          failed_orders: 35,
          total_revenue: 287340,
          average_order_value: 133.28,
          conversion_rate: 94.3
        },
        trends: [
          { date: '2024-01-01', order_count: 67, revenue: 8940, conversion_rate: 92.5 },
          { date: '2024-01-02', order_count: 73, revenue: 9730, conversion_rate: 95.1 },
          { date: '2024-01-03', order_count: 54, revenue: 7210, conversion_rate: 91.2 },
          { date: '2024-01-04', order_count: 89, revenue: 11860, conversion_rate: 96.8 },
          { date: '2024-01-05', order_count: 76, revenue: 10140, conversion_rate: 93.7 },
          { date: '2024-01-06', order_count: 82, revenue: 10930, conversion_rate: 95.4 },
          { date: '2024-01-07', order_count: 69, revenue: 9200, conversion_rate: 92.8 }
        ],
        payment_methods: [
          { method: '支付宝', count: 867, revenue: 115620, percentage: 40.3 },
          { method: '微信支付', count: 642, revenue: 85630, percentage: 29.8 },
          { method: '信用卡', count: 398, revenue: 53070, percentage: 18.5 },
          { method: 'PayPal', count: 187, revenue: 24930, percentage: 8.7 },
          { method: '银行转账', count: 62, revenue: 8090, percentage: 2.8 }
        ],
        geographic_distribution: [
          { country: '中国', order_count: 1543, revenue: 205820, percentage: 71.6 },
          { country: '美国', order_count: 234, revenue: 31220, percentage: 10.9 },
          { country: '日本', order_count: 167, revenue: 22290, percentage: 7.8 },
          { country: '韩国', order_count: 123, revenue: 16410, percentage: 5.7 },
          { country: '其他', order_count: 89, revenue: 11600, percentage: 4.0 }
        ]
      }
    },
    ...createQueryOptions(DataType.DYNAMIC, {
      enabled,
      staleTime: 5 * 60 * 1000, // 5分钟数据有效期
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'analytics',
          operation: 'order-analytics',
          params: { dateFrom, dateTo }
        })
      }
    })
  })
}

/**
 * 分析数据工具函数
 */
export const analyticsQueryUtils = {
  /**
   * 格式化日期范围
   */
  formatDateRange: (from: Date, to: Date): { dateFrom: string; dateTo: string } => {
    return {
      dateFrom: from.toISOString().split('T')[0],
      dateTo: to.toISOString().split('T')[0]
    }
  },

  /**
   * 获取默认日期范围（最近30天）
   */
  getDefaultDateRange: (): { from: Date; to: Date } => {
    const to = new Date()
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    return { from, to }
  },

  /**
   * 计算增长率
   */
  calculateGrowthRate: (current: number, previous: number): number => {
    if (previous === 0) return 0
    return Math.round(((current - previous) / previous) * 100 * 100) / 100
  },

  /**
   * 格式化收入
   */
  formatRevenue: (amount: number, currency: string = 'CNY'): string => {
    const symbols: Record<string, string> = {
      CNY: '¥',
      USD: '$',
      EUR: '€'
    }
    const symbol = symbols[currency] || currency
    return `${symbol}${amount.toLocaleString()}`
  }
}

// ==================== 默认导出 ====================

export default {
  useSubscriptionAnalytics,
  useOrderAnalytics,
  analyticsQueryUtils
}