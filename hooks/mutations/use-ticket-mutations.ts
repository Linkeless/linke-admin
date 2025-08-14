'use client'

/**
 * 工单变更 Hooks
 * 
 * 基于 React Query 实现的工单数据变更钩子集合
 * 支持工单创建、更新、删除等操作，包含乐观更新机制
 * 遵循统一的缓存策略和错误处理机制
 * 
 * 任务33实现：支持系统变更Hooks - 工单管理模块
 * - 乐观更新工单列表
 * - 操作失败自动回滚
 * - 成功后刷新相关查询
 * - Toast消息提示
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ticketService } from '@/lib/ticket-service'
import { queryKeys, CacheInvalidationUtils } from '@/lib/query-keys'
import { createMutationOptions } from '@/lib/cache-strategies'
import { globalErrorHandler, reactQueryErrorUtils, errorUtils } from '@/lib/error-handler'
import {
  TicketResponse,
  CreateTicketRequest,
  UpdateTicketRequest,
  AssignTicketRequest,
  ResolveTicketRequest,
  EscalateTicketRequest,
  CreateTicketMessageRequest,
  TicketMessageResponse,
  BulkTicketActionRequest,
  TicketsApiResponse,
  ApiResponse
} from '@/lib/ticket-types'
import { StandardResponse } from '@/lib/types'

// ==================== 类型定义 ====================

/**
 * 工单变更操作上下文
 */
interface TicketMutationContext {
  operation: string
  ticketId?: number
  ticketIds?: number[]
  previousData?: any
}

/**
 * 乐观更新工单数据
 */
interface OptimisticTicketUpdate {
  id: number
  data: Partial<TicketResponse>
  operation: 'create' | 'update' | 'delete' | 'assign' | 'resolve' | 'close' | 'reopen'
}

/**
 * 批量操作结果
 */
interface BatchOperationResult {
  successCount: number
  failedCount: number
  failedIds: number[]
  errors: string[]
}

// ==================== 工具函数 ====================

/**
 * 乐观更新工具函数
 */
const optimisticUpdateUtils = {
  /**
   * 乐观更新工单列表 - 创建工单
   */
  optimisticallyAddTicket: (queryClient: any, newTicket: TicketResponse) => {
    const queryKeys = ['tickets', 'list']
    
    queryClient.setQueriesData(
      { queryKey: queryKeys, exact: false },
      (oldData: TicketsApiResponse | undefined) => {
        if (!oldData?.data) return oldData
        
        return {
          ...oldData,
          data: [newTicket, ...oldData.data],
          total: oldData.total + 1
        }
      }
    )
  },

  /**
   * 乐观更新工单列表 - 更新工单
   */
  optimisticallyUpdateTicket: (queryClient: any, ticketId: number, updatedData: Partial<TicketResponse>) => {
    // 更新列表中的工单
    const listQueryKeys = ['tickets', 'list']
    queryClient.setQueriesData(
      { queryKey: listQueryKeys, exact: false },
      (oldData: TicketsApiResponse | undefined) => {
        if (!oldData?.data) return oldData
        
        return {
          ...oldData,
          data: oldData.data.map(ticket => 
            ticket.id === ticketId 
              ? { ...ticket, ...updatedData, updated_at: new Date().toISOString() }
              : ticket
          )
        }
      }
    )

    // 更新工单详情
    const detailQueryKey = queryKeys.tickets.detail(ticketId)
    queryClient.setQueryData(detailQueryKey, (oldData: ApiResponse<TicketResponse> | undefined) => {
      if (!oldData?.data) return oldData
      
      return {
        ...oldData,
        data: {
          ...oldData.data,
          ...updatedData,
          updated_at: new Date().toISOString()
        }
      }
    })
  },

  /**
   * 乐观更新工单列表 - 删除工单
   */
  optimisticallyRemoveTicket: (queryClient: any, ticketId: number) => {
    const queryKeys = ['tickets', 'list']
    
    queryClient.setQueriesData(
      { queryKey: queryKeys, exact: false },
      (oldData: TicketsApiResponse | undefined) => {
        if (!oldData?.data) return oldData
        
        return {
          ...oldData,
          data: oldData.data.filter(ticket => ticket.id !== ticketId),
          total: Math.max(0, oldData.total - 1)
        }
      }
    )
  },

  /**
   * 批量乐观更新工单状态
   */
  optimisticallyUpdateTickets: (queryClient: any, ticketIds: number[], updatedData: Partial<TicketResponse>) => {
    const listQueryKeys = ['tickets', 'list']
    
    queryClient.setQueriesData(
      { queryKey: listQueryKeys, exact: false },
      (oldData: TicketsApiResponse | undefined) => {
        if (!oldData?.data) return oldData
        
        return {
          ...oldData,
          data: oldData.data.map(ticket => 
            ticketIds.includes(ticket.id)
              ? { ...ticket, ...updatedData, updated_at: new Date().toISOString() }
              : ticket
          )
        }
      }
    )
  }
}

/**
 * 缓存失效工具函数
 */
const invalidationUtils = {
  /**
   * 失效工单相关的所有查询
   */
  invalidateTicketQueries: async (queryClient: any, ticketId?: number) => {
    // 失效工单模块的所有查询
    await queryClient.invalidateQueries({ 
      queryKey: CacheInvalidationUtils.getModulePrefix('tickets') 
    })
    
    // 失效相关模块的查询
    const relatedModules = CacheInvalidationUtils.getRelatedModules('tickets')
    for (const module of relatedModules) {
      await queryClient.invalidateQueries({ 
        queryKey: CacheInvalidationUtils.getModulePrefix(module) 
      })
    }
    
    // 如果有特定工单ID，失效该工单的详情和消息
    if (ticketId) {
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.tickets.detail(ticketId) 
      })
      await queryClient.invalidateQueries({ 
        queryKey: [...queryKeys.tickets.detail(ticketId), 'messages'] 
      })
    }
  },

  /**
   * 失效统计相关查询
   */
  invalidateStatsQueries: async (queryClient: any) => {
    await queryClient.invalidateQueries({ 
      queryKey: queryKeys.tickets.stats() 
    })
    await queryClient.invalidateQueries({ 
      queryKey: queryKeys.dashboard.all 
    })
  }
}

// ==================== 工单创建 Mutation ====================

/**
 * 创建工单
 */
export const useCreateTicket = (options?: Partial<UseMutationOptions<ApiResponse<TicketResponse>, Error, CreateTicketRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (ticketData: CreateTicketRequest) => ticketService.createTicket(ticketData),
    ...createMutationOptions({
      onMutate: async (ticketData: CreateTicketRequest) => {
        // 取消正在进行的工单列表查询
        await queryClient.cancelQueries({ queryKey: queryKeys.tickets.lists() })
        
        // 保存当前数据用于回滚
        const previousData = queryClient.getQueriesData({ queryKey: queryKeys.tickets.lists() })
        
        // 乐观更新：创建临时工单对象
        const optimisticTicket: TicketResponse = {
          id: Date.now(), // 临时ID
          ticket_no: `TEMP-${Date.now()}`,
          title: ticketData.title,
          description: ticketData.description,
          category: ticketData.category,
          priority: ticketData.priority || 'normal',
          status: 'open',
          user_id: ticketData.user_id,
          assigned_to_id: ticketData.assigned_to_id,
          tags: ticketData.tags,
          metadata: ticketData.metadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        // 应用乐观更新
        optimisticUpdateUtils.optimisticallyAddTicket(queryClient, optimisticTicket)
        
        // 显示操作中的提示
        toast.loading('正在创建工单...', { id: 'create-ticket' })
        
        return { previousData, optimisticTicket }
      },
      
      onSuccess: (data: ApiResponse<TicketResponse>, variables: CreateTicketRequest, context: any) => {
        // 操作成功
        toast.dismiss('create-ticket')
        
        if (data.code === 0) {
          toast.success('工单创建成功', {
            description: `工单 ${data.data.ticket_no} 已成功创建`
          })
          
          // 失效相关查询以获取最新数据
          invalidationUtils.invalidateTicketQueries(queryClient)
          invalidationUtils.invalidateStatsQueries(queryClient)
        } else {
          toast.error('工单创建失败', {
            description: data.message || '创建工单时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables: CreateTicketRequest, context: any) => {
        // 操作失败，回滚乐观更新
        toast.dismiss('create-ticket')
        
        if (context?.previousData) {
          // 恢复之前的数据
          context.previousData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        // 处理错误并显示用户友好的消息
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'createTicket',
          ticketData: variables
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('工单创建失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 工单更新 Mutation ====================

/**
 * 更新工单信息
 */
export const useUpdateTicket = (options?: Partial<UseMutationOptions<ApiResponse<TicketResponse>, Error, { id: number; data: UpdateTicketRequest }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTicketRequest }) => 
      ticketService.updateTicket(id, data),
    ...createMutationOptions({
      onMutate: async ({ id, data }: { id: number; data: UpdateTicketRequest }) => {
        // 取消相关查询
        await queryClient.cancelQueries({ queryKey: queryKeys.tickets.detail(id) })
        await queryClient.cancelQueries({ queryKey: queryKeys.tickets.lists() })
        
        // 保存当前数据
        const previousTicketData = queryClient.getQueryData(queryKeys.tickets.detail(id))
        const previousListData = queryClient.getQueriesData({ queryKey: queryKeys.tickets.lists() })
        
        // 乐观更新
        optimisticUpdateUtils.optimisticallyUpdateTicket(queryClient, id, data)
        
        toast.loading('正在更新工单...', { id: 'update-ticket' })
        
        return { previousTicketData, previousListData, ticketId: id }
      },
      
      onSuccess: (data: ApiResponse<TicketResponse>, variables, context: any) => {
        toast.dismiss('update-ticket')
        
        if (data.code === 0) {
          toast.success('工单更新成功', {
            description: `工单信息已成功更新`
          })
          
          // 失效相关查询
          invalidationUtils.invalidateTicketQueries(queryClient, variables.id)
        } else {
          toast.error('工单更新失败', {
            description: data.message || '更新工单时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('update-ticket')
        
        // 回滚乐观更新
        if (context?.previousTicketData) {
          queryClient.setQueryData(queryKeys.tickets.detail(context.ticketId), context.previousTicketData)
        }
        if (context?.previousListData) {
          context.previousListData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'updateTicket',
          ticketId: variables.id,
          ticketData: variables.data
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('工单更新失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 工单分配 Mutation ====================

/**
 * 分配工单
 */
export const useAssignTicket = (options?: Partial<UseMutationOptions<ApiResponse<TicketResponse>, Error, { id: number; data: AssignTicketRequest }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AssignTicketRequest }) => 
      ticketService.assignTicket(id, data),
    ...createMutationOptions({
      onMutate: async ({ id, data }: { id: number; data: AssignTicketRequest }) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.tickets.detail(id) })
        await queryClient.cancelQueries({ queryKey: queryKeys.tickets.lists() })
        
        const previousTicketData = queryClient.getQueryData(queryKeys.tickets.detail(id))
        const previousListData = queryClient.getQueriesData({ queryKey: queryKeys.tickets.lists() })
        
        // 乐观更新：分配工单
        optimisticUpdateUtils.optimisticallyUpdateTicket(queryClient, id, {
          assigned_to_id: data.assigned_to_id,
          assigned_at: new Date().toISOString()
        })
        
        toast.loading('正在分配工单...', { id: 'assign-ticket' })
        
        return { previousTicketData, previousListData, ticketId: id }
      },
      
      onSuccess: (data: ApiResponse<TicketResponse>, variables, context: any) => {
        toast.dismiss('assign-ticket')
        
        if (data.code === 0) {
          toast.success('工单分配成功', {
            description: '工单已成功分配给指定代理'
          })
          
          invalidationUtils.invalidateTicketQueries(queryClient, variables.id)
        } else {
          toast.error('工单分配失败', {
            description: data.message || '分配工单时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('assign-ticket')
        
        // 回滚更新
        if (context?.previousTicketData) {
          queryClient.setQueryData(queryKeys.tickets.detail(context.ticketId), context.previousTicketData)
        }
        if (context?.previousListData) {
          context.previousListData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'assignTicket',
          ticketId: variables.id
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('工单分配失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 工单解决 Mutation ====================

/**
 * 解决工单
 */
export const useResolveTicket = (options?: Partial<UseMutationOptions<ApiResponse<TicketResponse>, Error, { id: number; data: ResolveTicketRequest }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ResolveTicketRequest }) => 
      ticketService.resolveTicket(id, data),
    ...createMutationOptions({
      onMutate: async ({ id }: { id: number; data: ResolveTicketRequest }) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.tickets.detail(id) })
        await queryClient.cancelQueries({ queryKey: queryKeys.tickets.lists() })
        
        const previousTicketData = queryClient.getQueryData(queryKeys.tickets.detail(id))
        const previousListData = queryClient.getQueriesData({ queryKey: queryKeys.tickets.lists() })
        
        // 乐观更新：解决工单
        optimisticUpdateUtils.optimisticallyUpdateTicket(queryClient, id, {
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        
        toast.loading('正在解决工单...', { id: 'resolve-ticket' })
        
        return { previousTicketData, previousListData, ticketId: id }
      },
      
      onSuccess: (data: ApiResponse<TicketResponse>, variables, context: any) => {
        toast.dismiss('resolve-ticket')
        
        if (data.code === 0) {
          toast.success('工单解决成功', {
            description: '工单已标记为已解决'
          })
          
          invalidationUtils.invalidateTicketQueries(queryClient, variables.id)
          invalidationUtils.invalidateStatsQueries(queryClient)
        } else {
          toast.error('工单解决失败', {
            description: data.message || '解决工单时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('resolve-ticket')
        
        // 回滚更新
        if (context?.previousTicketData) {
          queryClient.setQueryData(queryKeys.tickets.detail(context.ticketId), context.previousTicketData)
        }
        if (context?.previousListData) {
          context.previousListData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'resolveTicket',
          ticketId: variables.id
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('工单解决失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 工单关闭 Mutation ====================

/**
 * 关闭工单
 */
export const useCloseTicket = (options?: Partial<UseMutationOptions<ApiResponse<TicketResponse>, Error, number>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (ticketId: number) => ticketService.closeTicket(ticketId),
    ...createMutationOptions({
      onMutate: async (ticketId: number) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.tickets.detail(ticketId) })
        await queryClient.cancelQueries({ queryKey: queryKeys.tickets.lists() })
        
        const previousTicketData = queryClient.getQueryData(queryKeys.tickets.detail(ticketId))
        const previousListData = queryClient.getQueriesData({ queryKey: queryKeys.tickets.lists() })
        
        // 乐观更新：关闭工单
        optimisticUpdateUtils.optimisticallyUpdateTicket(queryClient, ticketId, {
          status: 'closed',
          closed_at: new Date().toISOString()
        })
        
        toast.loading('正在关闭工单...', { id: 'close-ticket' })
        
        return { previousTicketData, previousListData, ticketId }
      },
      
      onSuccess: (data: ApiResponse<TicketResponse>, ticketId: number, context: any) => {
        toast.dismiss('close-ticket')
        
        if (data.code === 0) {
          toast.success('工单关闭成功', {
            description: '工单已成功关闭'
          })
          
          invalidationUtils.invalidateTicketQueries(queryClient, ticketId)
          invalidationUtils.invalidateStatsQueries(queryClient)
        } else {
          toast.error('工单关闭失败', {
            description: data.message || '关闭工单时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, ticketId: number, context: any) => {
        toast.dismiss('close-ticket')
        
        // 回滚更新
        if (context?.previousTicketData) {
          queryClient.setQueryData(queryKeys.tickets.detail(ticketId), context.previousTicketData)
        }
        if (context?.previousListData) {
          context.previousListData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'closeTicket',
          ticketId
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('工单关闭失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 工单重新打开 Mutation ====================

/**
 * 重新打开工单
 */
export const useReopenTicket = (options?: Partial<UseMutationOptions<ApiResponse<TicketResponse>, Error, number>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (ticketId: number) => ticketService.reopenTicket(ticketId),
    ...createMutationOptions({
      onMutate: async (ticketId: number) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.tickets.detail(ticketId) })
        await queryClient.cancelQueries({ queryKey: queryKeys.tickets.lists() })
        
        const previousTicketData = queryClient.getQueryData(queryKeys.tickets.detail(ticketId))
        const previousListData = queryClient.getQueriesData({ queryKey: queryKeys.tickets.lists() })
        
        // 乐观更新：重新打开工单
        optimisticUpdateUtils.optimisticallyUpdateTicket(queryClient, ticketId, {
          status: 'open',
          closed_at: undefined
        })
        
        toast.loading('正在重新打开工单...', { id: 'reopen-ticket' })
        
        return { previousTicketData, previousListData, ticketId }
      },
      
      onSuccess: (data: ApiResponse<TicketResponse>, ticketId: number, context: any) => {
        toast.dismiss('reopen-ticket')
        
        if (data.code === 0) {
          toast.success('工单重新打开成功', {
            description: '工单已重新打开并等待处理'
          })
          
          invalidationUtils.invalidateTicketQueries(queryClient, ticketId)
          invalidationUtils.invalidateStatsQueries(queryClient)
        } else {
          toast.error('工单重新打开失败', {
            description: data.message || '重新打开工单时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, ticketId: number, context: any) => {
        toast.dismiss('reopen-ticket')
        
        // 回滚更新
        if (context?.previousTicketData) {
          queryClient.setQueryData(queryKeys.tickets.detail(ticketId), context.previousTicketData)
        }
        if (context?.previousListData) {
          context.previousListData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'reopenTicket',
          ticketId
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('工单重新打开失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 工单升级 Mutation ====================

/**
 * 升级工单
 */
export const useEscalateTicket = (options?: Partial<UseMutationOptions<ApiResponse<TicketResponse>, Error, { id: number; data: EscalateTicketRequest }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: EscalateTicketRequest }) => 
      ticketService.escalateTicket(id, data),
    ...createMutationOptions({
      onMutate: async ({ id, data }: { id: number; data: EscalateTicketRequest }) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.tickets.detail(id) })
        await queryClient.cancelQueries({ queryKey: queryKeys.tickets.lists() })
        
        const previousTicketData = queryClient.getQueryData(queryKeys.tickets.detail(id))
        const previousListData = queryClient.getQueriesData({ queryKey: queryKeys.tickets.lists() })
        
        // 乐观更新：升级工单
        const updateData: Partial<TicketResponse> = {
          assigned_to_id: data.escalated_to_id
        }
        if (data.priority) {
          updateData.priority = data.priority
        }
        
        optimisticUpdateUtils.optimisticallyUpdateTicket(queryClient, id, updateData)
        
        toast.loading('正在升级工单...', { id: 'escalate-ticket' })
        
        return { previousTicketData, previousListData, ticketId: id }
      },
      
      onSuccess: (data: ApiResponse<TicketResponse>, variables, context: any) => {
        toast.dismiss('escalate-ticket')
        
        if (data.code === 0) {
          toast.success('工单升级成功', {
            description: '工单已成功升级'
          })
          
          invalidationUtils.invalidateTicketQueries(queryClient, variables.id)
        } else {
          toast.error('工单升级失败', {
            description: data.message || '升级工单时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('escalate-ticket')
        
        // 回滚更新
        if (context?.previousTicketData) {
          queryClient.setQueryData(queryKeys.tickets.detail(context.ticketId), context.previousTicketData)
        }
        if (context?.previousListData) {
          context.previousListData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'escalateTicket',
          ticketId: variables.id
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('工单升级失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 工单消息 Mutation ====================

/**
 * 发送工单消息
 */
export const useSendTicketMessage = (options?: Partial<UseMutationOptions<ApiResponse<TicketMessageResponse>, Error, { ticketId: number; data: CreateTicketMessageRequest }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ ticketId, data }: { ticketId: number; data: CreateTicketMessageRequest }) => 
      ticketService.createTicketMessage(ticketId, data),
    ...createMutationOptions({
      onMutate: async ({ ticketId }: { ticketId: number; data: CreateTicketMessageRequest }) => {
        // 取消工单消息查询
        await queryClient.cancelQueries({ 
          queryKey: [...queryKeys.tickets.detail(ticketId), 'messages'] 
        })
        
        const previousData = queryClient.getQueriesData({ 
          queryKey: [...queryKeys.tickets.detail(ticketId), 'messages'] 
        })
        
        toast.loading('正在发送消息...', { id: 'send-message' })
        
        return { previousData, ticketId }
      },
      
      onSuccess: (data: ApiResponse<TicketMessageResponse>, variables, context: any) => {
        toast.dismiss('send-message')
        
        if (data.code === 0) {
          toast.success('消息发送成功')
          
          // 失效工单消息查询
          queryClient.invalidateQueries({ 
            queryKey: [...queryKeys.tickets.detail(variables.ticketId), 'messages'] 
          })
          // 更新工单详情（可能包含最后响应时间）
          queryClient.invalidateQueries({ 
            queryKey: queryKeys.tickets.detail(variables.ticketId) 
          })
        } else {
          toast.error('消息发送失败', {
            description: data.message || '发送消息时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('send-message')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'sendTicketMessage',
          ticketId: variables.ticketId
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('消息发送失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 批量操作 Mutations ====================

/**
 * 批量分配工单
 */
export const useBulkAssignTickets = (options?: Partial<UseMutationOptions<ApiResponse<void>, Error, BulkTicketActionRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: BulkTicketActionRequest) => 
      ticketService.bulkAssignTickets(data),
    ...createMutationOptions({
      onMutate: async (data: BulkTicketActionRequest) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.tickets.lists() })
        
        const previousData = queryClient.getQueriesData({ queryKey: queryKeys.tickets.lists() })
        
        // 乐观更新：批量分配工单
        optimisticUpdateUtils.optimisticallyUpdateTickets(queryClient, data.ticket_ids, {
          assigned_to_id: data.assigned_to_id,
          assigned_at: new Date().toISOString()
        })
        
        toast.loading(`正在批量分配 ${data.ticket_ids.length} 个工单...`, { id: 'bulk-assign' })
        
        return { previousData, ticketIds: data.ticket_ids }
      },
      
      onSuccess: (data: ApiResponse<void>, variables: BulkTicketActionRequest, context: any) => {
        toast.dismiss('bulk-assign')
        
        if (data.code === 0) {
          toast.success('批量分配成功', {
            description: `成功分配 ${variables.ticket_ids.length} 个工单`
          })
          
          invalidationUtils.invalidateTicketQueries(queryClient)
        } else {
          toast.error('批量分配失败', {
            description: data.message || '批量分配工单时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables: BulkTicketActionRequest, context: any) => {
        toast.dismiss('bulk-assign')
        
        // 回滚乐观更新
        if (context?.previousData) {
          context.previousData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'bulkAssignTickets',
          ticketIds: variables.ticket_ids
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('批量分配失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 批量关闭工单
 */
export const useBulkCloseTickets = (options?: Partial<UseMutationOptions<ApiResponse<void>, Error, BulkTicketActionRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: BulkTicketActionRequest) => 
      ticketService.bulkCloseTickets(data),
    ...createMutationOptions({
      onMutate: async (data: BulkTicketActionRequest) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.tickets.lists() })
        
        const previousData = queryClient.getQueriesData({ queryKey: queryKeys.tickets.lists() })
        
        // 乐观更新：批量关闭工单
        optimisticUpdateUtils.optimisticallyUpdateTickets(queryClient, data.ticket_ids, {
          status: 'closed',
          closed_at: new Date().toISOString()
        })
        
        toast.loading(`正在批量关闭 ${data.ticket_ids.length} 个工单...`, { id: 'bulk-close' })
        
        return { previousData, ticketIds: data.ticket_ids }
      },
      
      onSuccess: (data: ApiResponse<void>, variables: BulkTicketActionRequest, context: any) => {
        toast.dismiss('bulk-close')
        
        if (data.code === 0) {
          toast.success('批量关闭成功', {
            description: `成功关闭 ${variables.ticket_ids.length} 个工单`
          })
          
          invalidationUtils.invalidateTicketQueries(queryClient)
          invalidationUtils.invalidateStatsQueries(queryClient)
        } else {
          toast.error('批量关闭失败', {
            description: data.message || '批量关闭工单时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables: BulkTicketActionRequest, context: any) => {
        toast.dismiss('bulk-close')
        
        // 回滚乐观更新
        if (context?.previousData) {
          context.previousData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'bulkCloseTickets',
          ticketIds: variables.ticket_ids
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('批量关闭失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 批量更新工单状态
 */
export const useBulkUpdateTicketStatus = (options?: Partial<UseMutationOptions<ApiResponse<void>, Error, BulkTicketActionRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: BulkTicketActionRequest) => 
      ticketService.bulkUpdateTicketStatus(data),
    ...createMutationOptions({
      onMutate: async (data: BulkTicketActionRequest) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.tickets.lists() })
        
        const previousData = queryClient.getQueriesData({ queryKey: queryKeys.tickets.lists() })
        
        // 乐观更新：批量更新状态
        const updateData: Partial<TicketResponse> = {}
        if (data.status) updateData.status = data.status
        if (data.priority) updateData.priority = data.priority
        
        optimisticUpdateUtils.optimisticallyUpdateTickets(queryClient, data.ticket_ids, updateData)
        
        toast.loading(`正在批量更新 ${data.ticket_ids.length} 个工单...`, { id: 'bulk-update' })
        
        return { previousData, ticketIds: data.ticket_ids }
      },
      
      onSuccess: (data: ApiResponse<void>, variables: BulkTicketActionRequest, context: any) => {
        toast.dismiss('bulk-update')
        
        if (data.code === 0) {
          toast.success('批量更新成功', {
            description: `成功更新 ${variables.ticket_ids.length} 个工单`
          })
          
          invalidationUtils.invalidateTicketQueries(queryClient)
        } else {
          toast.error('批量更新失败', {
            description: data.message || '批量更新工单时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables: BulkTicketActionRequest, context: any) => {
        toast.dismiss('bulk-update')
        
        // 回滚乐观更新
        if (context?.previousData) {
          context.previousData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'bulkUpdateTicketStatus',
          ticketIds: variables.ticket_ids
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('批量更新失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 导出 ====================

export default {
  useCreateTicket,
  useUpdateTicket,
  useAssignTicket,
  useResolveTicket,
  useCloseTicket,
  useReopenTicket,
  useEscalateTicket,
  useSendTicketMessage,
  useBulkAssignTickets,
  useBulkCloseTickets,
  useBulkUpdateTicketStatus,
}

// 导出工具函数
export {
  optimisticUpdateUtils,
  invalidationUtils,
}