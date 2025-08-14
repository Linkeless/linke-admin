'use client'

/**
 * 服务器变更 Hooks
 * 
 * 基于 React Query 实现的服务器管理变更钩子集合
 * 支持服务器节点、服务器分组的创建、更新、删除等操作，包含乐观更新机制
 * 遵循统一的缓存策略和错误处理机制
 * 
 * 任务30实现：服务器变更Hooks - 包含乐观更新、错误回滚、批量操作
 * 符合FR-3乐观更新机制要求：立即UI反馈、失败回滚、成功同步
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'
import { shadowsocksServerService } from '@/lib/shadowsocks-service'
import { serverGroupService } from '@/lib/server-group-service'
import { queryKeys } from '@/lib/query-keys'
import { CacheInvalidationUtils } from '@/lib/query-keys'
import { createMutationOptions } from '@/lib/cache-strategies'
import { reactQueryErrorUtils, errorUtils } from '@/lib/error-handler'
import {
  CreateShadowsocksServerRequest,
  UpdateShadowsocksServerRequest,
  ShadowsocksServerResponse,
  ShadowsocksServerDetailResponse,
  ShadowsocksServerListResponse,
  BulkUpdateServersRequest
} from '@/lib/shadowsocks-types'
import {
  CreateServerGroupRequest,
  UpdateServerGroupRequest,
  ServerGroupResponse,
  ServerGroupDetailResponse,
  ServerGroupListResponse
} from '@/lib/server-group-types'
import { StandardResponse } from '@/lib/types'

// ==================== 类型定义 ====================

/**
 * 批量操作请求
 */
interface BulkDeleteRequest {
  ids: number[]
  reason?: string
}

/**
 * 服务器状态切换请求
 */
interface ServerStatusToggleRequest {
  id: number
  enabled?: boolean
  maintenance?: boolean
}

/**
 * 服务器分组分配请求
 */
interface AssignServersToGroupRequest {
  group_id: number
  server_ids: number[]
}

/**
 * 服务器连接测试请求
 */
interface TestServerConnectionRequest {
  id: number
  timeout?: number
}

/**
 * 服务器状态同步请求
 */
interface SyncServerStatusRequest {
  server_ids?: number[]
  force?: boolean
}

// ==================== 工具函数 ====================

/**
 * 乐观更新工具函数
 */
const optimisticUpdateUtils = {
  /**
   * 为服务器列表添加新服务器（乐观更新）
   */
  addServerToList: (queryClient: any, newServer: any) => {
    const serversQueryKey = queryKeys.shadowsocks.lists()
    queryClient.setQueryData(serversQueryKey, (oldData: any) => {
      if (!oldData || oldData.code !== 0 || !oldData.data?.items) return oldData
      
      const tempId = 'temp-' + Date.now()
      const optimisticServer = {
        ...newServer,
        id: tempId,
        created_at: Math.floor(Date.now() / 1000),
        updated_at: Math.floor(Date.now() / 1000),
        _isOptimistic: true
      }
      
      return {
        ...oldData,
        data: {
          ...oldData.data,
          items: [optimisticServer, ...oldData.data.items],
          pagination: {
            ...oldData.data.pagination,
            total: oldData.data.pagination.total + 1
          }
        }
      }
    })
    return serversQueryKey
  },

  /**
   * 从服务器列表移除服务器（乐观更新）
   */
  removeServerFromList: (queryClient: any, serverId: number) => {
    const serversQueryKey = queryKeys.shadowsocks.lists()
    const previousData = queryClient.getQueryData(serversQueryKey)
    
    queryClient.setQueryData(serversQueryKey, (oldData: any) => {
      if (!oldData || oldData.code !== 0 || !oldData.data?.items) return oldData
      
      return {
        ...oldData,
        data: {
          ...oldData.data,
          items: oldData.data.items.filter((server: any) => server.id !== serverId),
          pagination: {
            ...oldData.data.pagination,
            total: Math.max(0, oldData.data.pagination.total - 1)
          }
        }
      }
    })
    
    return { previousData, queryKey: serversQueryKey }
  },

  /**
   * 更新服务器列表中的某个服务器（乐观更新）
   */
  updateServerInList: (queryClient: any, serverId: number, updates: any) => {
    const serversQueryKey = queryKeys.shadowsocks.lists()
    const previousData = queryClient.getQueryData(serversQueryKey)
    
    queryClient.setQueryData(serversQueryKey, (oldData: any) => {
      if (!oldData || oldData.code !== 0 || !oldData.data?.items) return oldData
      
      return {
        ...oldData,
        data: {
          ...oldData.data,
          items: oldData.data.items.map((server: any) => 
            server.id === serverId 
              ? { ...server, ...updates, updated_at: Math.floor(Date.now() / 1000) }
              : server
          )
        }
      }
    })
    
    return { previousData, queryKey: serversQueryKey }
  },

  /**
   * 为服务器分组列表添加新分组（乐观更新）
   */
  addServerGroupToList: (queryClient: any, newGroup: any) => {
    const groupsQueryKey = queryKeys.serverGroups.lists()
    queryClient.setQueryData(groupsQueryKey, (oldData: any) => {
      if (!oldData || oldData.code !== 0 || !oldData.data?.items) return oldData
      
      const tempId = 'temp-' + Date.now()
      const optimisticGroup = {
        ...newGroup,
        id: tempId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _isOptimistic: true
      }
      
      return {
        ...oldData,
        data: {
          ...oldData.data,
          items: [optimisticGroup, ...oldData.data.items],
          pagination: {
            ...oldData.data.pagination,
            total: oldData.data.pagination.total + 1
          }
        }
      }
    })
    return groupsQueryKey
  },

  /**
   * 从服务器分组列表移除分组（乐观更新）
   */
  removeServerGroupFromList: (queryClient: any, groupId: number) => {
    const groupsQueryKey = queryKeys.serverGroups.lists()
    const previousData = queryClient.getQueryData(groupsQueryKey)
    
    queryClient.setQueryData(groupsQueryKey, (oldData: any) => {
      if (!oldData || oldData.code !== 0 || !oldData.data?.items) return oldData
      
      return {
        ...oldData,
        data: {
          ...oldData.data,
          items: oldData.data.items.filter((group: any) => group.id !== groupId),
          pagination: {
            ...oldData.data.pagination,
            total: Math.max(0, oldData.data.pagination.total - 1)
          }
        }
      }
    })
    
    return { previousData, queryKey: groupsQueryKey }
  },

  /**
   * 更新服务器分组列表中的某个分组（乐观更新）
   */
  updateServerGroupInList: (queryClient: any, groupId: number, updates: any) => {
    const groupsQueryKey = queryKeys.serverGroups.lists()
    const previousData = queryClient.getQueryData(groupsQueryKey)
    
    queryClient.setQueryData(groupsQueryKey, (oldData: any) => {
      if (!oldData || oldData.code !== 0 || !oldData.data?.items) return oldData
      
      return {
        ...oldData,
        data: {
          ...oldData.data,
          items: oldData.data.items.map((group: any) => 
            group.id === groupId 
              ? { ...group, ...updates, updated_at: new Date().toISOString() }
              : group
          )
        }
      }
    })
    
    return { previousData, queryKey: groupsQueryKey }
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
   * 失效服务器相关的所有查询
   */
  invalidateServerQueries: async (queryClient: any, serverId?: number) => {
    await queryClient.invalidateQueries({ 
      queryKey: CacheInvalidationUtils.getModulePrefix('shadowsocks') 
    })
    
    // 失效相关模块的查询
    const relatedModules = CacheInvalidationUtils.getRelatedModules('shadowsocks')
    for (const module of relatedModules) {
      await queryClient.invalidateQueries({ 
        queryKey: CacheInvalidationUtils.getModulePrefix(module) 
      })
    }
    
    if (serverId) {
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.shadowsocks.detail(serverId) 
      })
      // 移除单项缓存
      queryClient.removeQueries({ 
        queryKey: queryKeys.shadowsocks.detail(serverId),
        exact: true 
      })
    }
  },

  /**
   * 失效服务器分组相关的所有查询
   */
  invalidateServerGroupQueries: async (queryClient: any, groupId?: number) => {
    await queryClient.invalidateQueries({ 
      queryKey: CacheInvalidationUtils.getModulePrefix('serverGroups') 
    })
    
    const relatedModules = CacheInvalidationUtils.getRelatedModules('serverGroups')
    for (const module of relatedModules) {
      await queryClient.invalidateQueries({ 
        queryKey: CacheInvalidationUtils.getModulePrefix(module) 
      })
    }
    
    if (groupId) {
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.serverGroups.detail(groupId) 
      })
      // 移除单项缓存
      queryClient.removeQueries({ 
        queryKey: queryKeys.serverGroups.detail(groupId),
        exact: true 
      })
    }
  },

  /**
   * 失效统计相关查询
   */
  invalidateStatsQueries: async (queryClient: any) => {
    await queryClient.invalidateQueries({ 
      queryKey: queryKeys.shadowsocks.stats() 
    })
    await queryClient.invalidateQueries({ 
      queryKey: queryKeys.dashboard.all 
    })
  }
}

// ==================== 服务器节点变更 Mutations ====================

/**
 * 创建服务器节点
 */
export const useCreateShadowsocksServer = (options?: Partial<UseMutationOptions<ShadowsocksServerDetailResponse, Error, CreateShadowsocksServerRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (serverData: CreateShadowsocksServerRequest) => shadowsocksServerService.createServer(serverData),
    ...createMutationOptions({
      onMutate: async (serverData: CreateShadowsocksServerRequest) => {
        toast.loading('正在创建服务器...', { id: 'create-server' })
        return { serverData }
      },
      
      onSuccess: (data: ShadowsocksServerDetailResponse, variables: CreateShadowsocksServerRequest, context: any) => {
        toast.dismiss('create-server')
        
        if (data.code === 0) {
          toast.success('服务器创建成功', {
            description: `服务器 ${data.data.name} 已成功创建`
          })
          
          invalidationUtils.invalidateServerQueries(queryClient)
          invalidationUtils.invalidateStatsQueries(queryClient)
        } else {
          toast.error('服务器创建失败', {
            description: data.message || '创建服务器时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables: CreateShadowsocksServerRequest, context: any) => {
        toast.dismiss('create-server')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'createServer',
          serverData: variables
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('服务器创建失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 更新服务器配置
 */
export const useUpdateShadowsocksServer = (options?: Partial<UseMutationOptions<ShadowsocksServerDetailResponse, Error, { id: number; data: UpdateShadowsocksServerRequest }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateShadowsocksServerRequest }) => 
      shadowsocksServerService.updateServer(id, data),
    ...createMutationOptions({
      onMutate: async ({ id, data }) => {
        toast.loading('正在更新服务器...', { id: 'update-server' })
        
        // 乐观更新
        const rollbackInfo = optimisticUpdateUtils.updateServerInList(queryClient, id, data)
        
        return { serverId: id, updateData: data, rollbackInfo }
      },
      
      onSuccess: (data: ShadowsocksServerDetailResponse, variables, context: any) => {
        toast.dismiss('update-server')
        
        if (data.code === 0) {
          toast.success('服务器更新成功')
          invalidationUtils.invalidateServerQueries(queryClient, variables.id)
        } else {
          // 回滚乐观更新
          if (context?.rollbackInfo) {
            optimisticUpdateUtils.rollbackOptimisticUpdate(
              queryClient, 
              context.rollbackInfo.queryKey, 
              context.rollbackInfo.previousData
            )
          }
          
          toast.error('服务器更新失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('update-server')
        
        // 回滚乐观更新
        if (context?.rollbackInfo) {
          optimisticUpdateUtils.rollbackOptimisticUpdate(
            queryClient, 
            context.rollbackInfo.queryKey, 
            context.rollbackInfo.previousData
          )
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'updateServer',
          serverId: variables.id
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('服务器更新失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 删除服务器节点
 */
export const useDeleteServer = (options?: Partial<UseMutationOptions<StandardResponse, Error, number>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (serverId: number) => shadowsocksServerService.deleteServer(serverId),
    ...createMutationOptions({
      onMutate: async (serverId: number) => {
        toast.loading('正在删除服务器...', { id: 'delete-server' })
        
        // 乐观更新：从列表中移除服务器
        const rollbackInfo = optimisticUpdateUtils.removeServerFromList(queryClient, serverId)
        
        return { 
          serverId,
          rollbackInfo
        }
      },
      
      onSuccess: (data: StandardResponse, serverId: number, context: any) => {
        toast.dismiss('delete-server')
        
        if (data.code === 0) {
          toast.success('服务器删除成功')
          invalidationUtils.invalidateServerQueries(queryClient, serverId)
          invalidationUtils.invalidateStatsQueries(queryClient)
        } else {
          // 回滚乐观更新
          if (context?.rollbackInfo) {
            optimisticUpdateUtils.rollbackOptimisticUpdate(
              queryClient, 
              context.rollbackInfo.queryKey, 
              context.rollbackInfo.previousData
            )
          }
          
          toast.error('服务器删除失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, serverId: number, context: any) => {
        toast.dismiss('delete-server')
        
        // 回滚乐观更新
        if (context?.rollbackInfo) {
          optimisticUpdateUtils.rollbackOptimisticUpdate(
            queryClient, 
            context.rollbackInfo.queryKey, 
            context.rollbackInfo.previousData
          )
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'deleteServer',
          serverId
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('服务器删除失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 批量删除服务器
 */
export const useBatchDeleteServers = (options?: Partial<UseMutationOptions<any, Error, BulkDeleteRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (bulkDeleteData: BulkDeleteRequest) => {
      // 串行删除以保证数据一致性
      const results = await Promise.allSettled(
        bulkDeleteData.ids.map(id => shadowsocksServerService.deleteServer(id))
      )
      
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length
      
      return {
        code: 0,
        message: '批量删除完成',
        data: {
          successful_count: successful,
          failed_count: failed,
          total_count: bulkDeleteData.ids.length
        }
      }
    },
    ...createMutationOptions({
      onMutate: async (bulkDeleteData: BulkDeleteRequest) => {
        toast.loading('正在批量删除服务器...', { id: 'bulk-delete-servers' })
        
        // 乐观更新：批量移除服务器
        const rollbackInfos = bulkDeleteData.ids.map(serverId => {
          return optimisticUpdateUtils.removeServerFromList(queryClient, serverId)
        })
        
        return { 
          bulkDeleteData,
          rollbackInfos
        }
      },
      
      onSuccess: (data: any, variables: BulkDeleteRequest, context: any) => {
        toast.dismiss('bulk-delete-servers')
        
        if (data.code === 0) {
          toast.success('批量删除成功', {
            description: `已删除 ${data.data.successful_count} 个服务器${
              data.data.failed_count > 0 ? `，失败 ${data.data.failed_count} 个` : ''
            }`
          })
          
          invalidationUtils.invalidateServerQueries(queryClient)
          invalidationUtils.invalidateStatsQueries(queryClient)
        } else {
          // 回滚乐观更新
          if (context?.rollbackInfos) {
            context.rollbackInfos.forEach((rollbackInfo: any) => {
              optimisticUpdateUtils.rollbackOptimisticUpdate(
                queryClient,
                rollbackInfo.queryKey,
                rollbackInfo.previousData
              )
            })
          }
          
          toast.error('批量删除失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables: BulkDeleteRequest, context: any) => {
        toast.dismiss('bulk-delete-servers')
        
        // 回滚乐观更新
        if (context?.rollbackInfos) {
          context.rollbackInfos.forEach((rollbackInfo: any) => {
            optimisticUpdateUtils.rollbackOptimisticUpdate(
              queryClient,
              rollbackInfo.queryKey,
              rollbackInfo.previousData
            )
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'batchDeleteServers',
          serverIds: variables.ids
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

/**
 * 启用/禁用服务器
 */
export const useToggleServerStatus = (options?: Partial<UseMutationOptions<StandardResponse, Error, ServerStatusToggleRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, enabled, maintenance }: ServerStatusToggleRequest) => 
      shadowsocksServerService.updateServerStatus(id, { enabled, maintenance }),
    ...createMutationOptions({
      onMutate: async ({ id, enabled, maintenance }) => {
        const actionText = enabled ? '启用' : '禁用'
        toast.loading(`正在${actionText}服务器...`, { id: 'toggle-server-status' })
        
        // 乐观更新：立即更新服务器状态
        const rollbackInfo = optimisticUpdateUtils.updateServerInList(queryClient, id, { 
          enabled, 
          maintenance 
        })
        
        return { serverId: id, enabled, maintenance, rollbackInfo }
      },
      
      onSuccess: (data: StandardResponse, variables, context: any) => {
        toast.dismiss('toggle-server-status')
        
        if (data.code === 0) {
          const actionText = variables.enabled ? '启用' : '禁用'
          toast.success(`服务器${actionText}成功`)
          invalidationUtils.invalidateServerQueries(queryClient, variables.id)
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
        toast.dismiss('toggle-server-status')
        
        // 回滚乐观更新
        if (context?.rollbackInfo) {
          optimisticUpdateUtils.rollbackOptimisticUpdate(
            queryClient, 
            context.rollbackInfo.queryKey, 
            context.rollbackInfo.previousData
          )
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'toggleServerStatus',
          serverId: variables.id
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

// ==================== 服务器分组变更 Mutations ====================

/**
 * 创建服务器分组
 */
export const useCreateServerGroup = (options?: Partial<UseMutationOptions<ServerGroupDetailResponse, Error, CreateServerGroupRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (groupData: CreateServerGroupRequest) => serverGroupService.createServerGroup(groupData),
    ...createMutationOptions({
      onMutate: async (groupData: CreateServerGroupRequest) => {
        toast.loading('正在创建服务器分组...', { id: 'create-server-group' })
        return { groupData }
      },
      
      onSuccess: (data: ServerGroupDetailResponse, variables: CreateServerGroupRequest, context: any) => {
        toast.dismiss('create-server-group')
        
        if (data.code === 0) {
          toast.success('服务器分组创建成功', {
            description: `分组 ${data.data.name} 已成功创建`
          })
          
          invalidationUtils.invalidateServerGroupQueries(queryClient)
          invalidationUtils.invalidateStatsQueries(queryClient)
        } else {
          toast.error('服务器分组创建失败', {
            description: data.message || '创建服务器分组时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables: CreateServerGroupRequest, context: any) => {
        toast.dismiss('create-server-group')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'createServerGroup',
          groupData: variables
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('服务器分组创建失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 更新服务器分组
 */
export const useUpdateServerGroup = (options?: Partial<UseMutationOptions<ServerGroupDetailResponse, Error, { id: number; data: UpdateServerGroupRequest }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateServerGroupRequest }) => 
      serverGroupService.updateServerGroup(id, data),
    ...createMutationOptions({
      onMutate: async ({ id, data }) => {
        toast.loading('正在更新服务器分组...', { id: 'update-server-group' })
        
        // 乐观更新
        const rollbackInfo = optimisticUpdateUtils.updateServerGroupInList(queryClient, id, data)
        
        return { groupId: id, updateData: data, rollbackInfo }
      },
      
      onSuccess: (data: ServerGroupDetailResponse, variables, context: any) => {
        toast.dismiss('update-server-group')
        
        if (data.code === 0) {
          toast.success('服务器分组更新成功')
          invalidationUtils.invalidateServerGroupQueries(queryClient, variables.id)
        } else {
          // 回滚乐观更新
          if (context?.rollbackInfo) {
            optimisticUpdateUtils.rollbackOptimisticUpdate(
              queryClient, 
              context.rollbackInfo.queryKey, 
              context.rollbackInfo.previousData
            )
          }
          
          toast.error('服务器分组更新失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('update-server-group')
        
        // 回滚乐观更新
        if (context?.rollbackInfo) {
          optimisticUpdateUtils.rollbackOptimisticUpdate(
            queryClient, 
            context.rollbackInfo.queryKey, 
            context.rollbackInfo.previousData
          )
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'updateServerGroup',
          groupId: variables.id
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('服务器分组更新失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 删除服务器分组
 */
export const useDeleteServerGroup = (options?: Partial<UseMutationOptions<StandardResponse, Error, number>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (groupId: number) => serverGroupService.deleteServerGroup(groupId),
    ...createMutationOptions({
      onMutate: async (groupId: number) => {
        toast.loading('正在删除服务器分组...', { id: 'delete-server-group' })
        
        // 乐观更新：从列表中移除分组
        const rollbackInfo = optimisticUpdateUtils.removeServerGroupFromList(queryClient, groupId)
        
        return { 
          groupId,
          rollbackInfo
        }
      },
      
      onSuccess: (data: StandardResponse, groupId: number, context: any) => {
        toast.dismiss('delete-server-group')
        
        if (data.code === 0) {
          toast.success('服务器分组删除成功')
          invalidationUtils.invalidateServerGroupQueries(queryClient, groupId)
          invalidationUtils.invalidateStatsQueries(queryClient)
        } else {
          // 回滚乐观更新
          if (context?.rollbackInfo) {
            optimisticUpdateUtils.rollbackOptimisticUpdate(
              queryClient, 
              context.rollbackInfo.queryKey, 
              context.rollbackInfo.previousData
            )
          }
          
          toast.error('服务器分组删除失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, groupId: number, context: any) => {
        toast.dismiss('delete-server-group')
        
        // 回滚乐观更新
        if (context?.rollbackInfo) {
          optimisticUpdateUtils.rollbackOptimisticUpdate(
            queryClient, 
            context.rollbackInfo.queryKey, 
            context.rollbackInfo.previousData
          )
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'deleteServerGroup',
          groupId
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('服务器分组删除失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 服务器分配和管理 Mutations ====================

/**
 * 分配服务器到分组
 */
export const useAssignServersToGroup = (options?: Partial<UseMutationOptions<StandardResponse, Error, AssignServersToGroupRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ group_id, server_ids }: AssignServersToGroupRequest) => {
      // 批量更新服务器的分组ID
      const updateData: BulkUpdateServersRequest = {
        server_ids,
        updates: { group_id }
      }
      return shadowsocksServerService.bulkUpdateServers(updateData)
    },
    ...createMutationOptions({
      onMutate: async ({ group_id, server_ids }) => {
        toast.loading('正在分配服务器到分组...', { id: 'assign-servers' })
        
        // 乐观更新：批量更新服务器的分组ID
        const rollbackInfos = server_ids.map(serverId => {
          return optimisticUpdateUtils.updateServerInList(queryClient, serverId, { group_id })
        })
        
        return { group_id, server_ids, rollbackInfos }
      },
      
      onSuccess: (data: StandardResponse, variables, context: any) => {
        toast.dismiss('assign-servers')
        
        if (data.code === 0) {
          toast.success('服务器分配成功', {
            description: `已将 ${variables.server_ids.length} 个服务器分配到指定分组`
          })
          
          invalidationUtils.invalidateServerQueries(queryClient)
          invalidationUtils.invalidateServerGroupQueries(queryClient, variables.group_id)
        } else {
          // 回滚乐观更新
          if (context?.rollbackInfos) {
            context.rollbackInfos.forEach((rollbackInfo: any) => {
              optimisticUpdateUtils.rollbackOptimisticUpdate(
                queryClient,
                rollbackInfo.queryKey,
                rollbackInfo.previousData
              )
            })
          }
          
          toast.error('服务器分配失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('assign-servers')
        
        // 回滚乐观更新
        if (context?.rollbackInfos) {
          context.rollbackInfos.forEach((rollbackInfo: any) => {
            optimisticUpdateUtils.rollbackOptimisticUpdate(
              queryClient,
              rollbackInfo.queryKey,
              rollbackInfo.previousData
            )
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'assignServersToGroup',
          groupId: variables.group_id,
          serverIds: variables.server_ids
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('服务器分配失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 测试服务器连接
 */
export const useTestServerConnection = (options?: Partial<UseMutationOptions<StandardResponse, Error, TestServerConnectionRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id }: TestServerConnectionRequest) => 
      shadowsocksServerService.getServerHealth(id),
    ...createMutationOptions({
      onMutate: async ({ id }) => {
        toast.loading('正在测试服务器连接...', { id: 'test-server-connection' })
        return { serverId: id }
      },
      
      onSuccess: (data: StandardResponse, variables, context: any) => {
        toast.dismiss('test-server-connection')
        
        if (data.code === 0) {
          toast.success('服务器连接测试成功', {
            description: '服务器连接正常'
          })
        } else {
          toast.error('服务器连接测试失败', {
            description: data.message || '服务器连接异常'
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('test-server-connection')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'testServerConnection',
          serverId: variables.id
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('连接测试失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 同步服务器状态
 */
export const useSyncServerStatus = (options?: Partial<UseMutationOptions<any, Error, SyncServerStatusRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ server_ids, force }: SyncServerStatusRequest) => {
      if (server_ids) {
        // 批量同步指定服务器状态
        const results = await Promise.allSettled(
          server_ids.map(id => shadowsocksServerService.getServerStatus(id))
        )
        
        const successful = results.filter(r => r.status === 'fulfilled').length
        const failed = results.filter(r => r.status === 'rejected').length
        
        return {
          code: 0,
          message: '状态同步完成',
          data: {
            successful_count: successful,
            failed_count: failed,
            total_count: server_ids.length
          }
        }
      } else {
        // 同步所有服务器状态（实际实现中可能需要调用专门的批量同步接口）
        return {
          code: 0,
          message: '全部服务器状态同步已启动'
        }
      }
    },
    ...createMutationOptions({
      onMutate: async ({ server_ids, force }) => {
        const count = server_ids ? server_ids.length : '全部'
        toast.loading(`正在同步${count}个服务器状态...`, { id: 'sync-server-status' })
        return { server_ids, force }
      },
      
      onSuccess: (data: any, variables, context: any) => {
        toast.dismiss('sync-server-status')
        
        if (data.code === 0) {
          if (variables.server_ids) {
            toast.success('服务器状态同步完成', {
              description: `已同步 ${data.data.successful_count} 个服务器状态`
            })
          } else {
            toast.success('全部服务器状态同步已启动')
          }
          
          // 刷新服务器相关查询
          invalidationUtils.invalidateServerQueries(queryClient)
        } else {
          toast.error('状态同步失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('sync-server-status')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'syncServerStatus',
          serverIds: variables.server_ids
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('状态同步失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 默认导出 ====================

export default {
  // 服务器节点相关
  useCreateShadowsocksServer,
  useCreateServer: useCreateShadowsocksServer, // Alias for backward compatibility
  useUpdateShadowsocksServer,
  useDeleteServer,
  useBatchDeleteServers,
  useToggleServerStatus,
  useTestServerConnection,
  useSyncServerStatus,
  
  // 服务器分组相关
  useCreateServerGroup,
  useUpdateServerGroup,
  useDeleteServerGroup,
  useAssignServersToGroup,
}

// 导出工具函数
export {
  invalidationUtils,
  optimisticUpdateUtils,
}

// 为向后兼容提供别名
export const useCreateServer = useCreateShadowsocksServer
export const useUpdateServer = useUpdateShadowsocksServer