'use client'

/**
 * 订阅查询 Hooks
 * 
 * 基于 React Query 实现的订阅数据查询钩子集合
 * 支持订阅计划和用户订阅的完整 CRUD 操作
 * 遵循统一的缓存策略和错误处理机制
 * 
 * 任务16实现：FR-2 统一数据获取Hooks
 * - 支持所有订阅相关API参数 (limit, offset, sort等)
 * - 返回标准化的 {data, isLoading, error, refetch} 接口
 * - 自动处理分页响应格式 (PaginatedResponse)
 * - 乐观更新机制和错误回滚
 * - 适当的缓存策略配置
 * 
 * 任务20优化：智能预加载和性能监控
 * - 集成智能预加载机制
 * - NFR-1性能要求合规
 * - 实时性能监控和分析
 * - 缓存命中率优化
 * - 内存使用管理
 */

import { useQuery, useInfiniteQuery, useMutation, useQueryClient, UseQueryOptions, UseInfiniteQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { subscriptionService } from '@/lib/subscription-service'
import { queryKeys, CacheInvalidationUtils } from '@/lib/query-keys'
import { createQueryOptions, createMutationOptions, DataType } from '@/lib/cache-strategies'
import { reactQueryErrorUtils, errorUtils } from '@/lib/error-handler'
import { useSubscriptionPreloader } from './use-subscription-preloader'
import { useSubscriptionPerformanceMonitor } from '../use-subscription-performance-monitor'
import { useAdvancedCacheManager } from '../use-advanced-cache-manager'
import {
  SubscriptionPlan,
  UserSubscription,
  CreatePlanRequest,
  UpdatePlanRequest,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  PlanFilters,
  SubscriptionFilters,
  PaginatedResponse,
  StandardResponse
} from '@/lib/subscription-types'

// ==================== 类型定义 ====================

/**
 * 订阅计划查询参数
 */
export interface UseSubscriptionPlansParams extends PlanFilters {
  enabled?: boolean
}

/**
 * 用户订阅查询参数
 */
export interface UseUserSubscriptionsParams extends SubscriptionFilters {
  enabled?: boolean
}

/**
 * 订阅详情查询参数
 */
export interface UseSubscriptionParams {
  id: number | string
  enabled?: boolean
}

/**
 * 用户订阅筛选参数
 */
export interface UseSubscriptionsByUserParams {
  userId: number
  status?: string
  limit?: number
  offset?: number
  enabled?: boolean
}

/**
 * 乐观更新上下文
 */
interface SubscriptionMutationContext {
  operation: string
  subscriptionId?: number
  planId?: number
  previousData?: any
}

// ==================== 订阅计划查询 Hooks ====================

/**
 * 获取订阅计划列表
 * 支持分页、筛选、排序等功能
 */
export const useSubscriptionPlans = (params: UseSubscriptionPlansParams = {}) => {
  const { enabled = true, ...queryParams } = params
  
  return useQuery({
    queryKey: queryKeys.subscriptions.plans.list(queryParams),
    queryFn: () => subscriptionService.getPlans(queryParams),
    ...createQueryOptions(DataType.STATIC, {
      enabled,
      select: (data: PaginatedResponse<SubscriptionPlan>) => {
        // 数据转换和增强
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              items: data.data.items?.map(plan => ({
                ...plan,
                // 添加计算属性
                traffic_limit_gb: Math.round(plan.traffic_limit / (1024 * 1024 * 1024) * 100) / 100,
                traffic_limit_text: formatTrafficLimit(plan.traffic_limit),
                formattedPrice: formatPrice(plan.price, plan.currency),
                billingCycleText: getBillingCycleText(plan.billing_cycle),
                statusConfig: getPlanStatusConfig(plan.status),
              })) || []
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'subscriptions',
          operation: 'plans-list',
          params: queryParams
        })
      }
    })
  })
}

/**
 * 获取单个订阅计划详情
 */
export const useSubscriptionPlan = (params: UseSubscriptionParams) => {
  const { id, enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.subscriptions.plans.detail(id),
    queryFn: () => subscriptionService.getPlan(Number(id)),
    ...createQueryOptions(DataType.STATIC, {
      enabled: enabled && !!id,
      select: (data: StandardResponse<SubscriptionPlan>) => {
        // 增强计划详情数据
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              traffic_limit_gb: Math.round(data.data.traffic_limit / (1024 * 1024 * 1024) * 100) / 100,
              traffic_limit_text: formatTrafficLimit(data.data.traffic_limit),
              formattedPrice: formatPrice(data.data.price, data.data.currency),
              billingCycleText: getBillingCycleText(data.data.billing_cycle),
              statusConfig: getPlanStatusConfig(data.data.status),
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'subscriptions',
          operation: 'plan-detail',
          params: { id }
        })
      }
    })
  })
}

/**
 * 获取活跃的订阅计划
 */
export const useActiveSubscriptionPlans = (params: Omit<UseSubscriptionPlansParams, 'status'> = {}) => {
  return useSubscriptionPlans({
    ...params,
    status: 'active'
  })
}

/**
 * 获取可见的订阅计划
 */
export const useVisibleSubscriptionPlans = (params: Omit<UseSubscriptionPlansParams, 'visible'> = {}) => {
  return useSubscriptionPlans({
    ...params,
    visible: true
  })
}

// ==================== 用户订阅查询 Hooks ====================

/**
 * 获取用户订阅列表
 * 支持分页、筛选、排序等功能
 */
export const useUserSubscriptions = (params: UseUserSubscriptionsParams = {}) => {
  const { enabled = true, ...queryParams } = params
  
  return useQuery({
    queryKey: queryKeys.subscriptions.users.list(queryParams),
    queryFn: () => subscriptionService.getUserSubscriptions(queryParams),
    ...createQueryOptions(DataType.USER, {
      enabled,
      select: (data: PaginatedResponse<UserSubscription>) => {
        // 数据转换和增强
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              items: data.data.items?.map(subscription => ({
                ...subscription,
                // 添加计算属性
                statusConfig: getSubscriptionStatusConfig(subscription.status),
                formattedPrice: formatPrice(subscription.price, subscription.currency),
                daysLeftText: getDaysLeftText(subscription.days_left),
                isExpiringSoon: subscription.days_left <= 7 && subscription.days_left > 0,
                formattedDates: {
                  start: formatDate(subscription.start_date),
                  end: formatDate(subscription.end_date),
                  currentPeriodStart: formatDate(subscription.current_period_start),
                  currentPeriodEnd: formatDate(subscription.current_period_end),
                },
              })) || []
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'subscriptions',
          operation: 'user-subscriptions-list',
          params: queryParams
        })
      }
    })
  })
}

/**
 * 获取单个用户订阅详情
 */
export const useUserSubscription = (params: UseSubscriptionParams) => {
  const { id, enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.subscriptions.users.detail(id),
    queryFn: () => subscriptionService.getUserSubscription(Number(id)),
    ...createQueryOptions(DataType.USER, {
      enabled: enabled && !!id,
      select: (data: StandardResponse<UserSubscription>) => {
        // 增强用户订阅详情数据
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              statusConfig: getSubscriptionStatusConfig(data.data.status),
              formattedPrice: formatPrice(data.data.price, data.data.currency),
              daysLeftText: getDaysLeftText(data.data.days_left),
              isExpiringSoon: data.data.days_left <= 7 && data.data.days_left > 0,
              formattedDates: {
                start: formatDate(data.data.start_date),
                end: formatDate(data.data.end_date),
                currentPeriodStart: formatDate(data.data.current_period_start),
                currentPeriodEnd: formatDate(data.data.current_period_end),
              },
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'subscriptions',
          operation: 'user-subscription-detail',
          params: { id }
        })
      }
    })
  })
}

/**
 * 按用户ID获取订阅列表
 */
export const useSubscriptionsByUser = (params: UseSubscriptionsByUserParams) => {
  const { enabled = true, userId, ...queryParams } = params
  
  return useQuery({
    queryKey: queryKeys.subscriptions.users.byUser(userId),
    queryFn: () => subscriptionService.getUserSubscriptions({ user_id: userId, ...queryParams }),
    ...createQueryOptions(DataType.USER, {
      enabled: enabled && !!userId,
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'subscriptions',
          operation: 'subscriptions-by-user',
          params: { userId, ...queryParams }
        })
      }
    })
  })
}

/**
 * 获取活跃用户订阅
 */
export const useActiveUserSubscriptions = (params: Omit<UseUserSubscriptionsParams, 'status'> = {}) => {
  return useUserSubscriptions({
    ...params,
    status: 'active'
  })
}

/**
 * 获取即将过期的订阅
 */
export const useExpiringSubscriptions = (params: UseUserSubscriptionsParams = {}) => {
  return useQuery({
    queryKey: ['subscriptions', 'users', 'expiring', params],
    queryFn: () => subscriptionService.getUserSubscriptions(params),
    ...createQueryOptions(DataType.USER, {
      select: (data: PaginatedResponse<UserSubscription>) => {
        if (data.code === 0 && data.data) {
          // 筛选即将过期的订阅（7天内）
          const expiringSubscriptions = data.data.items?.filter(
            subscription => subscription.days_left <= 7 && subscription.days_left > 0
          ) || []
          
          return {
            ...data,
            data: {
              ...data.data,
              items: expiringSubscriptions
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'subscriptions',
          operation: 'expiring-subscriptions',
          params
        })
      }
    })
  })
}

// ==================== 我的订阅查询 Hooks ====================

/**
 * 获取当前用户的订阅
 */
export const useMySubscriptions = (params?: { status?: string; limit?: number; offset?: number; enabled?: boolean }) => {
  const { enabled = true, ...queryParams } = params || {}
  
  return useQuery({
    queryKey: ['subscriptions', 'my', queryParams],
    queryFn: () => subscriptionService.getMySubscriptions(queryParams),
    ...createQueryOptions(DataType.USER, {
      enabled,
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'subscriptions',
          operation: 'my-subscriptions',
          params: queryParams
        })
      }
    })
  })
}

/**
 * 获取当前用户的活跃订阅
 */
export const useMyActiveSubscriptions = (options?: { enabled?: boolean }) => {
  const { enabled = true } = options || {}
  
  return useQuery({
    queryKey: ['subscriptions', 'my', 'active'],
    queryFn: () => subscriptionService.getMyActiveSubscriptions(),
    ...createQueryOptions(DataType.USER, {
      enabled,
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'subscriptions',
          operation: 'my-active-subscriptions'
        })
      }
    })
  })
}

/**
 * 获取订阅流量统计
 */
export const useSubscriptionTrafficStats = (params: UseSubscriptionParams) => {
  const { id, enabled = true } = params
  
  return useQuery({
    queryKey: ['subscriptions', 'traffic-stats', id],
    queryFn: () => subscriptionService.getSubscriptionTrafficStats(Number(id)),
    ...createQueryOptions(DataType.REALTIME, {
      enabled: enabled && !!id,
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'subscriptions',
          operation: 'traffic-stats',
          params: { id }
        })
      }
    })
  })
}

// ==================== 无限查询 Hooks ====================

/**
 * 无限加载订阅计划列表
 */
export const useInfiniteSubscriptionPlans = (params: Omit<UseSubscriptionPlansParams, 'offset'> & { limit?: number } = {}) => {
  const { enabled = true, limit = 20, ...queryParams } = params
  
  return useInfiniteQuery({
    queryKey: queryKeys.subscriptions.plans.list({ ...queryParams, limit }),
    queryFn: ({ pageParam = 0 }) => 
      subscriptionService.getPlans({ ...queryParams, offset: pageParam, limit }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: PaginatedResponse<SubscriptionPlan>) => {
      if (lastPage.code === 0 && lastPage.data) {
        const currentOffset = lastPage.data.pagination?.page ? (lastPage.data.pagination.page - 1) * lastPage.data.pagination.limit : 0
        const totalItems = lastPage.data.pagination?.total || 0
        const nextOffset = currentOffset + limit
        
        return nextOffset < totalItems ? nextOffset : undefined
      }
      return undefined
    },
    ...createQueryOptions(DataType.STATIC, {
      enabled,
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'subscriptions',
          operation: 'infinite-plans',
          params: queryParams
        })
      }
    }) as Partial<UseInfiniteQueryOptions<PaginatedResponse<SubscriptionPlan>, Error>>
  })
}

/**
 * 无限加载用户订阅列表
 */
export const useInfiniteUserSubscriptions = (params: Omit<UseUserSubscriptionsParams, 'offset'> & { limit?: number } = {}) => {
  const { enabled = true, limit = 20, ...queryParams } = params
  
  return useInfiniteQuery({
    queryKey: queryKeys.subscriptions.users.list({ ...queryParams, limit }),
    queryFn: ({ pageParam = 0 }) => 
      subscriptionService.getUserSubscriptions({ ...queryParams, offset: pageParam, limit }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: PaginatedResponse<UserSubscription>) => {
      if (lastPage.code === 0 && lastPage.data) {
        const currentOffset = lastPage.data.pagination?.page ? (lastPage.data.pagination.page - 1) * lastPage.data.pagination.limit : 0
        const totalItems = lastPage.data.pagination?.total || 0
        const nextOffset = currentOffset + limit
        
        return nextOffset < totalItems ? nextOffset : undefined
      }
      return undefined
    },
    ...createQueryOptions(DataType.USER, {
      enabled,
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'subscriptions',
          operation: 'infinite-user-subscriptions',
          params: queryParams
        })
      }
    }) as Partial<UseInfiniteQueryOptions<PaginatedResponse<UserSubscription>, Error>>
  })
}

// ==================== 变更操作 Hooks ====================

/**
 * 乐观更新工具函数
 */
const optimisticUpdateUtils = {
  /**
   * 乐观更新计划列表 - 创建计划
   */
  optimisticallyAddPlan: (queryClient: any, newPlan: SubscriptionPlan) => {
    const queryKeys = ['subscriptions', 'plans', 'list']
    
    queryClient.setQueriesData(
      { queryKey: queryKeys, exact: false },
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
   * 乐观更新计划列表 - 更新计划
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
   * 乐观更新用户订阅
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
  }
}

/**
 * 缓存失效工具函数
 */
const invalidationUtils = {
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
  }
}

/**
 * 创建订阅计划
 */
export const useCreateSubscriptionPlan = (options?: Partial<UseMutationOptions<StandardResponse<SubscriptionPlan>, Error, CreatePlanRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (planData: CreatePlanRequest) => subscriptionService.createPlan(planData),
    ...createMutationOptions({
      onMutate: async (planData: CreatePlanRequest) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.plans.lists() })
        
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
        
        optimisticUpdateUtils.optimisticallyAddPlan(queryClient, optimisticPlan)
        
        toast.loading('正在创建订阅计划...', { id: 'create-plan' })
        
        return { previousData, optimisticPlan }
      },
      
      onSuccess: (data: StandardResponse<SubscriptionPlan>, variables: CreatePlanRequest, context: any) => {
        toast.dismiss('create-plan')
        
        if (data.code === 0) {
          toast.success('订阅计划创建成功', {
            description: `计划 ${data.data.name} 已成功创建`
          })
          
          invalidationUtils.invalidatePlanQueries(queryClient)
        } else {
          toast.error('订阅计划创建失败', {
            description: data.message || '创建计划时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables: CreatePlanRequest, context: any) => {
        toast.dismiss('create-plan')
        
        if (context?.previousData) {
          context.previousData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
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
        await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.plans.detail(id) })
        await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.plans.lists() })
        
        const previousPlanData = queryClient.getQueryData(queryKeys.subscriptions.plans.detail(id))
        const previousListData = queryClient.getQueriesData({ queryKey: queryKeys.subscriptions.plans.lists() })
        
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
          
          invalidationUtils.invalidatePlanQueries(queryClient, variables.id)
        } else {
          toast.error('订阅计划更新失败', {
            description: data.message || '更新计划时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('update-plan')
        
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
        toast.loading('正在删除订阅计划...', { id: 'delete-plan' })
        return { planId }
      },
      
      onSuccess: (data: StandardResponse<void>, planId: number, context: any) => {
        toast.dismiss('delete-plan')
        
        if (data.code === 0) {
          toast.success('订阅计划删除成功')
          invalidationUtils.invalidatePlanQueries(queryClient, planId)
        } else {
          toast.error('订阅计划删除失败', {
            description: data.message || '删除计划时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, planId: number, context: any) => {
        toast.dismiss('delete-plan')
        
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
        toast.loading('正在切换计划状态...', { id: 'toggle-plan-status' })
        return { planId }
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
        toast.loading('正在创建用户订阅...', { id: 'create-subscription' })
        return { subscriptionData }
      },
      
      onSuccess: (data: StandardResponse<UserSubscription>, variables: CreateSubscriptionRequest, context: any) => {
        toast.dismiss('create-subscription')
        
        if (data.code === 0) {
          toast.success('用户订阅创建成功', {
            description: `已为用户创建订阅`
          })
          
          invalidationUtils.invalidateSubscriptionQueries(queryClient)
        } else {
          toast.error('用户订阅创建失败', {
            description: data.message || '创建订阅时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables: CreateSubscriptionRequest, context: any) => {
        toast.dismiss('create-subscription')
        
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
        await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.users.detail(id) })
        await queryClient.cancelQueries({ queryKey: queryKeys.subscriptions.users.lists() })
        
        const previousSubscriptionData = queryClient.getQueryData(queryKeys.subscriptions.users.detail(id))
        const previousListData = queryClient.getQueriesData({ queryKey: queryKeys.subscriptions.users.lists() })
        
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
          
          invalidationUtils.invalidateSubscriptionQueries(queryClient, variables.id)
        } else {
          toast.error('用户订阅更新失败', {
            description: data.message || '更新订阅时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('update-subscription')
        
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

/**
 * 取消用户订阅
 */
export const useCancelUserSubscription = (options?: Partial<UseMutationOptions<StandardResponse<void>, Error, { id: number; reason?: string; cancelAtPeriodEnd?: boolean }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, reason, cancelAtPeriodEnd }: { id: number; reason?: string; cancelAtPeriodEnd?: boolean }) => 
      subscriptionService.cancelUserSubscription(id, reason, cancelAtPeriodEnd),
    ...createMutationOptions({
      onMutate: async ({ id }) => {
        toast.loading('正在取消订阅...', { id: 'cancel-subscription' })
        return { subscriptionId: id }
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
        toast.loading('正在暂停订阅...', { id: 'pause-subscription' })
        return { subscriptionId: id }
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
        toast.loading('正在恢复订阅...', { id: 'resume-subscription' })
        return { subscriptionId: id }
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
        toast.loading(`正在延长订阅 ${extendByDays} 天...`, { id: 'extend-subscription' })
        return { subscriptionId: id }
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
 * 批量操作用户订阅
 */
export const useBulkSubscriptionAction = (options?: Partial<UseMutationOptions<StandardResponse<any>, Error, { action: 'pause' | 'resume' | 'cancel' | 'extend' | 'reset_traffic'; subscriptionIds: number[]; options?: { extendByDays?: number; reason?: string } }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ action, subscriptionIds, options: actionOptions }: { action: 'pause' | 'resume' | 'cancel' | 'extend' | 'reset_traffic'; subscriptionIds: number[]; options?: { extendByDays?: number; reason?: string } }) => 
      subscriptionService.bulkSubscriptionAction(action, subscriptionIds, actionOptions || {}),
    ...createMutationOptions({
      onMutate: async ({ action, subscriptionIds }) => {
        toast.loading(`正在批量${getActionText(action)} ${subscriptionIds.length} 个订阅...`, { id: 'bulk-action' })
        return { action, subscriptionIds }
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
 * 格式化价格
 */
function formatPrice(price: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    CNY: '¥',
    GBP: '£',
    JPY: '¥'
  }
  
  const symbol = symbols[currency] || currency
  return `${symbol}${price.toFixed(2)}`
}

/**
 * 获取计费周期文本
 */
function getBillingCycleText(cycle: string): string {
  const texts: Record<string, string> = {
    monthly: '月付',
    yearly: '年付',
    lifetime: '终身'
  }
  
  return texts[cycle] || cycle
}

/**
 * 获取计划状态配置
 */
function getPlanStatusConfig(status: string) {
  const configs: Record<string, { color: string; text: string; variant: string }> = {
    active: { color: 'green', text: '活跃', variant: 'default' },
    inactive: { color: 'gray', text: '未激活', variant: 'secondary' },
    archived: { color: 'red', text: '已归档', variant: 'destructive' }
  }
  
  return configs[status] || configs.active
}

/**
 * 获取订阅状态配置
 */
function getSubscriptionStatusConfig(status: string) {
  const configs: Record<string, { color: string; text: string; variant: string }> = {
    active: { color: 'green', text: '活跃', variant: 'default' },
    inactive: { color: 'gray', text: '未激活', variant: 'secondary' },
    expired: { color: 'red', text: '已过期', variant: 'destructive' },
    cancelled: { color: 'orange', text: '已取消', variant: 'outline' },
    trialing: { color: 'blue', text: '试用中', variant: 'default' },
    past_due: { color: 'yellow', text: '逾期', variant: 'outline' }
  }
  
  return configs[status] || configs.active
}

/**
 * 获取剩余天数文本
 */
function getDaysLeftText(daysLeft: number): string {
  if (daysLeft < 0) return '已过期'
  if (daysLeft === 0) return '今天到期'
  if (daysLeft === 1) return '明天到期'
  return `剩余 ${daysLeft} 天`
}

/**
 * 格式化日期
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('zh-CN')
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

/**
 * 订阅查询相关的工具函数
 */
export const subscriptionQueryUtils = {
  /**
   * 格式化流量限制
   */
  formatTrafficLimit,

  /**
   * 格式化价格
   */
  formatPrice,

  /**
   * 获取计费周期文本
   */
  getBillingCycleText,

  /**
   * 获取计划状态配置
   */
  getPlanStatusConfig,

  /**
   * 获取订阅状态配置
   */
  getSubscriptionStatusConfig,

  /**
   * 获取剩余天数文本
   */
  getDaysLeftText,

  /**
   * 格式化日期
   */
  formatDate,

  /**
   * 检查订阅是否即将过期
   */
  isExpiringSoon: (daysLeft: number): boolean => {
    return daysLeft <= 7 && daysLeft > 0
  },

  /**
   * 检查订阅是否已过期
   */
  isExpired: (daysLeft: number): boolean => {
    return daysLeft < 0
  },

  /**
   * 获取订阅紧急程度
   */
  getUrgencyLevel: (daysLeft: number): 'high' | 'medium' | 'low' => {
    if (daysLeft < 0) return 'high'
    if (daysLeft <= 3) return 'high'
    if (daysLeft <= 7) return 'medium'
  }
}

// ==================== 任务20：增强订阅管理Hooks ====================

/**
 * 增强的订阅管理Hook
 * 集成智能预加载、性能监控和高级缓存管理
 * 
 * @param options 配置选项
 * @returns 增强的订阅管理功能
 */
export const useEnhancedSubscriptionManager = (options?: {
  enablePreloader?: boolean
  enablePerformanceMonitor?: boolean
  enableAdvancedCache?: boolean
}) => {
  const {
    enablePreloader = true,
    enablePerformanceMonitor = true,
    enableAdvancedCache = true,
  } = options || {}
  
  // 集成预加载器
  const preloader = enablePreloader ? useSubscriptionPreloader({
    routePreload: true,
    dependencyPreload: true,
    idlePreload: true,
    batchPreload: true,
    priority: 'high',
    maxConcurrent: 3,
    delay: 100,
  }) : null
  
  // 集成性能监控
  const performanceMonitor = enablePerformanceMonitor ? useSubscriptionPerformanceMonitor() : null
  
  // 集成高级缓存管理
  const cacheManager = enableAdvancedCache ? useAdvancedCacheManager() : null
  
  /**
   * 智能获取订阅计划
   * 集成预加载和性能监控
   */
  const useSmartSubscriptionPlans = useCallback((params: UseSubscriptionPlansParams = {}) => {
    const startTime = Date.now()
    
    const result = useQuery({
      queryKey: queryKeys.subscriptions.plans.list(params),
      queryFn: () => subscriptionService.getPlans(params),
      ...createQueryOptions(DataType.STATIC, {
        enabled: params.enabled,
        select: (data: PaginatedResponse<SubscriptionPlan>) => {
          // 记录性能
          const responseTime = Date.now() - startTime
          if (performanceMonitor) {
            const cacheStatus = result.isPlaceholderData ? 'miss' : 'hit'
            if (cacheStatus === 'hit') {
              performanceMonitor.recordCacheHit(responseTime)
            } else {
              performanceMonitor.recordCacheMiss(responseTime)
            }
          }
          
          // 数据转换和增强
          if (data.code === 0 && data.data) {
            return {
              ...data,
              data: {
                ...data.data,
                items: data.data.items?.map(plan => ({
                  ...plan,
                  traffic_limit_gb: Math.round(plan.traffic_limit / (1024 * 1024 * 1024) * 100) / 100,
                  traffic_limit_text: formatTrafficLimit(plan.traffic_limit),
                  formattedPrice: formatPrice(plan.price, plan.currency),
                  billingCycleText: getBillingCycleText(plan.billing_cycle),
                  statusConfig: getPlanStatusConfig(plan.status),
                })) || []
              }
            }
          }
          return data
        },
        onError: (error) => {
          if (performanceMonitor) {
            performanceMonitor.recordError()
          }
          reactQueryErrorUtils.handleQueryError(error, {
            module: 'subscriptions',
            operation: 'smart-plans-list',
            params
          })
        }
      })
    })
    
    // 触发依赖预加载
    useEffect(() => {
      if (preloader && result.isSuccess && params.enabled !== false) {
        preloader.preloadUserSubscriptions({ limit: 10 })
        preloader.preloadSubscriptionStats()
      }
    }, [result.isSuccess, params.enabled])
    
    return result
  }, [preloader, performanceMonitor])
  
  /**
   * 智能获取用户订阅
   * 集成预加载和性能监控
   */
  const useSmartUserSubscriptions = useCallback((params: UseUserSubscriptionsParams = {}) => {
    const startTime = Date.now()
    
    const result = useQuery({
      queryKey: queryKeys.subscriptions.users.list(params),
      queryFn: () => subscriptionService.getUserSubscriptions(params),
      ...createQueryOptions(DataType.USER, {
        enabled: params.enabled,
        select: (data: PaginatedResponse<UserSubscription>) => {
          // 记录性能
          const responseTime = Date.now() - startTime
          if (performanceMonitor) {
            const cacheStatus = result.isPlaceholderData ? 'miss' : 'hit'
            if (cacheStatus === 'hit') {
              performanceMonitor.recordCacheHit(responseTime)
            } else {
              performanceMonitor.recordCacheMiss(responseTime)
            }
          }
          
          // 数据转换和增强
          if (data.code === 0 && data.data) {
            return {
              ...data,
              data: {
                ...data.data,
                items: data.data.items?.map(subscription => ({
                  ...subscription,
                  statusConfig: getSubscriptionStatusConfig(subscription.status),
                  formattedPrice: formatPrice(subscription.price, subscription.currency),
                  daysLeftText: getDaysLeftText(subscription.days_left),
                  isExpiringSoon: subscription.days_left <= 7 && subscription.days_left > 0,
                  formattedDates: {
                    start: formatDate(subscription.start_date),
                    end: formatDate(subscription.end_date),
                    currentPeriodStart: formatDate(subscription.current_period_start),
                    currentPeriodEnd: formatDate(subscription.current_period_end),
                  },
                })) || []
              }
            }
          }
          return data
        },
        onError: (error) => {
          if (performanceMonitor) {
            performanceMonitor.recordError()
          }
          reactQueryErrorUtils.handleQueryError(error, {
            module: 'subscriptions',
            operation: 'smart-user-subscriptions-list',
            params
          })
        }
      })
    })
    
    // 触发依赖预加载
    useEffect(() => {
      if (preloader && result.isSuccess && params.enabled !== false) {
        preloader.preloadSubscriptionPlans({ visible: true })
        preloader.preloadExpiringSubscriptions()
      }
    }, [result.isSuccess, params.enabled])
    
    return result
  }, [preloader, performanceMonitor])
  
  /**
   * 获取性能分析报告
   */
  const getPerformanceAnalysis = useCallback(() => {
    if (!performanceMonitor || !cacheManager) {
      return null
    }
    
    const performanceReport = performanceMonitor.getPerformanceReport()
    const cacheAnalysis = cacheManager.getCacheAnalysis()
    
    return {
      performance: performanceReport,
      cache: cacheAnalysis,
      recommendations: [
        ...performanceReport.compliance.overallCompliant 
          ? ['性能表现优秀，符合NFR-1要求'] 
          : ['需要优化以满足NFR-1性能要求'],
        ...(cacheAnalysis.recommendations || []),
      ],
    }
  }, [performanceMonitor, cacheManager])
  
  /**
   * 执行性能优化
   */
  const optimizePerformance = useCallback(async () => {
    if (!cacheManager) return
    
    // 执行缓存预热
    await cacheManager.warmupCache(['plans', 'user-subscriptions', 'stats'])
    
    // 清理过期缓存
    await cacheManager.executeCleanup({
      trigger: 'manual',
      target: 'stale',
      percentage: 0.3,
    })
    
    // 条件性刷新错误查询
    await cacheManager.conditionalRefresh({
      errorOnly: true,
      staleOnly: false,
    })
    
    toast.success('性能优化完成', {
      description: '缓存已预热，过期数据已清理'
    })
  }, [cacheManager])
  
  return {
    // 增强的查询hooks
    useSmartSubscriptionPlans,
    useSmartUserSubscriptions,
    
    // 预加载控制
    preloader,
    
    // 性能监控
    performanceMonitor,
    
    // 缓存管理
    cacheManager,
    
    // 分析和优化
    getPerformanceAnalysis,
    optimizePerformance,
    
    // 原始hooks（向后兼容）
    useSubscriptionPlans,
    useUserSubscriptions,
    useSubscriptionPlan,
    useUserSubscription,
    useActiveSubscriptionPlans,
    useVisibleSubscriptionPlans,
    useActiveUserSubscriptions,
    useExpiringSubscriptions,
    useMySubscriptions,
    useMyActiveSubscriptions,
  }
}

/**
 * NFR-1合规检查Hook
 * 专门用于验证性能要求达标
 */
export const useNFRComplianceChecker = () => {
  const performanceMonitor = useSubscriptionPerformanceMonitor()
  const cacheManager = useAdvancedCacheManager()
  
  /**
   * 执行完整的NFR-1合规性检查
   */
  const checkCompliance = useCallback(() => {
    const metrics = performanceMonitor.getPerformanceReport()
    const cacheAnalysis = cacheManager.getCacheAnalysis()
    
    const checks = {
      // 缓存命中响应时间 < 50ms
      cacheResponseTime: {
        target: 50,
        current: metrics.metrics.cacheHitResponseTime,
        passed: metrics.metrics.cacheHitResponseTime <= 50,
        description: '缓存命中响应时间'
      },
      
      // 客户端缓存大小 < 50MB
      memoryUsage: {
        target: 50 * 1024 * 1024,
        current: metrics.metrics.memoryUsage,
        passed: metrics.metrics.memoryUsage <= 50 * 1024 * 1024,
        description: '客户端缓存大小'
      },
      
      // 缓存命中率 > 80%
      cacheHitRate: {
        target: 0.8,
        current: metrics.metrics.cacheHitRate,
        passed: metrics.metrics.cacheHitRate >= 0.8,
        description: '缓存命中率'
      },
      
      // 网络请求减少 > 80%
      networkReduction: {
        target: 0.8,
        current: metrics.metrics.networkRequestsSaved / (metrics.metrics.networkRequestsSaved + metrics.summary.totalRequests),
        passed: (metrics.metrics.networkRequestsSaved / (metrics.metrics.networkRequestsSaved + metrics.summary.totalRequests)) >= 0.8,
        description: '网络请求减少率'
      }
    }
    
    const passedChecks = Object.values(checks).filter(check => check.passed).length
    const totalChecks = Object.keys(checks).length
    const overallCompliance = passedChecks === totalChecks
    const complianceScore = (passedChecks / totalChecks) * 100
    
    return {
      checks,
      overallCompliance,
      complianceScore,
      passedChecks,
      totalChecks,
      recommendations: generateComplianceRecommendations(checks),
    }
  }, [performanceMonitor, cacheManager])
  
  /**
   * 生成合规性改进建议
   */
  const generateComplianceRecommendations = useCallback((checks: any) => {
    const recommendations: string[] = []
    
    if (!checks.cacheResponseTime.passed) {
      recommendations.push('优化查询函数和缓存策略以降低响应时间')
    }
    
    if (!checks.memoryUsage.passed) {
      recommendations.push('实施更积极的缓存清理策略以控制内存使用')
    }
    
    if (!checks.cacheHitRate.passed) {
      recommendations.push('增加智能预加载策略以提高缓存命中率')
    }
    
    if (!checks.networkReduction.passed) {
      recommendations.push('优化预加载时机和策略以减少重复网络请求')
    }
    
    return recommendations
  }, [])
  
  return {
    checkCompliance,
    performanceMonitor,
    cacheManager,
  }
}

// ==================== 更新默认导出 ====================

export default {
  // 原始查询 hooks
  useSubscriptionPlans,
  useSubscriptionPlan,
  useActiveSubscriptionPlans,
  useVisibleSubscriptionPlans,
  useUserSubscriptions,
  useUserSubscription,
  useSubscriptionsByUser,
  useActiveUserSubscriptions,
  useExpiringSubscriptions,
  useMySubscriptions,
  useMyActiveSubscriptions,
  useSubscriptionTrafficStats,
  useInfiniteSubscriptionPlans,
  useInfiniteUserSubscriptions,
  
  // 变更 hooks
  useCreateSubscriptionPlan,
  useUpdateSubscriptionPlan,
  useDeleteSubscriptionPlan,
  useTogglePlanStatus,
  useCreateUserSubscription,
  useUpdateUserSubscription,
  useCancelUserSubscription,
  usePauseSubscription,
  useResumeSubscription,
  useExtendUserSubscription,
  useResetUserTraffic,
  useBulkSubscriptionAction,
  
  // 任务20：增强功能
  useEnhancedSubscriptionManager,
  useNFRComplianceChecker,
  
  // 工具函数
  subscriptionQueryUtils
}