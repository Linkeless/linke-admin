'use client'

/**
 * 工单查询 Hooks
 * 
 * 基于 React Query 实现的工单数据查询钩子集合
 * 支持工单列表、详情、消息、统计等功能
 * 遵循统一的缓存策略和错误处理机制
 * 
 * 任务33实现：支持系统查询Hooks - 工单管理模块
 */

import { useQuery, useInfiniteQuery, UseQueryOptions, UseInfiniteQueryOptions } from '@tanstack/react-query'
import { ticketService } from '@/lib/ticket-service'
import { queryKeys } from '@/lib/query-keys'
import { createQueryOptions, DataType } from '@/lib/cache-strategies'
import { reactQueryErrorUtils } from '@/lib/error-handler'
import {
  TicketResponse,
  TicketQueryParams,
  TicketSearchParams,
  TicketStatistics,
  TicketMessageResponse,
  TicketMessageQueryParams,
  TicketsApiResponse,
  TicketMessagesApiResponse,
  ApiResponse
} from '@/lib/ticket-types'

// ==================== 类型定义 ====================

/**
 * 工单列表查询参数
 */
export interface UseTicketsParams extends TicketQueryParams {
  enabled?: boolean
}

/**
 * 工单详情查询参数
 */
export interface UseTicketParams {
  id: number
  enabled?: boolean
}

/**
 * 工单消息查询参数
 */
export interface UseTicketMessagesParams extends TicketMessageQueryParams {
  ticketId: number
  enabled?: boolean
}

/**
 * 工单统计查询参数
 */
export interface UseTicketStatsParams {
  enabled?: boolean
}

/**
 * 工单搜索查询参数
 */
export interface UseTicketSearchParams extends TicketSearchParams {
  enabled?: boolean
}

// ==================== 基础查询 Hooks ====================

/**
 * 获取工单列表
 * 支持分页、筛选、排序等功能
 */
export const useTickets = (params: UseTicketsParams = {}) => {
  const { enabled = true, ...queryParams } = params
  
  return useQuery({
    queryKey: queryKeys.tickets.list(queryParams),
    queryFn: () => ticketService.getTickets(queryParams),
    ...createQueryOptions(DataType.USER, {
      enabled,
      select: (data: TicketsApiResponse) => {
        // 数据转换和增强
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: data.data.map(ticket => ({
              ...ticket,
              // 添加计算属性
              statusConfig: getTicketStatusConfig(ticket.status),
              priorityConfig: getTicketPriorityConfig(ticket.priority),
              categoryLabel: getTicketCategoryLabel(ticket.category),
              formattedTicketNumber: formatTicketNumber(ticket.ticket_no),
              responseTimeFormatted: formatResponseTime(ticket.created_at, ticket.first_response_at),
              ageFormatted: getTicketAge(ticket.created_at),
              isOverdue: checkTicketOverdue(ticket),
            }))
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'tickets',
          operation: 'list',
          params: queryParams
        })
      }
    })
  })
}

/**
 * 获取单个工单详情
 */
export const useTicket = (params: UseTicketParams) => {
  const { id, enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.tickets.detail(id),
    queryFn: () => ticketService.getTicketById(id),
    ...createQueryOptions(DataType.USER, {
      enabled: enabled && !!id,
      select: (data: ApiResponse<TicketResponse>) => {
        // 增强工单详情数据
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              statusConfig: getTicketStatusConfig(data.data.status),
              priorityConfig: getTicketPriorityConfig(data.data.priority),
              categoryLabel: getTicketCategoryLabel(data.data.category),
              formattedTicketNumber: formatTicketNumber(data.data.ticket_no),
              responseTimeFormatted: formatResponseTime(data.data.created_at, data.data.first_response_at),
              ageFormatted: getTicketAge(data.data.created_at),
              resolutionTimeFormatted: data.data.resolved_at 
                ? formatResolutionTime(data.data.created_at, data.data.resolved_at)
                : null,
              isOverdue: checkTicketOverdue(data.data),
              canReopen: canReopenTicket(data.data),
              canClose: canCloseTicket(data.data),
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'tickets',
          operation: 'detail',
          params: { id }
        })
      }
    })
  })
}

/**
 * 根据工单号获取工单详情
 */
export const useTicketByNumber = (ticketNumber: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.tickets.detail(`number-${ticketNumber}`),
    queryFn: () => ticketService.getTicketByNumber(ticketNumber),
    ...createQueryOptions(DataType.USER, {
      enabled: enabled && !!ticketNumber,
      select: (data: ApiResponse<TicketResponse>) => {
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              statusConfig: getTicketStatusConfig(data.data.status),
              priorityConfig: getTicketPriorityConfig(data.data.priority),
              categoryLabel: getTicketCategoryLabel(data.data.category),
              formattedTicketNumber: formatTicketNumber(data.data.ticket_no),
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'tickets',
          operation: 'detail-by-number',
          params: { ticketNumber }
        })
      }
    })
  })
}

/**
 * 获取工单消息列表
 */
export const useTicketMessages = (params: UseTicketMessagesParams) => {
  const { ticketId, enabled = true, ...queryParams } = params
  
  return useQuery({
    queryKey: [...queryKeys.tickets.detail(ticketId), 'messages', { filters: queryParams }],
    queryFn: () => ticketService.getTicketMessages(ticketId, queryParams),
    ...createQueryOptions(DataType.USER, {
      enabled: enabled && !!ticketId,
      select: (data: TicketMessagesApiResponse) => {
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: data.data.map(message => ({
              ...message,
              messageTypeLabel: getMessageTypeLabel(message.message_type),
              formattedTime: formatDateTime(message.created_at),
              relativeTime: formatRelativeTime(message.created_at),
              isRecent: isRecentMessage(message.created_at),
            }))
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'tickets',
          operation: 'messages',
          params: { ticketId, ...queryParams }
        })
      }
    })
  })
}

/**
 * 获取工单统计数据
 */
export const useTicketStats = (params: UseTicketStatsParams = {}) => {
  const { enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.tickets.stats(),
    queryFn: () => ticketService.getTicketStatistics(),
    ...createQueryOptions(DataType.STATS, {
      enabled,
      select: (data: ApiResponse<TicketStatistics>) => {
        // 统计数据可以在这里进行格式化和计算
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              // 添加格式化的统计数据
              totalTicketsFormatted: formatNumber(data.data.total_tickets),
              responseTimeFormatted: formatHours(data.data.avg_response_time_hours),
              resolutionTimeFormatted: formatHours(data.data.avg_resolution_time_hours),
              resolutionRate: data.data.total_tickets > 0 
                ? ((data.data.resolved_tickets / data.data.total_tickets) * 100).toFixed(1) + '%'
                : '0%',
              openRate: data.data.total_tickets > 0 
                ? ((data.data.open_tickets / data.data.total_tickets) * 100).toFixed(1) + '%'
                : '0%'
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'tickets',
          operation: 'stats'
        })
      }
    })
  })
}

// ==================== 搜索查询 Hooks ====================

/**
 * 高级工单搜索
 */
export const useTicketSearch = (params: UseTicketSearchParams) => {
  const { enabled = true, ...searchParams } = params
  
  return useQuery({
    queryKey: [...queryKeys.tickets.all, 'search', { filters: searchParams }],
    queryFn: () => ticketService.searchTickets(searchParams),
    ...createQueryOptions(DataType.USER, {
      enabled: enabled && !!(searchParams.query || Object.keys(searchParams).length > 0),
      select: (data: TicketsApiResponse) => {
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: data.data.map(ticket => ({
              ...ticket,
              statusConfig: getTicketStatusConfig(ticket.status),
              priorityConfig: getTicketPriorityConfig(ticket.priority),
              categoryLabel: getTicketCategoryLabel(ticket.category),
              formattedTicketNumber: formatTicketNumber(ticket.ticket_no),
            }))
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'tickets',
          operation: 'search',
          params: searchParams
        })
      }
    })
  })
}

// ==================== 无限查询 Hooks ====================

/**
 * 无限加载工单列表
 * 适用于需要滚动加载更多工单的场景
 */
export const useInfiniteTickets = (params: Omit<UseTicketsParams, 'offset'> & { limit?: number } = {}) => {
  const { enabled = true, limit = 20, ...queryParams } = params
  
  return useInfiniteQuery({
    queryKey: queryKeys.tickets.list({ ...queryParams, limit }),
    queryFn: ({ pageParam = 0 }) => 
      ticketService.getTickets({ ...queryParams, offset: pageParam, limit }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: TicketsApiResponse, allPages) => {
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
          module: 'tickets',
          operation: 'infinite-list',
          params: queryParams
        })
      }
    }) as Partial<UseInfiniteQueryOptions<TicketsApiResponse, Error>>
  })
}

// ==================== 条件查询 Hooks ====================

/**
 * 获取待处理工单列表
 */
export const useOpenTickets = (params: Omit<UseTicketsParams, 'status'> = {}) => {
  return useTickets({
    ...params,
    status: 'open' as const
  })
}

/**
 * 获取处理中工单列表
 */
export const useInProgressTickets = (params: Omit<UseTicketsParams, 'status'> = {}) => {
  return useTickets({
    ...params,
    status: 'in_progress' as const
  })
}

/**
 * 获取等待中工单列表
 */
export const usePendingTickets = (params: Omit<UseTicketsParams, 'status'> = {}) => {
  return useTickets({
    ...params,
    status: 'pending' as const
  })
}

/**
 * 获取已解决工单列表
 */
export const useResolvedTickets = (params: Omit<UseTicketsParams, 'status'> = {}) => {
  return useTickets({
    ...params,
    status: 'resolved' as const
  })
}

/**
 * 获取已关闭工单列表
 */
export const useClosedTickets = (params: Omit<UseTicketsParams, 'status'> = {}) => {
  return useTickets({
    ...params,
    status: 'closed' as const
  })
}

/**
 * 获取指定用户的工单列表
 */
export const useTicketsByUser = (userId: number, params: UseTicketsParams = {}) => {
  return useTickets({
    ...params,
    user_id: userId
  })
}

/**
 * 获取指定代理人的工单列表
 */
export const useTicketsByAssignee = (assigneeId: number, params: UseTicketsParams = {}) => {
  return useTickets({
    ...params,
    assigned_to_id: assigneeId
  })
}

/**
 * 获取高优先级工单（高、紧急、严重）
 */
export const useHighPriorityTickets = (params: UseTicketsParams = {}) => {
  return useQuery({
    queryKey: queryKeys.tickets.list({ ...params, priority_filter: 'high' }),
    queryFn: async () => {
      const results = await Promise.all([
        ticketService.getTickets({ ...params, priority: 'high' }),
        ticketService.getTickets({ ...params, priority: 'urgent' }),
        ticketService.getTickets({ ...params, priority: 'critical' }),
      ])
      
      // 合并结果
      const allTickets = results.reduce((acc, result) => {
        if (result.code === 0 && result.data) {
          acc.push(...result.data)
        }
        return acc
      }, [] as TicketResponse[])
      
      // 按优先级排序
      allTickets.sort((a, b) => {
        const priorityOrder = { critical: 4, urgent: 3, high: 2, normal: 1, low: 0 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
      
      return {
        code: 0,
        message: 'success',
        data: allTickets,
        total: allTickets.length,
        limit: params.limit || 50,
        offset: params.offset || 0
      }
    },
    ...createQueryOptions(DataType.USER, {
      enabled: params.enabled !== false,
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'tickets',
          operation: 'high-priority',
          params
        })
      }
    })
  })
}

/**
 * 获取未分配的工单列表
 */
export const useUnassignedTickets = (params: UseTicketsParams = {}) => {
  return useQuery({
    queryKey: queryKeys.tickets.list({ ...params, assigned_to_id: null }),
    queryFn: () => ticketService.getTickets({ ...params }),
    ...createQueryOptions(DataType.USER, {
      enabled: params.enabled !== false,
      select: (data: TicketsApiResponse) => {
        // 过滤未分配的工单
        if (data.code === 0 && data.data) {
          const unassignedTickets = data.data.filter(ticket => !ticket.assigned_to_id)
          return {
            ...data,
            data: unassignedTickets.map(ticket => ({
              ...ticket,
              statusConfig: getTicketStatusConfig(ticket.status),
              priorityConfig: getTicketPriorityConfig(ticket.priority),
              categoryLabel: getTicketCategoryLabel(ticket.category),
            })),
            total: unassignedTickets.length
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'tickets',
          operation: 'unassigned',
          params
        })
      }
    })
  })
}

/**
 * 获取最近的工单（默认最近7天）
 */
export const useRecentTickets = (days: number = 7, params: UseTicketsParams = {}) => {
  const dateFrom = new Date()
  dateFrom.setDate(dateFrom.getDate() - days)
  
  return useTickets({
    ...params,
    start_date: dateFrom.toISOString().split('T')[0],
    sort_by: 'created_at',
    sort_order: 'desc'
  })
}

// ==================== 工具函数 ====================

/**
 * 获取工单状态配置
 */
const getTicketStatusConfig = (status: string) => {
  const configs = {
    open: { label: '待处理', color: 'bg-red-100 text-red-800', variant: 'destructive' as const },
    in_progress: { label: '处理中', color: 'bg-yellow-100 text-yellow-800', variant: 'outline' as const },
    pending: { label: '等待中', color: 'bg-purple-100 text-purple-800', variant: 'secondary' as const },
    resolved: { label: '已解决', color: 'bg-green-100 text-green-800', variant: 'default' as const },
    closed: { label: '已关闭', color: 'bg-gray-100 text-gray-800', variant: 'outline' as const },
  }
  return configs[status as keyof typeof configs] || { label: status, color: 'bg-gray-100 text-gray-800', variant: 'outline' as const }
}

/**
 * 获取工单优先级配置
 */
const getTicketPriorityConfig = (priority: string) => {
  const configs = {
    low: { label: '较低', color: 'bg-gray-100 text-gray-800', variant: 'outline' as const },
    normal: { label: '普通', color: 'bg-blue-100 text-blue-800', variant: 'default' as const },
    high: { label: '较高', color: 'bg-yellow-100 text-yellow-800', variant: 'outline' as const },
    urgent: { label: '紧急', color: 'bg-orange-100 text-orange-800', variant: 'secondary' as const },
    critical: { label: '严重', color: 'bg-red-100 text-red-800', variant: 'destructive' as const },
  }
  return configs[priority as keyof typeof configs] || { label: priority, color: 'bg-gray-100 text-gray-800', variant: 'outline' as const }
}

/**
 * 获取工单类别标签
 */
const getTicketCategoryLabel = (category: string): string => {
  const labels = {
    general: '常规问题',
    technical: '技术支持',
    billing: '账单问题',
    account: '账户问题',
    feature: '功能请求',
    bug: '错误报告',
    subscription: '订阅问题',
    payment: '支付问题',
  }
  return labels[category as keyof typeof labels] || category
}

/**
 * 获取消息类型标签
 */
const getMessageTypeLabel = (messageType: string): string => {
  const labels = {
    user: '用户消息',
    admin: '管理员回复',
    system: '系统消息',
  }
  return labels[messageType as keyof typeof labels] || messageType
}

/**
 * 格式化工单号
 */
const formatTicketNumber = (ticketNo: string): string => {
  return ticketNo ? ticketNo.toUpperCase() : 'N/A'
}

/**
 * 格式化数字
 */
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('zh-CN').format(num)
}

/**
 * 格式化小时数
 */
const formatHours = (hours: number): string => {
  if (hours < 1) {
    return `${Math.round(hours * 60)}分钟`
  } else if (hours < 24) {
    return `${hours.toFixed(1)}小时`
  } else {
    const days = Math.floor(hours / 24)
    const remainingHours = Math.round(hours % 24)
    return `${days}天${remainingHours > 0 ? remainingHours + '小时' : ''}`
  }
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
 * 格式化响应时间
 */
const formatResponseTime = (createdAt: string, firstResponseAt?: string): string | null => {
  if (!firstResponseAt) return null
  
  const created = new Date(createdAt)
  const responded = new Date(firstResponseAt)
  const diffMs = responded.getTime() - created.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  
  return formatHours(diffHours)
}

/**
 * 格式化解决时间
 */
const formatResolutionTime = (createdAt: string, resolvedAt: string): string => {
  const created = new Date(createdAt)
  const resolved = new Date(resolvedAt)
  const diffMs = resolved.getTime() - created.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  
  return formatHours(diffHours)
}

/**
 * 获取工单年龄（距离创建时间）
 */
const getTicketAge = (createdAt: string): string => {
  const now = new Date()
  const created = new Date(createdAt)
  const diffInDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return '今天'
  if (diffInDays === 1) return '昨天'
  if (diffInDays < 7) return `${diffInDays}天前`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}周前`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}个月前`
  return `${Math.floor(diffInDays / 365)}年前`
}

/**
 * 检查工单是否逾期
 */
const checkTicketOverdue = (ticket: TicketResponse): boolean => {
  if (ticket.status === 'closed' || ticket.status === 'resolved') return false
  
  const created = new Date(ticket.created_at)
  const now = new Date()
  const diffHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
  
  // 根据优先级设定SLA时间
  const slaHours = {
    critical: 4,
    urgent: 8,
    high: 24,
    normal: 48,
    low: 72
  }
  
  return diffHours > (slaHours[ticket.priority as keyof typeof slaHours] || 48)
}

/**
 * 检查工单是否可重新打开
 */
const canReopenTicket = (ticket: TicketResponse): boolean => {
  return ticket.status === 'closed'
}

/**
 * 检查工单是否可关闭
 */
const canCloseTicket = (ticket: TicketResponse): boolean => {
  return ticket.status === 'resolved' || ticket.status === 'pending'
}

/**
 * 检查消息是否为最近消息
 */
const isRecentMessage = (createdAt: string): boolean => {
  const date = new Date(createdAt)
  const now = new Date()
  const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  return diffHours < 24
}

/**
 * 工单查询相关的工具函数
 */
export const ticketQueryUtils = {
  formatTicketNumber,
  formatDateTime,
  formatRelativeTime,
  formatHours,
  getTicketAge,
  getTicketStatusConfig,
  getTicketPriorityConfig,
  getTicketCategoryLabel,
  checkTicketOverdue,
  canReopenTicket,
  canCloseTicket,
}

// ==================== 默认导出 ====================

export default {
  useTickets,
  useTicket,
  useTicketByNumber,
  useTicketMessages,
  useTicketStats,
  useTicketSearch,
  useInfiniteTickets,
  useOpenTickets,
  useInProgressTickets,
  usePendingTickets,
  useResolvedTickets,
  useClosedTickets,
  useTicketsByUser,
  useTicketsByAssignee,
  useHighPriorityTickets,
  useUnassignedTickets,
  useRecentTickets,
  ticketQueryUtils
}