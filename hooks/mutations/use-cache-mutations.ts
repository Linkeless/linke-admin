'use client'

/**
 * 缓存变更 Hooks
 * 
 * 基于 React Query 实现的缓存数据变更钩子集合
 * 支持缓存操作、清理、配置等变更操作，包含乐观更新机制
 * 遵循统一的缓存策略和错误处理机制
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CacheService } from '@/lib/cache-service'
import { queryKeys, CacheInvalidationUtils } from '@/lib/query-keys'
import { createMutationOptions } from '@/lib/cache-strategies'
import { globalErrorHandler, reactQueryErrorUtils, errorUtils } from '@/lib/error-handler'
import {
  ApiResponse,
  CacheOperationRequest,
  CacheOperationResponse,
  CreateAlertRequest,
  CacheAlert,
  CacheMaintenanceRequest,
  CacheMaintenanceResponse
} from '@/lib/cache-types'

// ==================== 类型定义 ====================

/**
 * 缓存操作上下文
 */
interface CacheMutationContext {
  operation: string
  target?: string
  previousData?: any
}

/**
 * 批量操作结果
 */
interface BatchOperationResult {
  successCount: number
  failedCount: number
  errors: string[]
}

// ==================== 工具函数 ====================

/**
 * 缓存失效工具函数
 */
const invalidationUtils = {
  /**
   * 失效缓存相关的所有查询
   */
  invalidateCacheQueries: async (queryClient: any, operation?: string) => {
    // 失效缓存模块的所有查询
    await queryClient.invalidateQueries({ 
      queryKey: CacheInvalidationUtils.getModulePrefix('cache') 
    })
    
    // 根据操作类型，失效特定查询
    if (operation === 'clear' || operation === 'refresh') {
      // 强制重新获取指标数据
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.cache.metrics() 
      })
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.cache.stats() 
      })
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.cache.keys() 
      })
    }
    
    if (operation === 'maintenance') {
      // 失效健康状态检查
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.cache.health() 
      })
    }
  }
}

// ==================== 缓存操作 Mutations ====================

/**
 * 清理缓存
 */
export const useClearCache = (options?: Partial<UseMutationOptions<CacheOperationResponse, Error, CacheOperationRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (request: CacheOperationRequest) => CacheService.management.clearCache(request),
    ...createMutationOptions({
      onMutate: async (request: CacheOperationRequest) => {
        // 取消正在进行的相关查询
        await queryClient.cancelQueries({ queryKey: queryKeys.cache.all })
        
        // 保存当前数据用于回滚
        const previousData = {
          metrics: queryClient.getQueryData(queryKeys.cache.metrics()),
          stats: queryClient.getQueryData(queryKeys.cache.stats()),
          keys: queryClient.getQueryData(queryKeys.cache.keys())
        }
        
        // 显示操作中的提示
        const targetText = request.target === 'all' ? '全部缓存' : 
                          request.target === 'pattern' ? `模式 "${request.pattern}"` :
                          request.target === 'keys' ? '指定键' : '缓存'
        
        toast.loading(`正在清理${targetText}...`, { id: 'clear-cache' })
        
        return { previousData, operation: 'clear', target: request.target }
      },
      
      onSuccess: (data: CacheOperationResponse, variables: CacheOperationRequest, context: any) => {
        toast.dismiss('clear-cache')
        
        if (data.success) {
          const targetText = variables.target === 'all' ? '全部缓存' : 
                            variables.target === 'pattern' ? `模式缓存` :
                            variables.target === 'keys' ? '指定缓存键' : '缓存'
          
          toast.success('缓存清理成功', {
            description: `${targetText}已清理，共清理 ${data.affected_keys} 个键`
          })
          
          // 失效相关查询以获取最新数据
          invalidationUtils.invalidateCacheQueries(queryClient, 'clear')
        } else {
          toast.error('缓存清理失败', {
            description: data.message || '清理缓存时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables: CacheOperationRequest, context: any) => {
        toast.dismiss('clear-cache')
        
        // 处理错误并显示用户友好的消息
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'clearCache',
          request: variables
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('缓存清理失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 刷新缓存
 */
export const useRefreshCache = (options?: Partial<UseMutationOptions<CacheOperationResponse, Error, CacheOperationRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (request: CacheOperationRequest) => CacheService.management.refreshCache(request),
    ...createMutationOptions({
      onMutate: async (request: CacheOperationRequest) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.cache.all })
        
        const previousData = {
          metrics: queryClient.getQueryData(queryKeys.cache.metrics()),
          stats: queryClient.getQueryData(queryKeys.cache.stats())
        }
        
        const targetText = request.target === 'all' ? '全部缓存' : 
                          request.target === 'pattern' ? `模式 "${request.pattern}"` :
                          '指定缓存'
        
        toast.loading(`正在刷新${targetText}...`, { id: 'refresh-cache' })
        
        return { previousData, operation: 'refresh', target: request.target }
      },
      
      onSuccess: (data: CacheOperationResponse, variables: CacheOperationRequest, context: any) => {
        toast.dismiss('refresh-cache')
        
        if (data.success) {
          const targetText = variables.target === 'all' ? '全部缓存' : '指定缓存'
          
          toast.success('缓存刷新成功', {
            description: `${targetText}已刷新，处理 ${data.affected_keys} 个键`
          })
          
          invalidationUtils.invalidateCacheQueries(queryClient, 'refresh')
        } else {
          toast.error('缓存刷新失败', {
            description: data.message || '刷新缓存时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables: CacheOperationRequest, context: any) => {
        toast.dismiss('refresh-cache')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'refreshCache',
          request: variables
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('缓存刷新失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 预热缓存
 */
export const useWarmupCache = (options?: Partial<UseMutationOptions<CacheOperationResponse, Error, CacheOperationRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (request: CacheOperationRequest) => CacheService.management.warmupCache(request),
    ...createMutationOptions({
      onMutate: async (request: CacheOperationRequest) => {
        const targetText = request.target === 'all' ? '全部缓存' : 
                          request.pattern ? `模式 "${request.pattern}"` :
                          '指定缓存'
        
        toast.loading(`正在预热${targetText}...`, { id: 'warmup-cache' })
        
        return { operation: 'warmup', target: request.target }
      },
      
      onSuccess: (data: CacheOperationResponse, variables: CacheOperationRequest, context: any) => {
        toast.dismiss('warmup-cache')
        
        if (data.success) {
          const targetText = variables.target === 'all' ? '全部缓存' : '指定缓存'
          
          toast.success('缓存预热成功', {
            description: `${targetText}预热完成，处理 ${data.affected_keys} 个键`
          })
          
          // 预热后刷新指标数据
          invalidationUtils.invalidateCacheQueries(queryClient, 'warmup')
        } else {
          toast.error('缓存预热失败', {
            description: data.message || '预热缓存时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables: CacheOperationRequest, context: any) => {
        toast.dismiss('warmup-cache')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'warmupCache',
          request: variables
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('缓存预热失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 删除缓存键
 */
export const useDeleteCacheKey = (options?: Partial<UseMutationOptions<{ success: boolean; message: string }, Error, string>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (key: string) => CacheService.management.deleteKey(key),
    ...createMutationOptions({
      onMutate: async (key: string) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.cache.keys() })
        
        // 保存当前键列表数据
        const previousKeysData = queryClient.getQueryData(queryKeys.cache.keys())
        
        toast.loading(`正在删除缓存键 "${key}"...`, { id: 'delete-cache-key' })
        
        return { previousKeysData, key }
      },
      
      onSuccess: (data: { success: boolean; message: string }, key: string, context: any) => {
        toast.dismiss('delete-cache-key')
        
        if (data.success) {
          toast.success('缓存键删除成功', {
            description: `缓存键 "${key}" 已删除`
          })
          
          // 失效键列表和统计数据
          queryClient.invalidateQueries({ queryKey: queryKeys.cache.keys() })
          queryClient.invalidateQueries({ queryKey: queryKeys.cache.stats() })
          queryClient.invalidateQueries({ queryKey: queryKeys.cache.metrics() })
        } else {
          toast.error('缓存键删除失败', {
            description: data.message || '删除缓存键时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, key: string, context: any) => {
        toast.dismiss('delete-cache-key')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'deleteCacheKey',
          key
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('缓存键删除失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 批量删除缓存键
 */
export const useBatchDeleteCacheKeys = (options?: Partial<UseMutationOptions<BatchOperationResult, Error, string>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (pattern: string) => {
      try {
        const result = await CacheService.batchDeleteKeys(pattern)
        return {
          successCount: result.deleted_count,
          failedCount: 0,
          errors: []
        }
      } catch (error) {
        throw error
      }
    },
    ...createMutationOptions({
      onMutate: async (pattern: string) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.cache.keys() })
        
        const previousData = {
          keys: queryClient.getQueryData(queryKeys.cache.keys()),
          stats: queryClient.getQueryData(queryKeys.cache.stats())
        }
        
        toast.loading(`正在批量删除匹配模式 "${pattern}" 的缓存键...`, { id: 'batch-delete-keys' })
        
        return { previousData, pattern }
      },
      
      onSuccess: (data: BatchOperationResult, pattern: string, context: any) => {
        toast.dismiss('batch-delete-keys')
        
        if (data.successCount > 0) {
          if (data.failedCount === 0) {
            toast.success('批量删除成功', {
              description: `成功删除 ${data.successCount} 个缓存键`
            })
          } else {
            toast.warning('批量删除部分成功', {
              description: `成功删除 ${data.successCount} 个缓存键，${data.failedCount} 个失败`
            })
          }
          
          // 失效相关查询
          invalidationUtils.invalidateCacheQueries(queryClient, 'clear')
        } else {
          toast.info('未找到匹配的缓存键', {
            description: `模式 "${pattern}" 没有匹配到任何缓存键`
          })
        }
      },
      
      onError: async (error: Error, pattern: string, context: any) => {
        toast.dismiss('batch-delete-keys')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'batchDeleteKeys',
          pattern
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

// ==================== 缓存维护 Mutations ====================

/**
 * 执行缓存维护
 */
export const useCacheMaintenance = (options?: Partial<UseMutationOptions<CacheMaintenanceResponse, Error, CacheMaintenanceRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (request: CacheMaintenanceRequest) => CacheService.management.performMaintenance(request),
    ...createMutationOptions({
      onMutate: async (request: CacheMaintenanceRequest) => {
        const operationText = request.operation === 'cleanup' ? '清理' :
                             request.operation === 'optimize' ? '优化' :
                             request.operation === 'defragment' ? '碎片整理' : '维护'
        
        toast.loading(`正在执行缓存${operationText}...`, { id: 'cache-maintenance' })
        
        return { operation: request.operation }
      },
      
      onSuccess: (data: CacheMaintenanceResponse, variables: CacheMaintenanceRequest, context: any) => {
        toast.dismiss('cache-maintenance')
        
        if (data.success) {
          const operationText = variables.operation === 'cleanup' ? '清理' :
                               variables.operation === 'optimize' ? '优化' :
                               variables.operation === 'defragment' ? '碎片整理' : '维护'
          
          toast.success(`缓存${operationText}完成`, {
            description: data.message || `维护操作执行成功，耗时 ${data.duration}ms`
          })
          
          // 维护后失效所有缓存查询
          invalidationUtils.invalidateCacheQueries(queryClient, 'maintenance')
        } else {
          toast.error('缓存维护失败', {
            description: data.message || '维护操作执行失败'
          })
        }
      },
      
      onError: async (error: Error, variables: CacheMaintenanceRequest, context: any) => {
        toast.dismiss('cache-maintenance')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'cacheMaintenance',
          request: variables
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('缓存维护失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 缓存告警管理 Mutations ====================

/**
 * 创建缓存告警
 */
export const useCreateCacheAlert = (options?: Partial<UseMutationOptions<CacheAlert, Error, CreateAlertRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (alertData: CreateAlertRequest) => CacheService.monitoring.createAlert(alertData),
    ...createMutationOptions({
      onMutate: async (alertData: CreateAlertRequest) => {
        await queryClient.cancelQueries({ queryKey: [...queryKeys.cache.all, 'alerts'] })
        
        toast.loading('正在创建缓存告警...', { id: 'create-cache-alert' })
        
        return { alertData }
      },
      
      onSuccess: (data: CacheAlert, variables: CreateAlertRequest, context: any) => {
        toast.dismiss('create-cache-alert')
        
        toast.success('缓存告警创建成功', {
          description: `告警 "${data.name}" 已创建并激活`
        })
        
        // 失效告警列表查询
        queryClient.invalidateQueries({ queryKey: [...queryKeys.cache.all, 'alerts'] })
      },
      
      onError: async (error: Error, variables: CreateAlertRequest, context: any) => {
        toast.dismiss('create-cache-alert')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'createCacheAlert',
          alertData: variables
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('缓存告警创建失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 删除缓存告警
 */
export const useDeleteCacheAlert = (options?: Partial<UseMutationOptions<{ success: boolean; message: string }, Error, string>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => CacheService.monitoring.deleteAlert(id),
    ...createMutationOptions({
      onMutate: async (id: string) => {
        await queryClient.cancelQueries({ queryKey: [...queryKeys.cache.all, 'alerts'] })
        
        // 保存当前告警列表数据
        const previousAlertsData = queryClient.getQueryData([...queryKeys.cache.all, 'alerts'])
        
        toast.loading('正在删除缓存告警...', { id: 'delete-cache-alert' })
        
        return { previousAlertsData, alertId: id }
      },
      
      onSuccess: (data: { success: boolean; message: string }, id: string, context: any) => {
        toast.dismiss('delete-cache-alert')
        
        if (data.success) {
          toast.success('缓存告警删除成功', {
            description: '告警规则已成功删除'
          })
          
          // 失效告警列表查询
          queryClient.invalidateQueries({ queryKey: [...queryKeys.cache.all, 'alerts'] })
        } else {
          toast.error('缓存告警删除失败', {
            description: data.message || '删除告警时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, id: string, context: any) => {
        toast.dismiss('delete-cache-alert')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'deleteCacheAlert',
          alertId: id
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('缓存告警删除失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 复合操作 Mutations ====================

/**
 * 完整缓存重置（清理 + 预热）
 */
export const useResetCache = (options?: Partial<UseMutationOptions<void, Error, { pattern?: string; warmupKeys?: string[] }>>) => {
  const clearCache = useClearCache()
  const warmupCache = useWarmupCache()
  
  return useMutation({
    mutationFn: async ({ pattern, warmupKeys }: { pattern?: string; warmupKeys?: string[] }) => {
      // 先清理缓存
      const clearRequest: CacheOperationRequest = {
        operation: 'clear',
        target: pattern ? 'pattern' : 'all',
        pattern: pattern,
        confirm: true
      }
      
      await clearCache.mutateAsync(clearRequest)
      
      // 如果指定了预热键，则执行预热
      if (warmupKeys && warmupKeys.length > 0) {
        const warmupRequest: CacheOperationRequest = {
          operation: 'warmup',
          target: 'keys',
          keys: warmupKeys,
          confirm: true
        }
        
        await warmupCache.mutateAsync(warmupRequest)
      }
    },
    ...createMutationOptions({
      onMutate: async ({ pattern, warmupKeys }) => {
        toast.loading('正在重置缓存...', { id: 'reset-cache' })
        return { pattern, warmupKeys }
      },
      
      onSuccess: (data: void, variables, context: any) => {
        toast.dismiss('reset-cache')
        toast.success('缓存重置完成', {
          description: variables.warmupKeys ? '缓存已清理并预热完成' : '缓存已完全清理'
        })
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('reset-cache')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'resetCache',
          variables
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('缓存重置失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 导出 ====================

export default {
  // 基础操作
  useClearCache,
  useRefreshCache,
  useWarmupCache,
  useDeleteCacheKey,
  useBatchDeleteCacheKeys,
  
  // 维护操作
  useCacheMaintenance,
  
  // 告警管理
  useCreateCacheAlert,
  useDeleteCacheAlert,
  
  // 复合操作
  useResetCache
}

// 导出工具函数
export {
  invalidationUtils
}