'use client'

/**
 * 支付变更 Hooks
 * 
 * 基于 React Query 实现的支付系统配置和管理变更钩子集合
 * 支持支付配置、重试策略的创建、更新、删除等操作，实现完整的乐观更新机制
 * 遵循统一的缓存策略和错误处理机制
 * 
 * 任务26实现：支付变更Hooks - 包含乐观更新、错误回滚、批量操作
 * 符合FR-3乐观更新机制要求：立即UI反馈、失败回滚、成功同步
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'
import { paymentService } from '@/lib/payment-service'
import { paymentRetryService } from '@/lib/payment-retry-service'
import { queryKeys, CacheInvalidationUtils } from '@/lib/query-keys'
import { createMutationOptions } from '@/lib/cache-strategies'
import { reactQueryErrorUtils, errorUtils } from '@/lib/error-handler'
import {
  PaymentConfigResponse,
  CreatePaymentConfigRequest,
  UpdatePaymentConfigRequest,
  ApiResponse,
  PaymentConfigsApiResponse
} from '@/lib/payment-types'
import {
  RetryStrategy,
  CreateRetryStrategyRequest,
  UpdateRetryStrategyRequest,
  ApiResponse as RetryApiResponse
} from '@/lib/payment-retry-types'
import { StandardResponse } from '@/lib/types'

// ==================== 类型定义 ====================

/**
 * 支付变更操作上下文
 */
interface PaymentMutationContext {
  operation: string
  module: 'payment-config' | 'retry-strategy'
  itemId?: number | string
  itemIds?: (number | string)[]
  previousData?: any
  rollbackData?: any
}

/**
 * 乐观更新配置
 */
interface OptimisticUpdateConfig {
  enabled: boolean
  immediateUpdate: boolean
  rollbackOnError: boolean
}

/**
 * 测试支付配置请求
 */
interface TestPaymentConfigRequest {
  amount: number
  currency?: string
  test_mode: boolean
}

/**
 * 同步支付状态请求
 */
interface SyncPaymentStatusRequest {
  payment_ids: string[]
  force_sync?: boolean
}

// ==================== 工具函数 ====================

/**
 * 乐观更新工具函数
 */
const optimisticUpdateUtils = {
  /**
   * 为支付配置列表添加新配置（乐观更新）
   */
  addPaymentConfigToList: (queryClient: any, newConfig: any) => {
    const configsQueryKey = queryKeys.payments.lists()
    queryClient.setQueryData(configsQueryKey, (oldData: PaymentConfigsApiResponse | undefined) => {
      if (!oldData || oldData.code !== 0 || !oldData.data) return oldData
      
      const tempId = Date.now()
      const optimisticConfig = {
        ...newConfig,
        id: tempId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _isOptimistic: true
      }
      
      return {
        ...oldData,
        data: [optimisticConfig, ...oldData.data],
        total: oldData.total + 1
      }
    })
    return configsQueryKey
  },

  /**
   * 从支付配置列表移除配置（乐观更新）
   */
  removePaymentConfigFromList: (queryClient: any, configId: number) => {
    const configsQueryKey = queryKeys.payments.lists()
    const previousData = queryClient.getQueryData(configsQueryKey)
    
    queryClient.setQueryData(configsQueryKey, (oldData: PaymentConfigsApiResponse | undefined) => {
      if (!oldData || oldData.code !== 0 || !oldData.data) return oldData
      
      return {
        ...oldData,
        data: oldData.data.filter((config: any) => config.id !== configId),
        total: Math.max(0, oldData.total - 1)
      }
    })
    
    return { previousData, queryKey: configsQueryKey }
  },

  /**
   * 更新支付配置列表中的某个配置（乐观更新）
   */
  updatePaymentConfigInList: (queryClient: any, configId: number, updates: any) => {
    const configsQueryKey = queryKeys.payments.lists()
    const previousData = queryClient.getQueryData(configsQueryKey)
    
    queryClient.setQueryData(configsQueryKey, (oldData: PaymentConfigsApiResponse | undefined) => {
      if (!oldData || oldData.code !== 0 || !oldData.data) return oldData
      
      return {
        ...oldData,
        data: oldData.data.map((config: any) => 
          config.id === configId 
            ? { ...config, ...updates, updated_at: new Date().toISOString() }
            : config
        )
      }
    })
    
    return { previousData, queryKey: configsQueryKey }
  },

  /**
   * 为重试策略列表添加新策略（乐观更新）
   */
  addRetryStrategyToList: (queryClient: any, newStrategy: any) => {
    const strategiesQueryKey = queryKeys.paymentRetry.lists()
    queryClient.setQueryData(strategiesQueryKey, (oldData: any) => {
      if (!oldData || oldData.code !== 0 || !oldData.data?.items) return oldData
      
      const tempId = 'temp-' + Date.now()
      const optimisticStrategy = {
        ...newStrategy,
        id: tempId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _isOptimistic: true
      }
      
      return {
        ...oldData,
        data: {
          ...oldData.data,
          items: [optimisticStrategy, ...oldData.data.items],
          total: oldData.data.total + 1
        }
      }
    })
    return strategiesQueryKey
  },

  /**
   * 从重试策略列表移除策略（乐观更新）
   */
  removeRetryStrategyFromList: (queryClient: any, strategyId: string) => {
    const strategiesQueryKey = queryKeys.paymentRetry.lists()
    const previousData = queryClient.getQueryData(strategiesQueryKey)
    
    queryClient.setQueryData(strategiesQueryKey, (oldData: any) => {
      if (!oldData || oldData.code !== 0 || !oldData.data?.items) return oldData
      
      return {
        ...oldData,
        data: {
          ...oldData.data,
          items: oldData.data.items.filter((strategy: any) => strategy.id !== strategyId),
          total: Math.max(0, oldData.data.total - 1)
        }
      }
    })
    
    return { previousData, queryKey: strategiesQueryKey }
  },

  /**
   * 更新重试策略列表中的某个策略（乐观更新）
   */
  updateRetryStrategyInList: (queryClient: any, strategyId: string, updates: any) => {
    const strategiesQueryKey = queryKeys.paymentRetry.lists()
    const previousData = queryClient.getQueryData(strategiesQueryKey)
    
    queryClient.setQueryData(strategiesQueryKey, (oldData: any) => {
      if (!oldData || oldData.code !== 0 || !oldData.data?.items) return oldData
      
      return {
        ...oldData,
        data: {
          ...oldData.data,
          items: oldData.data.items.map((strategy: any) => 
            strategy.id === strategyId 
              ? { ...strategy, ...updates, updated_at: new Date().toISOString() }
              : strategy
          )
        }
      }
    })
    
    return { previousData, queryKey: strategiesQueryKey }
  },

  /**
   * 回滚乐观更新
   */
  rollbackOptimisticUpdate: (queryClient: any, queryKey: any, previousData: any) => {
    if (previousData && queryKey) {
      queryClient.setQueryData(queryKey, previousData)
    }
  }
}

/**
 * 缓存失效工具函数
 */
const invalidationUtils = {
  /**
   * 失效支付配置相关的所有查询
   */
  invalidatePaymentQueries: async (queryClient: any, configId?: number) => {
    await queryClient.invalidateQueries({ 
      queryKey: CacheInvalidationUtils.getModulePrefix('payments') 
    })
    
    // 失效相关模块的查询
    const relatedModules = CacheInvalidationUtils.getRelatedModules('payments')
    for (const module of relatedModules) {
      await queryClient.invalidateQueries({ 
        queryKey: CacheInvalidationUtils.getModulePrefix(module) 
      })
    }
    
    if (configId) {
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.payments.detail(configId) 
      })
      // 移除单项缓存
      queryClient.removeQueries({ 
        queryKey: queryKeys.payments.detail(configId),
        exact: true 
      })
    }
  },

  /**
   * 失效重试策略相关的所有查询
   */
  invalidateRetryQueries: async (queryClient: any, strategyId?: string) => {
    await queryClient.invalidateQueries({ 
      queryKey: CacheInvalidationUtils.getModulePrefix('paymentRetry') 
    })
    
    // 失效相关模块的查询
    const relatedModules = CacheInvalidationUtils.getRelatedModules('paymentRetry')
    for (const module of relatedModules) {
      await queryClient.invalidateQueries({ 
        queryKey: CacheInvalidationUtils.getModulePrefix(module) 
      })
    }
    
    if (strategyId) {
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.paymentRetry.detail(strategyId) 
      })
      // 移除单项缓存
      queryClient.removeQueries({ 
        queryKey: queryKeys.paymentRetry.detail(strategyId),
        exact: true 
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

// ==================== 支付配置变更 Mutations ====================

/**
 * 创建支付配置
 */
export const useCreatePaymentConfig = (options?: Partial<UseMutationOptions<ApiResponse<PaymentConfigResponse>, Error, CreatePaymentConfigRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (configData: CreatePaymentConfigRequest) => paymentService.createPaymentConfig(configData),
    ...createMutationOptions({
      onMutate: async (configData: CreatePaymentConfigRequest) => {
        toast.loading('正在创建支付配置...', { id: 'create-payment-config' })
        return { configData }
      },
      
      onSuccess: (data: ApiResponse<PaymentConfigResponse>, variables: CreatePaymentConfigRequest, context: any) => {
        toast.dismiss('create-payment-config')
        
        if (data.code === 0) {
          toast.success('支付配置创建成功', {
            description: `配置 ${data.data.name} 已成功创建`
          })
          
          invalidationUtils.invalidatePaymentQueries(queryClient)
          invalidationUtils.invalidateStatsQueries(queryClient)
        } else {
          toast.error('支付配置创建失败', {
            description: data.message || '创建支付配置时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables: CreatePaymentConfigRequest, context: any) => {
        toast.dismiss('create-payment-config')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'createPaymentConfig',
          configData: variables
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('支付配置创建失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 更新支付配置
 */
export const useUpdatePaymentConfig = (options?: Partial<UseMutationOptions<ApiResponse<PaymentConfigResponse>, Error, { id: number; data: UpdatePaymentConfigRequest }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePaymentConfigRequest }) => 
      paymentService.updatePaymentConfig(id, data),
    ...createMutationOptions({
      onMutate: async ({ id, data }) => {
        toast.loading('正在更新支付配置...', { id: 'update-payment-config' })
        
        // 乐观更新：立即更新配置信息
        const rollbackInfo = optimisticUpdateUtils.updatePaymentConfigInList(queryClient, id, data)
        
        return { configId: id, updateData: data, rollbackInfo }
      },
      
      onSuccess: (data: ApiResponse<PaymentConfigResponse>, variables, context: any) => {
        toast.dismiss('update-payment-config')
        
        if (data.code === 0) {
          toast.success('支付配置更新成功')
          invalidationUtils.invalidatePaymentQueries(queryClient, variables.id)
        } else {
          // 回滚乐观更新
          if (context?.rollbackInfo) {
            optimisticUpdateUtils.rollbackOptimisticUpdate(
              queryClient, 
              context.rollbackInfo.queryKey, 
              context.rollbackInfo.previousData
            )
          }
          
          toast.error('支付配置更新失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('update-payment-config')
        
        // 回滚乐观更新
        if (context?.rollbackInfo) {
          optimisticUpdateUtils.rollbackOptimisticUpdate(
            queryClient, 
            context.rollbackInfo.queryKey, 
            context.rollbackInfo.previousData
          )
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'updatePaymentConfig',
          configId: variables.id
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('支付配置更新失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 删除支付配置
 */
export const useDeletePaymentConfig = (options?: Partial<UseMutationOptions<ApiResponse<void>, Error, number>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (configId: number) => paymentService.deletePaymentConfig(configId),
    ...createMutationOptions({
      onMutate: async (configId: number) => {
        toast.loading('正在删除支付配置...', { id: 'delete-payment-config' })
        
        // 乐观更新：从列表中移除配置
        const rollbackInfo = optimisticUpdateUtils.removePaymentConfigFromList(queryClient, configId)
        
        return { 
          configId,
          rollbackInfo
        }
      },
      
      onSuccess: (data: ApiResponse<void>, configId: number, context: any) => {
        toast.dismiss('delete-payment-config')
        
        if (data.code === 0) {
          toast.success('支付配置删除成功')
          invalidationUtils.invalidatePaymentQueries(queryClient, configId)
        } else {
          // 回滚乐观更新
          if (context?.rollbackInfo) {
            optimisticUpdateUtils.rollbackOptimisticUpdate(
              queryClient, 
              context.rollbackInfo.queryKey, 
              context.rollbackInfo.previousData
            )
          }
          
          toast.error('支付配置删除失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, configId: number, context: any) => {
        toast.dismiss('delete-payment-config')
        
        // 回滚乐观更新
        if (context?.rollbackInfo) {
          optimisticUpdateUtils.rollbackOptimisticUpdate(
            queryClient, 
            context.rollbackInfo.queryKey, 
            context.rollbackInfo.previousData
          )
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'deletePaymentConfig',
          configId
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('支付配置删除失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 切换支付配置状态
 */
export const useTogglePaymentConfig = (options?: Partial<UseMutationOptions<ApiResponse<PaymentConfigResponse>, Error, { id: number; enabled: boolean }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) => 
      paymentService.toggleConfigStatus(id, enabled),
    ...createMutationOptions({
      onMutate: async ({ id, enabled }) => {
        const actionText = enabled ? '启用' : '禁用'
        toast.loading(`正在${actionText}支付配置...`, { id: 'toggle-payment-config' })
        
        // 乐观更新：立即更新配置状态
        const rollbackInfo = optimisticUpdateUtils.updatePaymentConfigInList(queryClient, id, { is_enabled: enabled })
        
        return { configId: id, enabled, rollbackInfo }
      },
      
      onSuccess: (data: ApiResponse<PaymentConfigResponse>, variables, context: any) => {
        toast.dismiss('toggle-payment-config')
        
        if (data.code === 0) {
          const actionText = variables.enabled ? '启用' : '禁用'
          toast.success(`支付配置${actionText}成功`)
          invalidationUtils.invalidatePaymentQueries(queryClient, variables.id)
        } else {
          // 回滚乐观更新
          if (context?.rollbackInfo) {
            optimisticUpdateUtils.rollbackOptimisticUpdate(
              queryClient, 
              context.rollbackInfo.queryKey, 
              context.rollbackInfo.previousData
            )
          }
          
          toast.error('状态切换失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('toggle-payment-config')
        
        // 回滚乐观更新
        if (context?.rollbackInfo) {
          optimisticUpdateUtils.rollbackOptimisticUpdate(
            queryClient, 
            context.rollbackInfo.queryKey, 
            context.rollbackInfo.previousData
          )
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'togglePaymentConfig',
          configId: variables.id
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

// ==================== 重试策略变更 Mutations ====================

/**
 * 创建重试策略
 */
export const useCreateRetryStrategy = (options?: Partial<UseMutationOptions<RetryApiResponse<RetryStrategy>, Error, CreateRetryStrategyRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (strategyData: CreateRetryStrategyRequest) => paymentRetryService.createRetryStrategy(strategyData),
    ...createMutationOptions({
      onMutate: async (strategyData: CreateRetryStrategyRequest) => {
        toast.loading('正在创建重试策略...', { id: 'create-retry-strategy' })
        return { strategyData }
      },
      
      onSuccess: (data: RetryApiResponse<RetryStrategy>, variables: CreateRetryStrategyRequest, context: any) => {
        toast.dismiss('create-retry-strategy')
        
        if (data.code === 0) {
          toast.success('重试策略创建成功', {
            description: `策略 ${data.data.name} 已成功创建`
          })
          
          invalidationUtils.invalidateRetryQueries(queryClient)
        } else {
          toast.error('重试策略创建失败', {
            description: data.message || '创建重试策略时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables: CreateRetryStrategyRequest, context: any) => {
        toast.dismiss('create-retry-strategy')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'createRetryStrategy',
          strategyData: variables
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('重试策略创建失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 更新重试策略
 */
export const useUpdateRetryStrategy = (options?: Partial<UseMutationOptions<RetryApiResponse<RetryStrategy>, Error, { id: string; data: UpdateRetryStrategyRequest }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRetryStrategyRequest }) => 
      paymentRetryService.updateRetryStrategy(id, data),
    ...createMutationOptions({
      onMutate: async ({ id, data }) => {
        toast.loading('正在更新重试策略...', { id: 'update-retry-strategy' })
        
        // 乐观更新：立即更新策略信息
        const rollbackInfo = optimisticUpdateUtils.updateRetryStrategyInList(queryClient, id, data)
        
        return { strategyId: id, updateData: data, rollbackInfo }
      },
      
      onSuccess: (data: RetryApiResponse<RetryStrategy>, variables, context: any) => {
        toast.dismiss('update-retry-strategy')
        
        if (data.code === 0) {
          toast.success('重试策略更新成功')
          invalidationUtils.invalidateRetryQueries(queryClient, variables.id)
        } else {
          // 回滚乐观更新
          if (context?.rollbackInfo) {
            optimisticUpdateUtils.rollbackOptimisticUpdate(
              queryClient, 
              context.rollbackInfo.queryKey, 
              context.rollbackInfo.previousData
            )
          }
          
          toast.error('重试策略更新失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('update-retry-strategy')
        
        // 回滚乐观更新
        if (context?.rollbackInfo) {
          optimisticUpdateUtils.rollbackOptimisticUpdate(
            queryClient, 
            context.rollbackInfo.queryKey, 
            context.rollbackInfo.previousData
          )
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'updateRetryStrategy',
          strategyId: variables.id
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('重试策略更新失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 删除重试策略
 */
export const useDeleteRetryStrategy = (options?: Partial<UseMutationOptions<RetryApiResponse<void>, Error, string>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (strategyId: string) => paymentRetryService.deleteRetryStrategy(strategyId),
    ...createMutationOptions({
      onMutate: async (strategyId: string) => {
        toast.loading('正在删除重试策略...', { id: 'delete-retry-strategy' })
        
        // 乐观更新：从列表中移除策略
        const rollbackInfo = optimisticUpdateUtils.removeRetryStrategyFromList(queryClient, strategyId)
        
        return { 
          strategyId,
          rollbackInfo
        }
      },
      
      onSuccess: (data: RetryApiResponse<void>, strategyId: string, context: any) => {
        toast.dismiss('delete-retry-strategy')
        
        if (data.code === 0) {
          toast.success('重试策略删除成功')
          invalidationUtils.invalidateRetryQueries(queryClient, strategyId)
        } else {
          // 回滚乐观更新
          if (context?.rollbackInfo) {
            optimisticUpdateUtils.rollbackOptimisticUpdate(
              queryClient, 
              context.rollbackInfo.queryKey, 
              context.rollbackInfo.previousData
            )
          }
          
          toast.error('重试策略删除失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, strategyId: string, context: any) => {
        toast.dismiss('delete-retry-strategy')
        
        // 回滚乐观更新
        if (context?.rollbackInfo) {
          optimisticUpdateUtils.rollbackOptimisticUpdate(
            queryClient, 
            context.rollbackInfo.queryKey, 
            context.rollbackInfo.previousData
          )
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'deleteRetryStrategy',
          strategyId
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('重试策略删除失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 高级支付操作 Mutations ====================

/**
 * 测试支付配置
 */
export const useTestPaymentConfig = (options?: Partial<UseMutationOptions<ApiResponse<any>, Error, { id: number; data: TestPaymentConfigRequest }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TestPaymentConfigRequest }) => {
      // 模拟测试支付配置的API调用，实际应该调用后端API
      // 这里暂时返回一个模拟响应
      return new Promise<ApiResponse<any>>((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.2) {
            resolve({
              code: 0,
              message: '测试成功',
              data: {
                success: true,
                response_time: Math.floor(Math.random() * 1000) + 100,
                test_amount: data.amount,
                currency: data.currency || 'CNY'
              }
            })
          } else {
            reject(new Error('测试连接失败：配置参数错误'))
          }
        }, 2000)
      })
    },
    ...createMutationOptions({
      onMutate: async ({ id, data }) => {
        toast.loading('正在测试支付配置连接...', { id: 'test-payment-config' })
        return { configId: id, testData: data }
      },
      
      onSuccess: (data: ApiResponse<any>, variables, context: any) => {
        toast.dismiss('test-payment-config')
        
        if (data.code === 0) {
          toast.success('支付配置测试成功', {
            description: `响应时间: ${data.data.response_time}ms`
          })
        } else {
          toast.error('支付配置测试失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('test-payment-config')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'testPaymentConfig',
          configId: variables.id
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('支付配置测试失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 同步支付状态
 */
export const useSyncPaymentStatus = (options?: Partial<UseMutationOptions<ApiResponse<any>, Error, SyncPaymentStatusRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (syncData: SyncPaymentStatusRequest) => {
      // 模拟同步支付状态的API调用，实际应该调用后端API
      return new Promise<ApiResponse<any>>((resolve) => {
        setTimeout(() => {
          resolve({
            code: 0,
            message: '同步完成',
            data: {
              total_count: syncData.payment_ids.length,
              success_count: syncData.payment_ids.length - Math.floor(Math.random() * 2),
              failed_count: Math.floor(Math.random() * 2),
              updated_payments: syncData.payment_ids.slice(0, -Math.floor(Math.random() * 2))
            }
          })
        }, 3000)
      })
    },
    ...createMutationOptions({
      onMutate: async (syncData: SyncPaymentStatusRequest) => {
        toast.loading(`正在同步 ${syncData.payment_ids.length} 个支付状态...`, { id: 'sync-payment-status' })
        return { syncData }
      },
      
      onSuccess: (data: ApiResponse<any>, variables: SyncPaymentStatusRequest, context: any) => {
        toast.dismiss('sync-payment-status')
        
        if (data.code === 0) {
          toast.success('支付状态同步完成', {
            description: `成功同步 ${data.data.success_count} 个支付，失败 ${data.data.failed_count} 个`
          })
          
          // 失效相关查询以获取最新数据
          invalidationUtils.invalidatePaymentQueries(queryClient)
          invalidationUtils.invalidateStatsQueries(queryClient)
        } else {
          toast.error('支付状态同步失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables: SyncPaymentStatusRequest, context: any) => {
        toast.dismiss('sync-payment-status')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'syncPaymentStatus',
          paymentIds: variables.payment_ids
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('支付状态同步失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 批量启用重试策略
 */
export const useBatchEnableStrategies = (options?: Partial<UseMutationOptions<RetryApiResponse<void>, Error, string[]>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (strategyIds: string[]) => paymentRetryService.batchEnableStrategies(strategyIds),
    ...createMutationOptions({
      onMutate: async (strategyIds) => {
        toast.loading(`正在启用 ${strategyIds.length} 个策略...`, { id: 'batch-enable-strategies' })
        return { strategyIds, operation: 'batch-enable' }
      },
      
      onSuccess: (data, strategyIds, context: any) => {
        toast.dismiss('batch-enable-strategies')
        
        if (data.code === 0) {
          toast.success('批量启用成功', {
            description: `已启用 ${strategyIds.length} 个重试策略`
          })
          
          invalidationUtils.invalidateRetryStrategyQueries(queryClient)
        } else {
          toast.error('批量启用失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error, strategyIds, context: any) => {
        toast.dismiss('batch-enable-strategies')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'batchEnableStrategies',
          strategyIds
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('批量启用失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 批量禁用重试策略
 */
export const useBatchDisableStrategies = (options?: Partial<UseMutationOptions<RetryApiResponse<void>, Error, string[]>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (strategyIds: string[]) => paymentRetryService.batchDisableStrategies(strategyIds),
    ...createMutationOptions({
      onMutate: async (strategyIds) => {
        toast.loading(`正在禁用 ${strategyIds.length} 个策略...`, { id: 'batch-disable-strategies' })
        return { strategyIds, operation: 'batch-disable' }
      },
      
      onSuccess: (data, strategyIds, context: any) => {
        toast.dismiss('batch-disable-strategies')
        
        if (data.code === 0) {
          toast.success('批量禁用成功', {
            description: `已禁用 ${strategyIds.length} 个重试策略`
          })
          
          invalidationUtils.invalidateRetryStrategyQueries(queryClient)
        } else {
          toast.error('批量禁用失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error, strategyIds, context: any) => {
        toast.dismiss('batch-disable-strategies')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'batchDisableStrategies',
          strategyIds
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('批量禁用失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 批量删除重试策略
 */
export const useBatchDeleteStrategies = (options?: Partial<UseMutationOptions<RetryApiResponse<void>, Error, string[]>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (strategyIds: string[]) => paymentRetryService.batchDeleteStrategies(strategyIds),
    ...createMutationOptions({
      onMutate: async (strategyIds) => {
        toast.loading(`正在删除 ${strategyIds.length} 个策略...`, { id: 'batch-delete-strategies' })
        return { strategyIds, operation: 'batch-delete' }
      },
      
      onSuccess: (data, strategyIds, context: any) => {
        toast.dismiss('batch-delete-strategies')
        
        if (data.code === 0) {
          toast.success('批量删除成功', {
            description: `已删除 ${strategyIds.length} 个重试策略`
          })
          
          invalidationUtils.invalidateRetryStrategyQueries(queryClient)
        } else {
          toast.error('批量删除失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error, strategyIds, context: any) => {
        toast.dismiss('batch-delete-strategies')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'batchDeleteStrategies',
          strategyIds
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('批量删除失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 默认导出 ====================

export default {
  // 支付配置相关
  useCreatePaymentConfig,
  useUpdatePaymentConfig,
  useDeletePaymentConfig,
  useTogglePaymentConfig,
  
  // 重试策略相关
  useCreateRetryStrategy,
  useUpdateRetryStrategy,
  useDeleteRetryStrategy,
  useBatchEnableStrategies,
  useBatchDisableStrategies,
  useBatchDeleteStrategies,
  
  // 高级操作
  useTestPaymentConfig,
  useSyncPaymentStatus,
}

// 导出工具函数
export {
  invalidationUtils,
  optimisticUpdateUtils,
}