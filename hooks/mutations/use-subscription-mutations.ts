'use client'

/**
 * 订阅变更 Hooks
 * 
 * 基于 React Query 实现的订阅数据变更钩子集合
 * 支持订阅计划和用户订阅的完整 CRUD 操作，包含乐观更新机制
 * 遵循统一的缓存策略和错误处理机制
 * 
 * 任务16实现：FR-3 乐观更新机制
 * - 乐观更新订阅计划和用户订阅列表
 * - 操作失败自动回滚
 * - 成功后刷新相关查询
 * - Toast消息提示
 * - 统一的错误处理和loading状态管理
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'
import { subscriptionService } from '@/lib/subscription-service'
import { queryKeys, CacheInvalidationUtils } from '@/lib/query-keys'
import { createMutationOptions } from '@/lib/cache-strategies'
import { reactQueryErrorUtils, errorUtils } from '@/lib/error-handler'
import {
  SubscriptionPlan,
  UserSubscription,
  CreatePlanRequest,
  UpdatePlanRequest,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  PaginatedResponse,
  StandardResponse
} from '@/lib/subscription-types'

// ==================== 类型定义 ====================

/**
 * 订阅变更操作上下文
 */
interface SubscriptionMutationContext {
  operation: string
  subscriptionId?: number
  planId?: number
  subscriptionIds?: number[]
  previousData?: any
}

/**
 * 乐观更新订阅数据
 */
interface OptimisticSubscriptionUpdate {
  id: number
  data: Partial<UserSubscription | SubscriptionPlan>
  operation: 'create' | 'update' | 'delete' | 'pause' | 'resume' | 'cancel'
}

/**
 * 批量操作结果
 */
interface BatchSubscriptionOperationResult {
  successCount: number
  failedCount: number
  failedIds: number[]
  errors: string[]
}

// ==================== 乐观更新工具函数 ====================

/**
 * 乐观更新工具函数
 */
export const optimisticUpdateUtils = {
  /**
   * 乐观更新订阅计划列表 - 创建计划
   */
  optimisticallyAddPlan: (queryClient: any, newPlan: SubscriptionPlan) => {
    const listQueryKeys = ['subscriptions', 'plans', 'list']
    
    queryClient.setQueriesData(
      { queryKey: listQueryKeys, exact: false },
      (oldData: PaginatedResponse<SubscriptionPlan> | undefined) => {
        if (!oldData?.data?.items) return oldData
        
        return {
          ...oldData,
          data: {
            ...oldData.data,
            items: [newPlan, ...oldData.data.items],
            pagination: {
              ...oldData.data.pagination,
              total: oldData.data.pagination.total + 1
            }
          }
        }
      }
    )
  },

  /**
   * 乐观更新订阅计划列表 - 更新计划
   */
  optimisticallyUpdatePlan: (queryClient: any, planId: number, updatedData: Partial<SubscriptionPlan>) => {
    // 更新列表中的计划
    const listQueryKeys = ['subscriptions', 'plans', 'list']
    queryClient.setQueriesData(
      { queryKey: listQueryKeys, exact: false },
      (oldData: PaginatedResponse<SubscriptionPlan> | undefined) => {
        if (!oldData?.data?.items) return oldData
        
        return {
          ...oldData,
          data: {
            ...oldData.data,
            items: oldData.data.items.map(plan => 
              plan.id === planId 
                ? { ...plan, ...updatedData, updated_at: new Date().toISOString() }
                : plan
            )
          }
        }
      }
    )

    // 更新计划详情
    const detailQueryKey = queryKeys.subscriptions.plans.detail(planId)
    queryClient.setQueryData(detailQueryKey, (oldData: StandardResponse<SubscriptionPlan> | undefined) => {
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
   * 乐观更新订阅计划列表 - 删除计划
   */
  optimisticallyRemovePlan: (queryClient: any, planId: number) => {
    const listQueryKeys = ['subscriptions', 'plans', 'list']
    
    queryClient.setQueriesData(
      { queryKey: listQueryKeys, exact: false },
      (oldData: PaginatedResponse<SubscriptionPlan> | undefined) => {
        if (!oldData?.data?.items) return oldData
        
        return {
          ...oldData,
          data: {
            ...oldData.data,
            items: oldData.data.items.filter(plan => plan.id !== planId),
            pagination: {
              ...oldData.data.pagination,
              total: Math.max(0, oldData.data.pagination.total - 1)
            }
          }
        }
      }
    )
  },

  /**
   * 乐观更新用户订阅列表 - 创建订阅
   */
  optimisticallyAddUserSubscription: (queryClient: any, newSubscription: UserSubscription) => {
    const listQueryKeys = ['subscriptions', 'users', 'list']
    
    queryClient.setQueriesData(
      { queryKey: listQueryKeys, exact: false },
      (oldData: PaginatedResponse<UserSubscription> | undefined) => {
        if (!oldData?.data?.items) return oldData
        
        return {
          ...oldData,
          data: {
            ...oldData.data,
            items: [newSubscription, ...oldData.data.items],
            pagination: {
              ...oldData.data.pagination,
              total: oldData.data.pagination.total + 1
            }
          }
        }
      }
    )
  },

  /**
   * 乐观更新用户订阅列表 - 更新订阅
   */
  optimisticallyUpdateUserSubscription: (queryClient: any, subscriptionId: number, updatedData: Partial<UserSubscription>) => {
    // 更新列表中的订阅
    const listQueryKeys = ['subscriptions', 'users', 'list']
    queryClient.setQueriesData(
      { queryKey: listQueryKeys, exact: false },
      (oldData: PaginatedResponse<UserSubscription> | undefined) => {
        if (!oldData?.data?.items) return oldData
        
        return {
          ...oldData,
          data: {
            ...oldData.data,
            items: oldData.data.items.map(subscription => 
              subscription.id === subscriptionId 
                ? { ...subscription, ...updatedData, updated_at: new Date().toISOString() }
                : subscription
            )
          }
        }
      }
    )

    // 更新订阅详情
    const detailQueryKey = queryKeys.subscriptions.users.detail(subscriptionId)
    queryClient.setQueryData(detailQueryKey, (oldData: StandardResponse<UserSubscription> | undefined) => {
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

    // 更新"我的订阅"查询
    queryClient.setQueriesData(
      { queryKey: ['subscriptions', 'my'], exact: false },
      (oldData: PaginatedResponse<UserSubscription> | undefined) => {
        if (!oldData?.data?.items) return oldData
        
        return {
          ...oldData,
          data: {
            ...oldData.data,
            items: oldData.data.items.map(subscription => 
              subscription.id === subscriptionId 
                ? { ...subscription, ...updatedData, updated_at: new Date().toISOString() }
                : subscription
            )
          }
        }
      }
    )
  },

  /**
   * 批量乐观更新用户订阅状态
   */
  optimisticallyUpdateUserSubscriptions: (queryClient: any, subscriptionIds: number[], updatedData: Partial<UserSubscription>) => {
    const listQueryKeys = ['subscriptions', 'users', 'list']
    
    queryClient.setQueriesData(
      { queryKey: listQueryKeys, exact: false },
      (oldData: PaginatedResponse<UserSubscription> | undefined) => {
        if (!oldData?.data?.items) return oldData
        
        return {
          ...oldData,
          data: {
            ...oldData.data,
            items: oldData.data.items.map(subscription => 
              subscriptionIds.includes(subscription.id)
                ? { ...subscription, ...updatedData, updated_at: new Date().toISOString() }
                : subscription
            )
          }
        }
      }
    )
  }
}

// ==================== 缓存失效工具函数 ====================

/**
 * 缓存失效工具函数
 */
export const invalidationUtils = {
  /**
   * 失效订阅相关的所有查询
   */
  invalidateSubscriptionQueries: async (queryClient: any, subscriptionId?: number) => {
    // 失效订阅模块的所有查询
    await queryClient.invalidateQueries({ 
      queryKey: CacheInvalidationUtils.getModulePrefix('subscriptions') 
    })
    
    // 失效相关模块的查询
    const relatedModules = CacheInvalidationUtils.getRelatedModules('subscriptions')
    for (const module of relatedModules) {
      await queryClient.invalidateQueries({ 
        queryKey: CacheInvalidationUtils.getModulePrefix(module) 
      })
    }
    
    // 如果有特定订阅ID，失效该订阅的详情
    if (subscriptionId) {
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.subscriptions.users.detail(subscriptionId) 
      })
    }
  },

  /**
   * 失效订阅计划查询
   */
  invalidatePlanQueries: async (queryClient: any, planId?: number) => {
    await queryClient.invalidateQueries({ 
      queryKey: queryKeys.subscriptions.plans.all 
    })
    
    if (planId) {
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.subscriptions.plans.detail(planId) 
      })
    }
  },

  /**
   * 失效统计相关查询
   */
  invalidateStatsQueries: async (queryClient: any) => {
    await queryClient.invalidateQueries({ 
      queryKey: queryKeys.dashboard.all 
    })
  }
}

// ==================== 订阅计划变更 Mutations ====================

/**
 * 创建订阅计划
 */
export const useCreateSubscriptionPlan = (options?: Partial<UseMutationOptions<StandardResponse<SubscriptionPlan>, Error, CreatePlanRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (planData: CreatePlanRequest) => subscriptionService.createPlan(planData),
    ...createMutationOptions({
      onMutate: async (planData: CreatePlanRequest) => {
        // 取消正在进行的计划列表查询
        await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.plans.lists() })
        
        // 保存当前数据用于回滚
        const previousData = queryClient.getQueriesData({ queryKey: queryKeys.subscriptions.plans.lists() })
        
        // 乐观更新：创建临时计划对象
        const optimisticPlan: SubscriptionPlan = {
          id: Date.now(), // 临时ID
          name: planData.name,
          code: planData.code,
          description: planData.description,
          price: planData.price,
          currency: planData.currency,
          billing_cycle: planData.billing_cycle,
          billing_interval: planData.billing_interval || 1,
          trial_period_days: planData.trial_period_days || 0,
          status: 'active',
          is_visible: planData.is_visible ?? true,
          sort_order: planData.sort_order || 0,
          is_popular: planData.is_popular || false,
          is_recommended: planData.is_recommended || false,
          setup_fee: planData.setup_fee || 0,
          cancellation_fee: planData.cancellation_fee || 0,
          traffic_limit: planData.traffic_limit,
          traffic_limit_gb: Math.round(planData.traffic_limit / (1024 * 1024 * 1024) * 100) / 100,
          traffic_limit_text: formatTrafficLimit(planData.traffic_limit),
          traffic_reset_cycle: planData.traffic_reset_cycle,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          features: planData.features,
          limits: planData.limits,
          default_server_group_ids: planData.default_server_group_ids
        }
        
        // 应用乐观更新
        optimisticUpdateUtils.optimisticallyAddPlan(queryClient, optimisticPlan)
        
        // 显示操作中的提示
        toast.loading('正在创建订阅计划...', { id: 'create-plan' })
        
        return { previousData, optimisticPlan }
      },
      
      onSuccess: (data: StandardResponse<SubscriptionPlan>, variables: CreatePlanRequest, context: any) => {
        // 操作成功
        toast.dismiss('create-plan')
        
        if (data.code === 0) {
          toast.success('订阅计划创建成功', {
            description: `计划 ${data.data.name} 已成功创建`
          })
          
          // 失效相关查询以获取最新数据
          invalidationUtils.invalidatePlanQueries(queryClient)
          invalidationUtils.invalidateStatsQueries(queryClient)
        } else {
          toast.error('订阅计划创建失败', {
            description: data.message || '创建计划时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables: CreatePlanRequest, context: any) => {
        // 操作失败，回滚乐观更新
        toast.dismiss('create-plan')
        
        if (context?.previousData) {
          // 恢复之前的数据
          context.previousData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        // 处理错误并显示用户友好的消息
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'createSubscriptionPlan',
          planData: variables
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('订阅计划创建失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 更新订阅计划
 */
export const useUpdateSubscriptionPlan = (options?: Partial<UseMutationOptions<StandardResponse<SubscriptionPlan>, Error, { id: number; data: UpdatePlanRequest }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePlanRequest }) => 
      subscriptionService.updatePlan(id, data),
    ...createMutationOptions({
      onMutate: async ({ id, data }: { id: number; data: UpdatePlanRequest }) => {
        // 取消相关查询
        await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.plans.detail(id) })
        await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.plans.lists() })
        
        // 保存当前数据
        const previousPlanData = queryClient.getQueryData(queryKeys.subscriptions.plans.detail(id))
        const previousListData = queryClient.getQueriesData({ queryKey: queryKeys.subscriptions.plans.lists() })
        
        // 乐观更新
        optimisticUpdateUtils.optimisticallyUpdatePlan(queryClient, id, data)
        
        toast.loading('正在更新订阅计划...', { id: 'update-plan' })
        
        return { previousPlanData, previousListData, planId: id }
      },
      
      onSuccess: (data: StandardResponse<SubscriptionPlan>, variables, context: any) => {
        toast.dismiss('update-plan')
        
        if (data.code === 0) {
          toast.success('订阅计划更新成功', {
            description: `计划信息已成功更新`
          })
          
          // 失效相关查询
          invalidationUtils.invalidatePlanQueries(queryClient, variables.id)
        } else {
          toast.error('订阅计划更新失败', {
            description: data.message || '更新计划时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('update-plan')
        
        // 回滚乐观更新
        if (context?.previousPlanData) {
          queryClient.setQueryData(queryKeys.subscriptions.plans.detail(context.planId), context.previousPlanData)
        }
        if (context?.previousListData) {
          context.previousListData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'updateSubscriptionPlan',
          planId: variables.id,
          planData: variables.data
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('订阅计划更新失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 删除订阅计划
 */
export const useDeleteSubscriptionPlan = (options?: Partial<UseMutationOptions<StandardResponse<void>, Error, number>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (planId: number) => subscriptionService.deletePlan(planId),
    ...createMutationOptions({
      onMutate: async (planId: number) => {
        // 取消相关查询
        await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.plans.lists() })
        await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.plans.detail(planId) })
        
        // 保存当前数据
        const previousPlanData = queryClient.getQueryData(queryKeys.subscriptions.plans.detail(planId))
        const previousListData = queryClient.getQueriesData({ queryKey: queryKeys.subscriptions.plans.lists() })
        
        // 乐观更新：从列表中移除计划
        optimisticUpdateUtils.optimisticallyRemovePlan(queryClient, planId)
        
        toast.loading('正在删除订阅计划...', { id: 'delete-plan' })
        
        return { previousPlanData, previousListData, planId }
      },
      
      onSuccess: (data: StandardResponse<void>, planId: number, context: any) => {
        toast.dismiss('delete-plan')
        
        if (data.code === 0) {
          toast.success('订阅计划删除成功', {
            description: '计划已被成功删除'
          })
          
          // 失效相关查询
          invalidationUtils.invalidatePlanQueries(queryClient, planId)
          invalidationUtils.invalidateStatsQueries(queryClient)
        } else {
          toast.error('订阅计划删除失败', {
            description: data.message || '删除计划时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, planId: number, context: any) => {
        toast.dismiss('delete-plan')
        
        // 回滚乐观更新
        if (context?.previousPlanData) {
          queryClient.setQueryData(queryKeys.subscriptions.plans.detail(planId), context.previousPlanData)
        }
        if (context?.previousListData) {
          context.previousListData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'deleteSubscriptionPlan',
          planId
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('订阅计划删除失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 切换计划状态
 */
export const useTogglePlanStatus = (options?: Partial<UseMutationOptions<StandardResponse<SubscriptionPlan>, Error, number>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (planId: number) => subscriptionService.togglePlanStatus(planId),
    ...createMutationOptions({
      onMutate: async (planId: number) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.plans.detail(planId) })
        await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.plans.lists() })
        
        const previousPlanData = queryClient.getQueryData(queryKeys.subscriptions.plans.detail(planId))
        const previousListData = queryClient.getQueriesData({ queryKey: queryKeys.subscriptions.plans.lists() })
        
        // 乐观更新状态（假设切换成功）
        const currentData = previousPlanData as StandardResponse<SubscriptionPlan>
        if (currentData?.data) {
          const newStatus = currentData.data.status === 'active' ? 'inactive' : 'active'
          optimisticUpdateUtils.optimisticallyUpdatePlan(queryClient, planId, { status: newStatus })
        }
        
        toast.loading('正在切换计划状态...', { id: 'toggle-plan-status' })
        
        return { previousPlanData, previousListData, planId }
      },
      
      onSuccess: (data: StandardResponse<SubscriptionPlan>, planId: number, context: any) => {
        toast.dismiss('toggle-plan-status')
        
        if (data.code === 0) {
          toast.success('计划状态更新成功')
          invalidationUtils.invalidatePlanQueries(queryClient, planId)
        } else {
          toast.error('计划状态更新失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, planId: number, context: any) => {
        toast.dismiss('toggle-plan-status')
        
        // 回滚更新
        if (context?.previousPlanData) {
          queryClient.setQueryData(queryKeys.subscriptions.plans.detail(context.planId), context.previousPlanData)
        }
        if (context?.previousListData) {
          context.previousListData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'togglePlanStatus',
          planId
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('计划状态更新失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 用户订阅变更 Mutations ====================

/**
 * 创建用户订阅
 */
export const useCreateUserSubscription = (options?: Partial<UseMutationOptions<StandardResponse<UserSubscription>, Error, CreateSubscriptionRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (subscriptionData: CreateSubscriptionRequest) => 
      subscriptionService.createUserSubscription(subscriptionData),
    ...createMutationOptions({
      onMutate: async (subscriptionData: CreateSubscriptionRequest) => {
        // 取消正在进行的订阅列表查询
        await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.users.lists() })
        
        // 保存当前数据用于回滚
        const previousData = queryClient.getQueriesData({ queryKey: queryKeys.subscriptions.users.lists() })
        
        // 显示操作中的提示
        toast.loading('正在创建用户订阅...', { id: 'create-subscription' })
        
        return { previousData }
      },
      
      onSuccess: (data: StandardResponse<UserSubscription>, variables: CreateSubscriptionRequest, context: any) => {
        // 操作成功
        toast.dismiss('create-subscription')
        
        if (data.code === 0) {
          toast.success('用户订阅创建成功', {
            description: `已为用户创建订阅`
          })
          
          // 失效相关查询以获取最新数据
          invalidationUtils.invalidateSubscriptionQueries(queryClient)
          invalidationUtils.invalidateStatsQueries(queryClient)
        } else {
          toast.error('用户订阅创建失败', {
            description: data.message || '创建订阅时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables: CreateSubscriptionRequest, context: any) => {
        // 操作失败，回滚乐观更新
        toast.dismiss('create-subscription')
        
        // 处理错误并显示用户友好的消息
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'createUserSubscription',
          subscriptionData: variables
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('用户订阅创建失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 更新用户订阅
 */
export const useUpdateUserSubscription = (options?: Partial<UseMutationOptions<StandardResponse<UserSubscription>, Error, { id: number; data: UpdateSubscriptionRequest }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSubscriptionRequest }) => 
      subscriptionService.updateUserSubscription(id, data),
    ...createMutationOptions({
      onMutate: async ({ id, data }: { id: number; data: UpdateSubscriptionRequest }) => {
        // 取消相关查询
        await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.users.detail(id) })
        await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.users.lists() })
        
        // 保存当前数据
        const previousSubscriptionData = queryClient.getQueryData(queryKeys.subscriptions.users.detail(id))
        const previousListData = queryClient.getQueriesData({ queryKey: queryKeys.subscriptions.users.lists() })
        
        // 乐观更新
        optimisticUpdateUtils.optimisticallyUpdateUserSubscription(queryClient, id, data)
        
        toast.loading('正在更新用户订阅...', { id: 'update-subscription' })
        
        return { previousSubscriptionData, previousListData, subscriptionId: id }
      },
      
      onSuccess: (data: StandardResponse<UserSubscription>, variables, context: any) => {
        toast.dismiss('update-subscription')
        
        if (data.code === 0) {
          toast.success('用户订阅更新成功', {
            description: `订阅信息已成功更新`
          })
          
          // 失效相关查询
          invalidationUtils.invalidateSubscriptionQueries(queryClient, variables.id)
        } else {
          toast.error('用户订阅更新失败', {
            description: data.message || '更新订阅时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('update-subscription')
        
        // 回滚乐观更新
        if (context?.previousSubscriptionData) {
          queryClient.setQueryData(queryKeys.subscriptions.users.detail(context.subscriptionId), context.previousSubscriptionData)
        }
        if (context?.previousListData) {
          context.previousListData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'updateUserSubscription',
          subscriptionId: variables.id,
          subscriptionData: variables.data
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('用户订阅更新失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 订阅操作 Mutations ====================

/**
 * 取消用户订阅
 */
export const useCancelUserSubscription = (options?: Partial<UseMutationOptions<StandardResponse<void>, Error, { id: number; reason?: string; cancelAtPeriodEnd?: boolean }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, reason, cancelAtPeriodEnd }: { id: number; reason?: string; cancelAtPeriodEnd?: boolean }) => 
      subscriptionService.cancelUserSubscription(id, reason, cancelAtPeriodEnd),
    ...createMutationOptions({
      onMutate: async ({ id, cancelAtPeriodEnd }) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.users.detail(id) })
        await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.users.lists() })
        
        const previousSubscriptionData = queryClient.getQueryData(queryKeys.subscriptions.users.detail(id))
        const previousListData = queryClient.getQueriesData({ queryKey: queryKeys.subscriptions.users.lists() })
        
        // 乐观更新状态
        optimisticUpdateUtils.optimisticallyUpdateUserSubscription(queryClient, id, { 
          status: 'cancelled',
          cancel_at_period_end: cancelAtPeriodEnd || false,
          cancelled_at: new Date().toISOString()
        })
        
        toast.loading('正在取消订阅...', { id: 'cancel-subscription' })
        
        return { previousSubscriptionData, previousListData, subscriptionId: id }
      },
      
      onSuccess: (data: StandardResponse<void>, variables, context: any) => {
        toast.dismiss('cancel-subscription')
        
        if (data.code === 0) {
          toast.success('订阅取消成功')
          invalidationUtils.invalidateSubscriptionQueries(queryClient, variables.id)
        } else {
          toast.error('订阅取消失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('cancel-subscription')
        
        // 回滚更新
        if (context?.previousSubscriptionData) {
          queryClient.setQueryData(queryKeys.subscriptions.users.detail(context.subscriptionId), context.previousSubscriptionData)
        }
        if (context?.previousListData) {
          context.previousListData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'cancelUserSubscription',
          subscriptionId: variables.id
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('订阅取消失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 暂停用户订阅
 */
export const usePauseSubscription = (options?: Partial<UseMutationOptions<StandardResponse<UserSubscription>, Error, { id: number; reason?: string; maxPauseDuration?: number }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, reason, maxPauseDuration }: { id: number; reason?: string; maxPauseDuration?: number }) => 
      subscriptionService.pauseSubscription(id, reason, maxPauseDuration),
    ...createMutationOptions({
      onMutate: async ({ id }) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.users.detail(id) })
        await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.users.lists() })
        
        const previousSubscriptionData = queryClient.getQueryData(queryKeys.subscriptions.users.detail(id))
        const previousListData = queryClient.getQueriesData({ queryKey: queryKeys.subscriptions.users.lists() })
        
        // 乐观更新状态
        optimisticUpdateUtils.optimisticallyUpdateUserSubscription(queryClient, id, { 
          status: 'inactive' // 暂停后状态通常为 inactive
        })
        
        toast.loading('正在暂停订阅...', { id: 'pause-subscription' })
        
        return { previousSubscriptionData, previousListData, subscriptionId: id }
      },
      
      onSuccess: (data: StandardResponse<UserSubscription>, variables, context: any) => {
        toast.dismiss('pause-subscription')
        
        if (data.code === 0) {
          toast.success('订阅暂停成功')
          invalidationUtils.invalidateSubscriptionQueries(queryClient, variables.id)
        } else {
          toast.error('订阅暂停失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('pause-subscription')
        
        // 回滚更新
        if (context?.previousSubscriptionData) {
          queryClient.setQueryData(queryKeys.subscriptions.users.detail(context.subscriptionId), context.previousSubscriptionData)
        }
        if (context?.previousListData) {
          context.previousListData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'pauseSubscription',
          subscriptionId: variables.id
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('订阅暂停失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 恢复用户订阅
 */
export const useResumeSubscription = (options?: Partial<UseMutationOptions<StandardResponse<UserSubscription>, Error, { id: number; adjustBillingDate?: boolean }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, adjustBillingDate }: { id: number; adjustBillingDate?: boolean }) => 
      subscriptionService.resumeSubscription(id, adjustBillingDate),
    ...createMutationOptions({
      onMutate: async ({ id }) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.users.detail(id) })
        await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.users.lists() })
        
        const previousSubscriptionData = queryClient.getQueryData(queryKeys.subscriptions.users.detail(id))
        const previousListData = queryClient.getQueriesData({ queryKey: queryKeys.subscriptions.users.lists() })
        
        // 乐观更新状态
        optimisticUpdateUtils.optimisticallyUpdateUserSubscription(queryClient, id, { 
          status: 'active' // 恢复后状态为 active
        })
        
        toast.loading('正在恢复订阅...', { id: 'resume-subscription' })
        
        return { previousSubscriptionData, previousListData, subscriptionId: id }
      },
      
      onSuccess: (data: StandardResponse<UserSubscription>, variables, context: any) => {
        toast.dismiss('resume-subscription')
        
        if (data.code === 0) {
          toast.success('订阅恢复成功')
          invalidationUtils.invalidateSubscriptionQueries(queryClient, variables.id)
        } else {
          toast.error('订阅恢复失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('resume-subscription')
        
        // 回滚更新
        if (context?.previousSubscriptionData) {
          queryClient.setQueryData(queryKeys.subscriptions.users.detail(context.subscriptionId), context.previousSubscriptionData)
        }
        if (context?.previousListData) {
          context.previousListData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'resumeSubscription',
          subscriptionId: variables.id
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('订阅恢复失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 延长用户订阅
 */
export const useExtendUserSubscription = (options?: Partial<UseMutationOptions<StandardResponse<UserSubscription>, Error, { id: number; extendByDays: number; reason: string; sendNotification?: boolean }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, extendByDays, reason, sendNotification }: { id: number; extendByDays: number; reason: string; sendNotification?: boolean }) => 
      subscriptionService.extendUserSubscription(id, extendByDays, reason, sendNotification),
    ...createMutationOptions({
      onMutate: async ({ id, extendByDays }) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.users.detail(id) })
        await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.users.lists() })
        
        const previousSubscriptionData = queryClient.getQueryData(queryKeys.subscriptions.users.detail(id))
        const previousListData = queryClient.getQueriesData({ queryKey: queryKeys.subscriptions.users.lists() })
        
        // 乐观更新：延长订阅结束时间
        const currentData = previousSubscriptionData as StandardResponse<UserSubscription>
        if (currentData?.data) {
          const currentEndDate = new Date(currentData.data.end_date)
          const newEndDate = new Date(currentEndDate.getTime() + extendByDays * 24 * 60 * 60 * 1000)
          
          optimisticUpdateUtils.optimisticallyUpdateUserSubscription(queryClient, id, { 
            end_date: newEndDate.toISOString(),
            days_left: Math.ceil((newEndDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
          })
        }
        
        toast.loading(`正在延长订阅 ${extendByDays} 天...`, { id: 'extend-subscription' })
        
        return { previousSubscriptionData, previousListData, subscriptionId: id }
      },
      
      onSuccess: (data: StandardResponse<UserSubscription>, variables, context: any) => {
        toast.dismiss('extend-subscription')
        
        if (data.code === 0) {
          toast.success('订阅延长成功', {
            description: `订阅已延长 ${variables.extendByDays} 天`
          })
          invalidationUtils.invalidateSubscriptionQueries(queryClient, variables.id)
        } else {
          toast.error('订阅延长失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('extend-subscription')
        
        // 回滚更新
        if (context?.previousSubscriptionData) {
          queryClient.setQueryData(queryKeys.subscriptions.users.detail(context.subscriptionId), context.previousSubscriptionData)
        }
        if (context?.previousListData) {
          context.previousListData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'extendUserSubscription',
          subscriptionId: variables.id
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('订阅延长失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 重置用户流量
 */
export const useResetUserTraffic = (options?: Partial<UseMutationOptions<StandardResponse<UserSubscription>, Error, { id: number; reason: string; sendNotification?: boolean }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, reason, sendNotification }: { id: number; reason: string; sendNotification?: boolean }) => 
      subscriptionService.resetUserTraffic(id, reason, sendNotification),
    ...createMutationOptions({
      onMutate: async ({ id }) => {
        toast.loading('正在重置流量...', { id: 'reset-traffic' })
        return { subscriptionId: id }
      },
      
      onSuccess: (data: StandardResponse<UserSubscription>, variables, context: any) => {
        toast.dismiss('reset-traffic')
        
        if (data.code === 0) {
          toast.success('流量重置成功')
          invalidationUtils.invalidateSubscriptionQueries(queryClient, variables.id)
        } else {
          toast.error('流量重置失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('reset-traffic')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'resetUserTraffic',
          subscriptionId: variables.id
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('流量重置失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 设置自动续费
 */
export const useSetAutoRenew = (options?: Partial<UseMutationOptions<StandardResponse<UserSubscription>, Error, { id: number; autoRenew: boolean }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, autoRenew }: { id: number; autoRenew: boolean }) => 
      subscriptionService.setAutoRenew(id, autoRenew),
    ...createMutationOptions({
      onMutate: async ({ id, autoRenew }) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.users.detail(id) })
        await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.users.lists() })
        
        const previousSubscriptionData = queryClient.getQueryData(queryKeys.subscriptions.users.detail(id))
        const previousListData = queryClient.getQueriesData({ queryKey: queryKeys.subscriptions.users.lists() })
        
        // 乐观更新自动续费状态
        optimisticUpdateUtils.optimisticallyUpdateUserSubscription(queryClient, id, { 
          auto_renew: autoRenew
        })
        
        toast.loading(`正在${autoRenew ? '开启' : '关闭'}自动续费...`, { id: 'set-auto-renew' })
        
        return { previousSubscriptionData, previousListData, subscriptionId: id }
      },
      
      onSuccess: (data: StandardResponse<UserSubscription>, variables, context: any) => {
        toast.dismiss('set-auto-renew')
        
        if (data.code === 0) {
          toast.success(`自动续费${variables.autoRenew ? '开启' : '关闭'}成功`)
          invalidationUtils.invalidateSubscriptionQueries(queryClient, variables.id)
        } else {
          toast.error(`自动续费设置失败`, {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('set-auto-renew')
        
        // 回滚更新
        if (context?.previousSubscriptionData) {
          queryClient.setQueryData(queryKeys.subscriptions.users.detail(context.subscriptionId), context.previousSubscriptionData)
        }
        if (context?.previousListData) {
          context.previousListData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'setAutoRenew',
          subscriptionId: variables.id,
          autoRenew: variables.autoRenew
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('自动续费设置失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 批量操作 Mutations ====================

/**
 * 批量操作用户订阅
 */
export const useBulkSubscriptionAction = (options?: Partial<UseMutationOptions<StandardResponse<any>, Error, { action: 'pause' | 'resume' | 'cancel' | 'extend' | 'reset_traffic'; subscriptionIds: number[]; options?: { extendByDays?: number; reason?: string } }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ action, subscriptionIds, options: actionOptions }: { action: 'pause' | 'resume' | 'cancel' | 'extend' | 'reset_traffic'; subscriptionIds: number[]; options?: { extendByDays?: number; reason?: string } }) => 
      subscriptionService.bulkSubscriptionAction(action, subscriptionIds, actionOptions || {}),
    ...createMutationOptions({
      onMutate: async ({ action, subscriptionIds }) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.users.lists() })
        
        const previousData = queryClient.getQueriesData({ queryKey: queryKeys.subscriptions.users.lists() })
        
        // 乐观更新：批量更新订阅状态
        let statusUpdate: Partial<UserSubscription> = {}
        switch (action) {
          case 'pause':
            statusUpdate = { status: 'inactive' }
            break
          case 'resume':
            statusUpdate = { status: 'active' }
            break
          case 'cancel':
            statusUpdate = { status: 'cancelled', cancelled_at: new Date().toISOString() }
            break
        }
        
        if (Object.keys(statusUpdate).length > 0) {
          optimisticUpdateUtils.optimisticallyUpdateUserSubscriptions(queryClient, subscriptionIds, statusUpdate)
        }
        
        toast.loading(`正在批量${getActionText(action)} ${subscriptionIds.length} 个订阅...`, { id: 'bulk-action' })
        
        return { previousData, action, subscriptionIds }
      },
      
      onSuccess: (data: StandardResponse<any>, variables, context: any) => {
        toast.dismiss('bulk-action')
        
        if (data.code === 0) {
          toast.success(`批量${getActionText(variables.action)}成功`, {
            description: `成功处理 ${variables.subscriptionIds.length} 个订阅`
          })
          invalidationUtils.invalidateSubscriptionQueries(queryClient)
        } else {
          toast.error(`批量${getActionText(variables.action)}失败`, {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('bulk-action')
        
        // 回滚乐观更新
        if (context?.previousData) {
          context.previousData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'bulkSubscriptionAction',
          action: variables.action,
          subscriptionIds: variables.subscriptionIds
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error(`批量${getActionText(variables.action)}失败`, {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 工具函数 ====================

/**
 * 格式化流量限制
 */
function formatTrafficLimit(bytes: number): string {
  if (bytes === 0) return '无限制'
  
  const gb = bytes / (1024 * 1024 * 1024)
  if (gb >= 1) {
    return `${Math.round(gb * 100) / 100} GB`
  }
  
  const mb = bytes / (1024 * 1024)
  return `${Math.round(mb)} MB`
}

/**
 * 获取操作文本
 */
function getActionText(action: string): string {
  const texts: Record<string, string> = {
    pause: '暂停',
    resume: '恢复',
    cancel: '取消',
    extend: '延长',
    reset_traffic: '重置流量'
  }
  
  return texts[action] || action
}

// ==================== 默认导出 ====================

export default {
  // 订阅计划变更
  useCreateSubscriptionPlan,
  useUpdateSubscriptionPlan,
  useDeleteSubscriptionPlan,
  useTogglePlanStatus,
  
  // 用户订阅变更
  useCreateUserSubscription,
  useUpdateUserSubscription,
  
  // 订阅操作
  useCancelUserSubscription,
  usePauseSubscription,
  useResumeSubscription,
  useExtendUserSubscription,
  useResetUserTraffic,
  useSetAutoRenew,
  
  // 批量操作
  useBulkSubscriptionAction,
}