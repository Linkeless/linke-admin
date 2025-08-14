'use client'

/**
 * 发票查询 Hooks
 * 
 * 基于 React Query 实现的发票数据查询钩子集合
 * 支持发票列表、详情、统计、下载等功能
 * 遵循统一的缓存策略和错误处理机制
 * 
 * 任务21实现：财务查询Hooks - 发票管理模块
 */

import { useQuery, useInfiniteQuery, UseQueryOptions, UseInfiniteQueryOptions } from '@tanstack/react-query'
import { invoiceService } from '@/lib/invoice-service'
import { queryKeys } from '@/lib/query-keys'
import { createQueryOptions, DataType } from '@/lib/cache-strategies'
import { reactQueryErrorUtils } from '@/lib/error-handler'
import {
  InvoiceQueryParams,
  InvoicesApiResponse,
  InvoiceApiResponse,
  InvoiceStatisticsApiResponse,
  InvoiceLanguagesApiResponse,
  InvoiceTemplatesApiResponse,
  InvoiceDownloadHistoryApiResponse,
} from '@/lib/invoice-types'

// ==================== 类型定义 ====================

/**
 * 发票列表查询参数
 */
export interface UseInvoicesParams extends InvoiceQueryParams {
  enabled?: boolean
}

/**
 * 发票详情查询参数
 */
export interface UseInvoiceParams {
  id: number
  enabled?: boolean
}

/**
 * 根据发票编号查询参数
 */
export interface UseInvoiceByNumberParams {
  number: string
  enabled?: boolean
}

/**
 * 用户发票查询参数
 */
export interface UseUserInvoicesParams extends InvoiceQueryParams {
  enabled?: boolean
}

/**
 * 下载历史查询参数
 */
export interface UseDownloadHistoryParams extends InvoiceQueryParams {
  enabled?: boolean
}

// ==================== 基础查询 Hooks ====================

/**
 * 获取发票列表
 * 支持分页、筛选、排序等功能
 */
export const useInvoices = (params: UseInvoicesParams = {}) => {
  const { enabled = true, ...queryParams } = params
  
  return useQuery({
    queryKey: queryKeys.invoices.list(queryParams),
    queryFn: () => invoiceService.getInvoices(queryParams),
    ...createQueryOptions(DataType.USER, {
      enabled,
      select: (data: InvoicesApiResponse) => {
        // 数据转换和增强
        if (data.code === 0 && data.data && data.data.items) {
          return {
            ...data,
            data: {
              ...data.data,
              items: data.data.items.map(invoice => ({
                ...invoice,
                // 添加计算属性
                statusConfig: getInvoiceStatusConfig(invoice.status),
                formattedAmount: formatAmount(invoice.total_amount, invoice.currency),
                formattedDueDate: formatDate(invoice.due_date),
                overdueDays: calculateOverdueDays(invoice.due_date, invoice.status),
                isOverdue: isInvoiceOverdue(invoice.due_date, invoice.status),
                canMarkPaid: canMarkInvoicePaid(invoice.status),
                canVoid: canVoidInvoice(invoice.status),
              }))
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'invoices',
          operation: 'list',
          params: queryParams
        })
      }
    })
  })
}

/**
 * 获取单个发票详情
 */
export const useInvoice = (params: UseInvoiceParams) => {
  const { id, enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.invoices.detail(id),
    queryFn: () => invoiceService.getInvoice(id),
    ...createQueryOptions(DataType.USER, {
      enabled: enabled && !!id,
      select: (data: InvoiceApiResponse) => {
        // 增强发票详情数据
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              statusConfig: getInvoiceStatusConfig(data.data.status),
              formattedAmount: formatAmount(data.data.total_amount, data.data.currency),
              formattedDueDate: formatDate(data.data.due_date),
              overdueDays: calculateOverdueDays(data.data.due_date, data.data.status),
              isOverdue: isInvoiceOverdue(data.data.due_date, data.data.status),
              canMarkPaid: canMarkInvoicePaid(data.data.status),
              canVoid: canVoidInvoice(data.data.status),
              canSend: canSendInvoice(data.data.status),
              downloadUrl: `/api/invoices/${data.data.id}/download`,
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'invoices',
          operation: 'detail',
          params: { id }
        })
      }
    })
  })
}

/**
 * 根据发票编号获取发票
 */
export const useInvoiceByNumber = (params: UseInvoiceByNumberParams) => {
  const { number, enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.invoices.detail(`number-${number}`),
    queryFn: () => invoiceService.getInvoiceByNumber(number),
    ...createQueryOptions(DataType.USER, {
      enabled: enabled && !!number,
      select: (data: InvoiceApiResponse) => {
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              statusConfig: getInvoiceStatusConfig(data.data.status),
              formattedAmount: formatAmount(data.data.total_amount, data.data.currency),
              canMarkPaid: canMarkInvoicePaid(data.data.status),
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'invoices',
          operation: 'by-number',
          params: { number }
        })
      }
    })
  })
}

/**
 * 获取用户发票列表
 */
export const useUserInvoices = (params: UseUserInvoicesParams = {}) => {
  const { enabled = true, ...queryParams } = params
  
  return useQuery({
    queryKey: queryKeys.invoices.byUser('current', queryParams),
    queryFn: () => invoiceService.getUserInvoices(queryParams),
    ...createQueryOptions(DataType.USER, {
      enabled,
      select: (data: InvoicesApiResponse) => {
        if (data.code === 0 && data.data && data.data.items) {
          return {
            ...data,
            data: {
              ...data.data,
              items: data.data.items.map(invoice => ({
                ...invoice,
                statusConfig: getInvoiceStatusConfig(invoice.status),
                formattedAmount: formatAmount(invoice.total_amount, invoice.currency),
                isOverdue: isInvoiceOverdue(invoice.due_date, invoice.status),
                downloadUrl: `/api/invoices/${invoice.id}/download`,
              }))
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'invoices',
          operation: 'user-invoices',
          params: queryParams
        })
      }
    })
  })
}

// ==================== 统计数据 Hooks ====================

/**
 * 获取发票统计信息
 */
export const useInvoiceStatistics = (options?: { enabled?: boolean }) => {
  const { enabled = true } = options || {}
  
  return useQuery({
    queryKey: queryKeys.invoices.detail('statistics'),
    queryFn: () => invoiceService.getInvoiceStatistics(),
    ...createQueryOptions(DataType.STATS, {
      enabled,
      select: (data: InvoiceStatisticsApiResponse) => {
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              // 添加格式化的统计数据
              formattedTotalAmount: formatAmount(data.data.total_amount, data.data.currency),
              formattedPaidAmount: formatAmount(data.data.paid_amount, data.data.currency),
              formattedPendingAmount: formatAmount(data.data.pending_amount, data.data.currency),
              formattedOverdueAmount: formatAmount(data.data.overdue_amount, data.data.currency),
              paidPercentage: data.data.total_amount > 0 
                ? ((data.data.paid_amount / data.data.total_amount) * 100).toFixed(2) + '%'
                : '0%',
              overduePercentage: data.data.total_amount > 0
                ? ((data.data.overdue_amount / data.data.total_amount) * 100).toFixed(2) + '%'
                : '0%',
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'invoices',
          operation: 'statistics'
        })
      }
    })
  })
}

// ==================== 配置数据 Hooks ====================

/**
 * 获取发票语言列表
 */
export const useInvoiceLanguages = (options?: { enabled?: boolean }) => {
  const { enabled = true } = options || {}
  
  return useQuery({
    queryKey: queryKeys.invoices.detail('languages'),
    queryFn: () => invoiceService.getInvoiceLanguages(),
    ...createQueryOptions(DataType.STATIC, {
      enabled,
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'invoices',
          operation: 'languages'
        })
      }
    })
  })
}

/**
 * 获取发票模板列表
 */
export const useInvoiceTemplates = (options?: { enabled?: boolean }) => {
  const { enabled = true } = options || {}
  
  return useQuery({
    queryKey: queryKeys.invoices.detail('templates'),
    queryFn: () => invoiceService.getInvoiceTemplates(),
    ...createQueryOptions(DataType.STATIC, {
      enabled,
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'invoices',
          operation: 'templates'
        })
      }
    })
  })
}

/**
 * 获取下载历史
 */
export const useDownloadHistory = (params: UseDownloadHistoryParams = {}) => {
  const { enabled = true, ...queryParams } = params
  
  return useQuery({
    queryKey: queryKeys.invoices.detail('download-history', queryParams),
    queryFn: () => invoiceService.getDownloadHistory(queryParams),
    ...createQueryOptions(DataType.USER, {
      enabled,
      select: (data: InvoiceDownloadHistoryApiResponse) => {
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: data.data.map(history => ({
              ...history,
              formattedDownloadAt: formatDateTime(history.download_at),
              downloadTypeLabel: getDownloadTypeLabel(history.download_type),
            }))
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'invoices',
          operation: 'download-history',
          params: queryParams
        })
      }
    })
  })
}

// ==================== 无限查询 Hooks ====================

/**
 * 无限加载发票列表
 * 适用于需要滚动加载更多发票的场景
 */
export const useInfiniteInvoices = (params: Omit<UseInvoicesParams, 'offset'> & { limit?: number } = {}) => {
  const { enabled = true, limit = 20, ...queryParams } = params
  
  return useInfiniteQuery({
    queryKey: queryKeys.invoices.list({ ...queryParams, limit }),
    queryFn: ({ pageParam = 0 }) => 
      invoiceService.getInvoices({ ...queryParams, offset: pageParam, limit }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: InvoicesApiResponse, allPages) => {
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
          module: 'invoices',
          operation: 'infinite-list',
          params: queryParams
        })
      }
    }) as Partial<UseInfiniteQueryOptions<InvoicesApiResponse, Error>>
  })
}

// ==================== 条件查询 Hooks ====================

/**
 * 获取草稿发票列表
 */
export const useDraftInvoices = (params: Omit<UseInvoicesParams, 'status'> = {}) => {
  return useInvoices({
    ...params,
    status: 'draft' as const
  })
}

/**
 * 获取已发送发票列表
 */
export const useSentInvoices = (params: Omit<UseInvoicesParams, 'status'> = {}) => {
  return useInvoices({
    ...params,
    status: 'sent' as const
  })
}

/**
 * 获取已支付发票列表
 */
export const usePaidInvoices = (params: Omit<UseInvoicesParams, 'status'> = {}) => {
  return useInvoices({
    ...params,
    status: 'paid' as const
  })
}

/**
 * 获取逾期发票列表
 */
export const useOverdueInvoices = (params: Omit<UseInvoicesParams, 'status'> = {}) => {
  return useInvoices({
    ...params,
    status: 'overdue' as const
  })
}

/**
 * 获取作废发票列表
 */
export const useVoidInvoices = (params: Omit<UseInvoicesParams, 'status'> = {}) => {
  return useInvoices({
    ...params,
    status: 'void' as const
  })
}

/**
 * 获取指定用户的发票列表
 */
export const useInvoicesByUser = (userId: number, params: UseInvoicesParams = {}) => {
  return useInvoices({
    ...params,
    user_id: userId
  })
}

/**
 * 获取指定订单的发票列表
 */
export const useInvoicesByOrder = (orderId: number, params: UseInvoicesParams = {}) => {
  return useInvoices({
    ...params,
    order_id: orderId
  })
}

/**
 * 获取最近的发票（默认最近30天）
 */
export const useRecentInvoices = (days: number = 30, params: UseInvoicesParams = {}) => {
  const dateFrom = new Date()
  dateFrom.setDate(dateFrom.getDate() - days)
  
  return useInvoices({
    ...params,
    date_from: dateFrom.toISOString().split('T')[0],
    // sort_by: 'created_at', // 保留，InvoiceQueryParams中有这个字段
    // sort_order: 'desc'  // 保留，InvoiceQueryParams中有这个字段
  })
}

// ==================== 工具函数 ====================

/**
 * 获取发票状态配置
 */
const getInvoiceStatusConfig = (status: string) => {
  const configs = {
    draft: { label: '草稿', color: 'bg-gray-100 text-gray-800', variant: 'outline' as const },
    sent: { label: '已发送', color: 'bg-blue-100 text-blue-800', variant: 'secondary' as const },
    viewed: { label: '已查看', color: 'bg-blue-100 text-blue-800', variant: 'secondary' as const },
    paid: { label: '已支付', color: 'bg-green-100 text-green-800', variant: 'default' as const },
    overdue: { label: '逾期', color: 'bg-red-100 text-red-800', variant: 'destructive' as const },
    void: { label: '作废', color: 'bg-red-100 text-red-800', variant: 'destructive' as const },
    cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-800', variant: 'outline' as const },
  }
  return configs[status as keyof typeof configs] || { label: status, color: 'bg-gray-100 text-gray-800', variant: 'outline' as const }
}

/**
 * 格式化金额
 */
const formatAmount = (amount: number, currency?: string): string => {
  return invoiceService.formatAmount(amount, currency)
}

/**
 * 格式化日期
 */
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

/**
 * 格式化日期时间
 */
const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('zh-CN')
}

/**
 * 计算逾期天数
 */
const calculateOverdueDays = (dueDate: string, status: string): number => {
  if (status === 'paid' || status === 'void' || status === 'cancelled') return 0
  return invoiceService.calculateOverdueDays(dueDate)
}

/**
 * 检查发票是否逾期
 */
const isInvoiceOverdue = (dueDate: string, status: string): boolean => {
  return calculateOverdueDays(dueDate, status) > 0
}

/**
 * 检查是否可以标记为已支付
 */
const canMarkInvoicePaid = (status: string): boolean => {
  return ['sent', 'viewed', 'overdue'].includes(status)
}

/**
 * 检查是否可以作废
 */
const canVoidInvoice = (status: string): boolean => {
  return ['draft', 'sent', 'viewed'].includes(status)
}

/**
 * 检查是否可以发送
 */
const canSendInvoice = (status: string): boolean => {
  return status === 'draft'
}

/**
 * 获取下载类型标签
 */
const getDownloadTypeLabel = (type: string): string => {
  const labels = {
    pdf: 'PDF下载',
    view: '在线查看',
    email: '邮件发送',
  }
  return labels[type as keyof typeof labels] || type
}

/**
 * 发票查询相关的工具函数
 */
export const invoiceQueryUtils = {
  /**
   * 格式化发票编号
   */
  formatInvoiceNumber: (number: string): string => {
    return number || '无编号'
  },

  /**
   * 获取发票状态标签
   */
  getStatusLabel: (status: string): string => {
    return invoiceService.getStatusLabel(status)
  },

  /**
   * 获取发票状态变体
   */
  getStatusVariant: (status: string) => {
    return invoiceService.getStatusVariant(status)
  },

  /**
   * 计算发票年龄（距离创建时间）
   */
  getInvoiceAge: (createdAt: string): string => {
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

  /**
   * 获取逾期状态描述
   */
  getOverdueDescription: (dueDate: string, status: string): string => {
    const overdueDays = calculateOverdueDays(dueDate, status)
    if (overdueDays === 0) return '未逾期'
    if (overdueDays === 1) return '逾期1天'
    return `逾期${overdueDays}天`
  },

  formatAmount,
  formatDate,
  formatDateTime,
  getInvoiceStatusConfig,
  calculateOverdueDays,
  isInvoiceOverdue,
  canMarkInvoicePaid,
  canVoidInvoice,
  canSendInvoice,
}

// ==================== 默认导出 ====================

export default {
  useInvoices,
  useInvoice,
  useInvoiceByNumber,
  useUserInvoices,
  useInvoiceStatistics,
  useInvoiceLanguages,
  useInvoiceTemplates,
  useDownloadHistory,
  useInfiniteInvoices,
  useDraftInvoices,
  useSentInvoices,
  usePaidInvoices,
  useOverdueInvoices,
  useVoidInvoices,
  useInvoicesByUser,
  useInvoicesByOrder,
  useRecentInvoices,
  invoiceQueryUtils
}