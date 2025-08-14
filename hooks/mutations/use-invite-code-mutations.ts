'use client'

/**
 * 邀请码变更 Hooks
 * 
 * 基于 React Query 实现的邀请码数据变更钩子集合
 * 支持邀请码创建、更新、删除等操作，包含乐观更新机制
 * 遵循统一的缓存策略和错误处理机制
 * 
 * 任务34实现：快速迁移推荐系统 - 邀请码管理模块
 * - 乐观更新邀请码列表
 * - 操作失败自动回滚
 * - 成功后刷新相关查询
 * - Toast消息提示
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'
import { inviteCodeService } from '@/lib/invite-code-service'
import { queryKeys, CacheInvalidationUtils } from '@/lib/query-keys'
import { createMutationOptions } from '@/lib/cache-strategies'
import { globalErrorHandler, reactQueryErrorUtils, errorUtils } from '@/lib/error-handler'
import {
  InviteCodeResponse,
  CreateInviteCodeRequest,
  UpdateInviteCodeRequest,
  BatchInviteCodeRequest,
  InviteCodesApiResponse,
  ApiResponse
} from '@/lib/invite-code-types'
import { StandardResponse } from '@/lib/types'

// ==================== 类型定义 ====================

/**
 * 邀请码变更操作上下文
 */
interface InviteCodeMutationContext {
  operation: string
  inviteCodeId?: number
  inviteCodeIds?: number[]
  previousData?: any
}

/**
 * 乐观更新邀请码数据
 */
interface OptimisticInviteCodeUpdate {
  id: number
  data: Partial<InviteCodeResponse>
  operation: 'create' | 'update' | 'delete' | 'toggle-status' | 'reset' | 'extend'
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

/**
 * 状态切换请求参数
 */
interface ToggleStatusParams {
  id: number
  status: 'active' | 'inactive'
}

/**
 * 延长有效期请求参数
 */
interface ExtendValidityParams {
  id: number
  validUntil: string
}

// ==================== 工具函数 ====================

/**
 * 乐观更新工具函数
 */
const optimisticUpdateUtils = {
  /**
   * 乐观更新邀请码列表 - 创建邀请码
   */
  optimisticallyAddInviteCode: (queryClient: any, newInviteCode: InviteCodeResponse) => {
    const queryKeys = ['invite-codes', 'list']
    
    queryClient.setQueriesData(
      { queryKey: queryKeys, exact: false },
      (oldData: InviteCodesApiResponse | undefined) => {
        if (!oldData?.data) return oldData
        
        return {
          ...oldData,
          data: [newInviteCode, ...oldData.data],
          total: oldData.total + 1
        }
      }
    )
  },

  /**
   * 乐观更新邀请码列表 - 更新邀请码
   */
  optimisticallyUpdateInviteCode: (queryClient: any, inviteCodeId: number, updatedData: Partial<InviteCodeResponse>) => {
    // 更新列表中的邀请码
    const listQueryKeys = ['invite-codes', 'list']
    queryClient.setQueriesData(
      { queryKey: listQueryKeys, exact: false },
      (oldData: InviteCodesApiResponse | undefined) => {
        if (!oldData?.data) return oldData
        
        return {
          ...oldData,
          data: oldData.data.map(inviteCode => 
            inviteCode.id === inviteCodeId 
              ? { ...inviteCode, ...updatedData, updated_at: new Date().toISOString() }
              : inviteCode
          )
        }
      }
    )

    // 更新邀请码详情
    const detailQueryKey = queryKeys.inviteCodes.detail(inviteCodeId)
    queryClient.setQueryData(detailQueryKey, (oldData: ApiResponse<InviteCodeResponse> | undefined) => {
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
   * 乐观更新邀请码列表 - 删除邀请码
   */
  optimisticallyRemoveInviteCode: (queryClient: any, inviteCodeId: number) => {
    const queryKeys = ['invite-codes', 'list']
    
    queryClient.setQueriesData(
      { queryKey: queryKeys, exact: false },
      (oldData: InviteCodesApiResponse | undefined) => {
        if (!oldData?.data) return oldData
        
        return {
          ...oldData,
          data: oldData.data.filter(inviteCode => inviteCode.id !== inviteCodeId),
          total: Math.max(0, oldData.total - 1)
        }
      }
    )
  },

  /**
   * 批量乐观更新邀请码
   */
  optimisticallyUpdateInviteCodes: (queryClient: any, inviteCodeIds: number[], updatedData: Partial<InviteCodeResponse>) => {
    const listQueryKeys = ['invite-codes', 'list']
    
    queryClient.setQueriesData(
      { queryKey: listQueryKeys, exact: false },
      (oldData: InviteCodesApiResponse | undefined) => {
        if (!oldData?.data) return oldData
        
        return {
          ...oldData,
          data: oldData.data.map(inviteCode => 
            inviteCodeIds.includes(inviteCode.id)
              ? { ...inviteCode, ...updatedData, updated_at: new Date().toISOString() }
              : inviteCode
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
   * 失效邀请码相关的所有查询
   */
  invalidateInviteCodeQueries: async (queryClient: any, inviteCodeId?: number) => {
    // 失效邀请码模块的所有查询
    await queryClient.invalidateQueries({ 
      queryKey: CacheInvalidationUtils.getModulePrefix('inviteCodes') 
    })
    
    // 失效相关模块的查询
    const relatedModules = CacheInvalidationUtils.getRelatedModules('inviteCodes')
    for (const module of relatedModules) {
      await queryClient.invalidateQueries({ 
        queryKey: CacheInvalidationUtils.getModulePrefix(module) 
      })
    }
    
    // 如果有特定邀请码ID，失效该邀请码的详情和使用记录
    if (inviteCodeId) {
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.inviteCodes.detail(inviteCodeId) 
      })
      await queryClient.invalidateQueries({ 
        queryKey: [...queryKeys.inviteCodes.all, 'usages', { invite_code_id: inviteCodeId }] 
      })
    }
  },

  /**
   * 失效统计相关查询
   */
  invalidateStatsQueries: async (queryClient: any) => {
    await queryClient.invalidateQueries({ 
      queryKey: queryKeys.inviteCodes.stats() 
    })
    await queryClient.invalidateQueries({ 
      queryKey: queryKeys.dashboard.all 
    })
  }
}

// ==================== 邀请码创建 Mutation ====================

/**
 * 创建邀请码
 */
export const useCreateInviteCode = (options?: Partial<UseMutationOptions<ApiResponse<InviteCodeResponse>, Error, CreateInviteCodeRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (inviteCodeData: CreateInviteCodeRequest) => inviteCodeService.createInviteCode(inviteCodeData),
    ...createMutationOptions({
      onMutate: async (inviteCodeData: CreateInviteCodeRequest) => {
        // 取消正在进行的邀请码列表查询
        await queryClient.cancelQueries({ queryKey: queryKeys.inviteCodes.lists() })
        
        // 保存当前数据用于回滚
        const previousData = queryClient.getQueriesData({ queryKey: queryKeys.inviteCodes.lists() })
        
        // 乐观更新：创建临时邀请码对象
        const optimisticInviteCode: InviteCodeResponse = {
          id: Date.now(), // 临时ID
          code: inviteCodeData.code,
          name: inviteCodeData.name,
          description: inviteCodeData.description,
          max_uses: inviteCodeData.max_uses || 0,
          used_count: 0,
          remaining_uses: inviteCodeData.max_uses || 0,
          status: 'active',
          is_unlimited: inviteCodeData.is_unlimited || false,
          valid_from: inviteCodeData.valid_from,
          valid_until: inviteCodeData.valid_until,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        // 应用乐观更新
        optimisticUpdateUtils.optimisticallyAddInviteCode(queryClient, optimisticInviteCode)
        
        // 显示操作中的提示
        toast.loading('正在创建邀请码...', { id: 'create-invite-code' })
        
        return { previousData, optimisticInviteCode }
      },
      
      onSuccess: (data: ApiResponse<InviteCodeResponse>, variables: CreateInviteCodeRequest, context: any) => {
        // 操作成功
        toast.dismiss('create-invite-code')
        
        if (data.code === 0 && data.data) {
          toast.success('邀请码创建成功', {
            description: `邀请码 ${data.data.code} 已成功创建`
          })
          
          // 失效相关查询以获取最新数据
          invalidationUtils.invalidateInviteCodeQueries(queryClient)
          invalidationUtils.invalidateStatsQueries(queryClient)
        } else {
          toast.error('邀请码创建失败', {
            description: data.message || '创建邀请码时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables: CreateInviteCodeRequest, context: any) => {
        // 操作失败，回滚乐观更新
        toast.dismiss('create-invite-code')
        
        if (context?.previousData) {
          // 恢复之前的数据
          context.previousData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        // 处理错误并显示用户友好的消息
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'createInviteCode',
          inviteCodeData: variables
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('邀请码创建失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 邀请码更新 Mutation ====================

/**
 * 更新邀请码信息
 */
export const useUpdateInviteCode = (options?: Partial<UseMutationOptions<ApiResponse<InviteCodeResponse>, Error, { id: number; data: UpdateInviteCodeRequest }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateInviteCodeRequest }) => 
      inviteCodeService.updateInviteCode(id, data),
    ...createMutationOptions({
      onMutate: async ({ id, data }: { id: number; data: UpdateInviteCodeRequest }) => {
        // 取消相关查询
        await queryClient.cancelQueries({ queryKey: queryKeys.inviteCodes.detail(id) })
        await queryClient.cancelQueries({ queryKey: queryKeys.inviteCodes.lists() })
        
        // 保存当前数据
        const previousInviteCodeData = queryClient.getQueryData(queryKeys.inviteCodes.detail(id))
        const previousListData = queryClient.getQueriesData({ queryKey: queryKeys.inviteCodes.lists() })
        
        // 乐观更新
        optimisticUpdateUtils.optimisticallyUpdateInviteCode(queryClient, id, data)
        
        toast.loading('正在更新邀请码...', { id: 'update-invite-code' })
        
        return { previousInviteCodeData, previousListData, inviteCodeId: id }
      },
      
      onSuccess: (data: ApiResponse<InviteCodeResponse>, variables, context: any) => {
        toast.dismiss('update-invite-code')
        
        if (data.code === 0) {
          toast.success('邀请码更新成功', {
            description: `邀请码信息已成功更新`
          })
          
          // 失效相关查询
          invalidationUtils.invalidateInviteCodeQueries(queryClient, variables.id)
        } else {
          toast.error('邀请码更新失败', {
            description: data.message || '更新邀请码时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('update-invite-code')
        
        // 回滚乐观更新
        if (context?.previousInviteCodeData) {
          queryClient.setQueryData(queryKeys.inviteCodes.detail(context.inviteCodeId), context.previousInviteCodeData)
        }
        if (context?.previousListData) {
          context.previousListData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'updateInviteCode',
          inviteCodeId: variables.id,
          inviteCodeData: variables.data
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('邀请码更新失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 邀请码删除 Mutation ====================

/**
 * 删除邀请码
 */
export const useDeleteInviteCode = (options?: Partial<UseMutationOptions<ApiResponse<void>, Error, number>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (inviteCodeId: number) => inviteCodeService.deleteInviteCode(inviteCodeId),
    ...createMutationOptions({
      onMutate: async (inviteCodeId: number) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.inviteCodes.detail(inviteCodeId) })
        await queryClient.cancelQueries({ queryKey: queryKeys.inviteCodes.lists() })
        
        const previousInviteCodeData = queryClient.getQueryData(queryKeys.inviteCodes.detail(inviteCodeId))
        const previousListData = queryClient.getQueriesData({ queryKey: queryKeys.inviteCodes.lists() })
        
        // 乐观更新：删除邀请码
        optimisticUpdateUtils.optimisticallyRemoveInviteCode(queryClient, inviteCodeId)
        
        toast.loading('正在删除邀请码...', { id: 'delete-invite-code' })
        
        return { previousInviteCodeData, previousListData, inviteCodeId }
      },
      
      onSuccess: (data: ApiResponse<void>, inviteCodeId: number, context: any) => {
        toast.dismiss('delete-invite-code')
        
        if (data.code === 0) {
          toast.success('邀请码删除成功', {
            description: '邀请码已成功删除'
          })
          
          invalidationUtils.invalidateInviteCodeQueries(queryClient, inviteCodeId)
          invalidationUtils.invalidateStatsQueries(queryClient)
        } else {
          toast.error('邀请码删除失败', {
            description: data.message || '删除邀请码时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, inviteCodeId: number, context: any) => {
        toast.dismiss('delete-invite-code')
        
        // 回滚更新
        if (context?.previousInviteCodeData) {
          queryClient.setQueryData(queryKeys.inviteCodes.detail(inviteCodeId), context.previousInviteCodeData)
        }
        if (context?.previousListData) {
          context.previousListData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'deleteInviteCode',
          inviteCodeId
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('邀请码删除失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 批量生成邀请码 Mutation ====================

/**
 * 批量生成邀请码
 */
export const useGenerateBatchInviteCodes = (options?: Partial<UseMutationOptions<ApiResponse<InviteCodeResponse[]>, Error, BatchInviteCodeRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (batchData: BatchInviteCodeRequest) => inviteCodeService.batchCreateInviteCodes(batchData),
    ...createMutationOptions({
      onMutate: async (batchData: BatchInviteCodeRequest) => {
        // 取消相关查询
        await queryClient.cancelQueries({ queryKey: queryKeys.inviteCodes.lists() })
        
        const previousData = queryClient.getQueriesData({ queryKey: queryKeys.inviteCodes.lists() })
        
        toast.loading(`正在批量生成 ${batchData.count} 个邀请码...`, { id: 'batch-generate' })
        
        return { previousData, count: batchData.count }
      },
      
      onSuccess: (data: ApiResponse<InviteCodeResponse[]>, variables: BatchInviteCodeRequest, context: any) => {
        toast.dismiss('batch-generate')
        
        if (data.code === 0 && data.data) {
          toast.success('批量生成成功', {
            description: `成功生成 ${data.data.length} 个邀请码`
          })
          
          invalidationUtils.invalidateInviteCodeQueries(queryClient)
          invalidationUtils.invalidateStatsQueries(queryClient)
        } else {
          toast.error('批量生成失败', {
            description: data.message || '批量生成邀请码时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables: BatchInviteCodeRequest, context: any) => {
        toast.dismiss('batch-generate')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'batchCreateInviteCodes',
          batchData: variables
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('批量生成失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 切换邀请码状态 Mutation ====================

/**
 * 启用/禁用邀请码状态
 */
export const useToggleInviteCodeStatus = (options?: Partial<UseMutationOptions<ApiResponse<InviteCodeResponse>, Error, ToggleStatusParams>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, status }: ToggleStatusParams) => 
      inviteCodeService.toggleInviteCodeStatus(id, status),
    ...createMutationOptions({
      onMutate: async ({ id, status }: ToggleStatusParams) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.inviteCodes.detail(id) })
        await queryClient.cancelQueries({ queryKey: queryKeys.inviteCodes.lists() })
        
        const previousInviteCodeData = queryClient.getQueryData(queryKeys.inviteCodes.detail(id))
        const previousListData = queryClient.getQueriesData({ queryKey: queryKeys.inviteCodes.lists() })
        
        // 乐观更新：切换状态
        optimisticUpdateUtils.optimisticallyUpdateInviteCode(queryClient, id, { status })
        
        const actionText = status === 'active' ? '启用' : '禁用'
        toast.loading(`正在${actionText}邀请码...`, { id: 'toggle-status' })
        
        return { previousInviteCodeData, previousListData, inviteCodeId: id, status }
      },
      
      onSuccess: (data: ApiResponse<InviteCodeResponse>, variables, context: any) => {
        toast.dismiss('toggle-status')
        
        if (data.code === 0) {
          const actionText = variables.status === 'active' ? '启用' : '禁用'
          toast.success(`邀请码${actionText}成功`, {
            description: `邀请码已成功${actionText}`
          })
          
          invalidationUtils.invalidateInviteCodeQueries(queryClient, variables.id)
        } else {
          toast.error('状态切换失败', {
            description: data.message || '切换邀请码状态时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('toggle-status')
        
        // 回滚更新
        if (context?.previousInviteCodeData) {
          queryClient.setQueryData(queryKeys.inviteCodes.detail(context.inviteCodeId), context.previousInviteCodeData)
        }
        if (context?.previousListData) {
          context.previousListData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'toggleInviteCodeStatus',
          inviteCodeId: variables.id,
          status: variables.status
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('状态切换失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 重置邀请码使用次数 Mutation ====================

/**
 * 重置邀请码使用次数
 */
export const useResetInviteCodeUsage = (options?: Partial<UseMutationOptions<ApiResponse<InviteCodeResponse>, Error, number>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (inviteCodeId: number) => inviteCodeService.resetInviteCodeUsage(inviteCodeId),
    ...createMutationOptions({
      onMutate: async (inviteCodeId: number) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.inviteCodes.detail(inviteCodeId) })
        await queryClient.cancelQueries({ queryKey: queryKeys.inviteCodes.lists() })
        
        const previousInviteCodeData = queryClient.getQueryData(queryKeys.inviteCodes.detail(inviteCodeId))
        const previousListData = queryClient.getQueriesData({ queryKey: queryKeys.inviteCodes.lists() })
        
        // 乐观更新：重置使用次数
        optimisticUpdateUtils.optimisticallyUpdateInviteCode(queryClient, inviteCodeId, {
          used_count: 0,
          remaining_uses: undefined // 将在服务端重新计算
        })
        
        toast.loading('正在重置使用次数...', { id: 'reset-usage' })
        
        return { previousInviteCodeData, previousListData, inviteCodeId }
      },
      
      onSuccess: (data: ApiResponse<InviteCodeResponse>, inviteCodeId: number, context: any) => {
        toast.dismiss('reset-usage')
        
        if (data.code === 0) {
          toast.success('使用次数重置成功', {
            description: '邀请码使用次数已重置为0'
          })
          
          invalidationUtils.invalidateInviteCodeQueries(queryClient, inviteCodeId)
          invalidationUtils.invalidateStatsQueries(queryClient)
        } else {
          toast.error('重置失败', {
            description: data.message || '重置使用次数时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, inviteCodeId: number, context: any) => {
        toast.dismiss('reset-usage')
        
        // 回滚更新
        if (context?.previousInviteCodeData) {
          queryClient.setQueryData(queryKeys.inviteCodes.detail(inviteCodeId), context.previousInviteCodeData)
        }
        if (context?.previousListData) {
          context.previousListData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'resetInviteCodeUsage',
          inviteCodeId
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('重置失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 延长邀请码有效期 Mutation ====================

/**
 * 延长邀请码有效期
 */
export const useExtendInviteCodeValidity = (options?: Partial<UseMutationOptions<ApiResponse<InviteCodeResponse>, Error, ExtendValidityParams>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, validUntil }: ExtendValidityParams) => 
      inviteCodeService.extendInviteCodeValidity(id, validUntil),
    ...createMutationOptions({
      onMutate: async ({ id, validUntil }: ExtendValidityParams) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.inviteCodes.detail(id) })
        await queryClient.cancelQueries({ queryKey: queryKeys.inviteCodes.lists() })
        
        const previousInviteCodeData = queryClient.getQueryData(queryKeys.inviteCodes.detail(id))
        const previousListData = queryClient.getQueriesData({ queryKey: queryKeys.inviteCodes.lists() })
        
        // 乐观更新：延长有效期
        optimisticUpdateUtils.optimisticallyUpdateInviteCode(queryClient, id, { 
          valid_until: validUntil,
          status: 'active' // 延长有效期后可能从过期状态恢复为活跃状态
        })
        
        toast.loading('正在延长有效期...', { id: 'extend-validity' })
        
        return { previousInviteCodeData, previousListData, inviteCodeId: id }
      },
      
      onSuccess: (data: ApiResponse<InviteCodeResponse>, variables, context: any) => {
        toast.dismiss('extend-validity')
        
        if (data.code === 0) {
          const newDate = new Date(variables.validUntil).toLocaleDateString('zh-CN')
          toast.success('有效期延长成功', {
            description: `邀请码有效期已延长至 ${newDate}`
          })
          
          invalidationUtils.invalidateInviteCodeQueries(queryClient, variables.id)
        } else {
          toast.error('延长失败', {
            description: data.message || '延长有效期时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('extend-validity')
        
        // 回滚更新
        if (context?.previousInviteCodeData) {
          queryClient.setQueryData(queryKeys.inviteCodes.detail(context.inviteCodeId), context.previousInviteCodeData)
        }
        if (context?.previousListData) {
          context.previousListData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'extendInviteCodeValidity',
          inviteCodeId: variables.id,
          validUntil: variables.validUntil
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('延长失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 导出 ====================

export default {
  useCreateInviteCode,
  useUpdateInviteCode,
  useDeleteInviteCode,
  useGenerateBatchInviteCodes,
  useToggleInviteCodeStatus,
  useResetInviteCodeUsage,
  useExtendInviteCodeValidity,
}

// 导出工具函数
export {
  optimisticUpdateUtils,
  invalidationUtils,
}

// 导出类型
export type {
  ToggleStatusParams,
  ExtendValidityParams,
  OptimisticInviteCodeUpdate,
  BatchOperationResult,
  InviteCodeMutationContext,
}