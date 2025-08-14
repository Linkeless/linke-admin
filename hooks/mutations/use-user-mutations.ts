'use client'

/**
 * 用户变更 Hooks
 * 
 * 基于 React Query 实现的用户数据变更钩子集合
 * 支持用户创建、更新、删除等操作，包含乐观更新机制
 * 遵循统���的缓存策略和错误处理机制
 * 
 * 任务10实现：FR-3 乐观更新机制
 * - 乐观更新用户列表
 * - 操作失败自动回滚
 * - 成功后刷新相关查询
 * - Toast消息提示
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'
import { userService } from '@/lib/user-service'
import { queryKeys, CacheInvalidationUtils } from '@/lib/query-keys'
import { createMutationOptions } from '@/lib/cache-strategies'
import { globalErrorHandler, reactQueryErrorUtils, errorUtils } from '@/lib/error-handler'
import {
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
  BatchUserOperationRequest,
  UserDetailResponse,
  BatchUserOperationResponse,
  UserListResponse
} from '@/lib/user-types'
import { StandardResponse } from '@/lib/types'

// ==================== 类型定义 ====================

/**
 * 用户变更操作上下文
 */
interface UserMutationContext {
  operation: string
  userId?: number
  userIds?: number[]
  previousData?: any
}

/**
 * 乐观更新用户数据
 */
interface OptimisticUserUpdate {
  id: number
  data: Partial<UserResponse>
  operation: 'create' | 'update' | 'delete' | 'restore'
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
   * 乐观更新用户列表 - 创建用户
   */
  optimisticallyAddUser: (queryClient: any, newUser: UserResponse) => {
    const queryKeys = ['users', 'list']
    
    queryClient.setQueriesData(
      { queryKey: queryKeys, exact: false },
      (oldData: UserListResponse | undefined) => {
        if (!oldData?.data?.items) return oldData
        
        return {
          ...oldData,
          data: {
            ...oldData.data,
            items: [newUser, ...oldData.data.items],
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
   * 乐观更新用户列表 - 更新用户
   */
  optimisticallyUpdateUser: (queryClient: any, userId: number, updatedData: Partial<UserResponse>) => {
    // 更新列表中的用户
    const listQueryKeys = ['users', 'list']
    queryClient.setQueriesData(
      { queryKey: listQueryKeys, exact: false },
      (oldData: UserListResponse | undefined) => {
        if (!oldData?.data?.items) return oldData
        
        return {
          ...oldData,
          data: {
            ...oldData.data,
            items: oldData.data.items.map(user => 
              user.id === userId 
                ? { ...user, ...updatedData, updated_at: new Date().toISOString() }
                : user
            )
          }
        }
      }
    )

    // 更新用户详情
    const detailQueryKey = queryKeys.users.detail(userId)
    queryClient.setQueryData(detailQueryKey, (oldData: UserDetailResponse | undefined) => {
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
   * 乐观更新用户列表 - 删除用户
   */
  optimisticallyRemoveUser: (queryClient: any, userId: number) => {
    const queryKeys = ['users', 'list']
    
    queryClient.setQueriesData(
      { queryKey: queryKeys, exact: false },
      (oldData: UserListResponse | undefined) => {
        if (!oldData?.data?.items) return oldData
        
        return {
          ...oldData,
          data: {
            ...oldData.data,
            items: oldData.data.items.filter(user => user.id !== userId),
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
   * 批量乐观更新用户状态
   */
  optimisticallyUpdateUsers: (queryClient: any, userIds: number[], updatedData: Partial<UserResponse>) => {
    const listQueryKeys = ['users', 'list']
    
    queryClient.setQueriesData(
      { queryKey: listQueryKeys, exact: false },
      (oldData: UserListResponse | undefined) => {
        if (!oldData?.data?.items) return oldData
        
        return {
          ...oldData,
          data: {
            ...oldData.data,
            items: oldData.data.items.map(user => 
              userIds.includes(user.id)
                ? { ...user, ...updatedData, updated_at: new Date().toISOString() }
                : user
            )
          }
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
   * 失效用户相关的所有查询
   */
  invalidateUserQueries: async (queryClient: any, userId?: number) => {
    // 失效用户模块的所有查询
    await queryClient.invalidateQueries({ 
      queryKey: CacheInvalidationUtils.getModulePrefix('users') 
    })
    
    // 失效相关模块的查询
    const relatedModules = CacheInvalidationUtils.getRelatedModules('users')
    for (const module of relatedModules) {
      await queryClient.invalidateQueries({ 
        queryKey: CacheInvalidationUtils.getModulePrefix(module) 
      })
    }
    
    // 如果有特定用户ID，失效该用户的详情
    if (userId) {
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.users.detail(userId) 
      })
    }
  },

  /**
   * 失效统计相关查询
   */
  invalidateStatsQueries: async (queryClient: any) => {
    await queryClient.invalidateQueries({ 
      queryKey: queryKeys.users.stats() 
    })
    await queryClient.invalidateQueries({ 
      queryKey: queryKeys.dashboard.all 
    })
  }
}

// ==================== 用户创建 Mutation ====================

/**
 * 创建用户
 */
export const useCreateUser = (options?: Partial<UseMutationOptions<UserDetailResponse, Error, CreateUserRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (userData: CreateUserRequest) => userService.createUser(userData),
    ...createMutationOptions({
      onMutate: async (userData: CreateUserRequest) => {
        // 取消正在进行的用户列表查询
        await queryClient.cancelQueries({ queryKey: queryKeys.users.lists() })
        
        // 保存当前数据用于回滚
        const previousData = queryClient.getQueriesData({ queryKey: queryKeys.users.lists() })
        
        // 乐观更新：创建临时用户对象
        const optimisticUser: UserResponse = {
          id: Date.now(), // 临时ID
          email: userData.email,
          name: userData.name || '',
          username: userData.username || '',
          role: userData.role || 'user',
          status: userData.status || 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        // 应用乐观更新
        optimisticUpdateUtils.optimisticallyAddUser(queryClient, optimisticUser)
        
        // 显示操作中的提示
        toast.loading('正在创建用户...', { id: 'create-user' })
        
        return { previousData, optimisticUser }
      },
      
      onSuccess: (data: UserDetailResponse, variables: CreateUserRequest, context: any) => {
        // 操作成功
        toast.dismiss('create-user')
        
        if (data.code === 0) {
          toast.success('用户创建成功', {
            description: `用户 ${data.data.email} 已成功创建`
          })
          
          // 失效相关查询以获取最新数据
          invalidationUtils.invalidateUserQueries(queryClient)
          invalidationUtils.invalidateStatsQueries(queryClient)
        } else {
          toast.error('用户创建失败', {
            description: data.message || '创建用户时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables: CreateUserRequest, context: any) => {
        // 操作失败，回滚乐观更新
        toast.dismiss('create-user')
        
        if (context?.previousData) {
          // 恢复之前的数据
          context.previousData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        // 处理错误并显示用户友好的消息
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'createUser',
          userData: variables
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('用户创建失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 用户更新 Mutation ====================

/**
 * 更新用户信息
 */
export const useUpdateUser = (options?: Partial<UseMutationOptions<UserDetailResponse, Error, { id: number; data: UpdateUserRequest }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserRequest }) => 
      userService.updateUser(id, data),
    ...createMutationOptions({
      onMutate: async ({ id, data }: { id: number; data: UpdateUserRequest }) => {
        // 取消相关查询
        await queryClient.cancelQueries({ queryKey: queryKeys.users.detail(id) })
        await queryClient.cancelQueries({ queryKey: queryKeys.users.lists() })
        
        // 保存当前数据
        const previousUserData = queryClient.getQueryData(queryKeys.users.detail(id))
        const previousListData = queryClient.getQueriesData({ queryKey: queryKeys.users.lists() })
        
        // 乐观更新
        optimisticUpdateUtils.optimisticallyUpdateUser(queryClient, id, data)
        
        toast.loading('正在更新用户...', { id: 'update-user' })
        
        return { previousUserData, previousListData, userId: id }
      },
      
      onSuccess: (data: UserDetailResponse, variables, context: any) => {
        toast.dismiss('update-user')
        
        if (data.code === 0) {
          toast.success('用户更新成功', {
            description: `用户信息已成功更新`
          })
          
          // 失效相关查询
          invalidationUtils.invalidateUserQueries(queryClient, variables.id)
        } else {
          toast.error('用户更新失败', {
            description: data.message || '更新用户时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('update-user')
        
        // 回滚乐观更新
        if (context?.previousUserData) {
          queryClient.setQueryData(queryKeys.users.detail(context.userId), context.previousUserData)
        }
        if (context?.previousListData) {
          context.previousListData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'updateUser',
          userId: variables.id,
          userData: variables.data
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('用户更新失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 用户删除 Mutation ====================

/**
 * 删除用户（软删除）
 */
export const useDeleteUser = (options?: Partial<UseMutationOptions<StandardResponse, Error, number>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (userId: number) => userService.deleteUser(userId),
    ...createMutationOptions({
      onMutate: async (userId: number) => {
        // 取消相关查询
        await queryClient.cancelQueries({ queryKey: queryKeys.users.lists() })
        await queryClient.cancelQueries({ queryKey: queryKeys.users.detail(userId) })
        
        // 保存当前数据
        const previousUserData = queryClient.getQueryData(queryKeys.users.detail(userId))
        const previousListData = queryClient.getQueriesData({ queryKey: queryKeys.users.lists() })
        
        // 乐观更新：从列表中移除用户
        optimisticUpdateUtils.optimisticallyRemoveUser(queryClient, userId)
        
        toast.loading('正在删除用户...', { id: 'delete-user' })
        
        return { previousUserData, previousListData, userId }
      },
      
      onSuccess: (data: StandardResponse, userId: number, context: any) => {
        toast.dismiss('delete-user')
        
        if (data.code === 0) {
          toast.success('用户删除成功', {
            description: '用户已被移动到回收站'
          })
          
          // 失效相关查询
          invalidationUtils.invalidateUserQueries(queryClient, userId)
          invalidationUtils.invalidateStatsQueries(queryClient)
        } else {
          toast.error('用户删除失败', {
            description: data.message || '删除用户时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, userId: number, context: any) => {
        toast.dismiss('delete-user')
        
        // 回滚乐观更新
        if (context?.previousUserData) {
          queryClient.setQueryData(queryKeys.users.detail(userId), context.previousUserData)
        }
        if (context?.previousListData) {
          context.previousListData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'deleteUser',
          userId
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('用户删除失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 用户恢复 Mutation ====================

/**
 * 恢复已删除的用户
 */
export const useRestoreUser = (options?: Partial<UseMutationOptions<StandardResponse, Error, number>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (userId: number) => userService.restoreUser(userId),
    ...createMutationOptions({
      onMutate: async (userId: number) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.users.lists() })
        
        const previousData = queryClient.getQueriesData({ queryKey: queryKeys.users.lists() })
        
        toast.loading('正在恢复用户...', { id: 'restore-user' })
        
        return { previousData, userId }
      },
      
      onSuccess: (data: StandardResponse, userId: number, context: any) => {
        toast.dismiss('restore-user')
        
        if (data.code === 0) {
          toast.success('用户恢复成功', {
            description: '用户已成功恢复'
          })
          
          invalidationUtils.invalidateUserQueries(queryClient, userId)
          invalidationUtils.invalidateStatsQueries(queryClient)
        } else {
          toast.error('用户恢复失败', {
            description: data.message || '恢复用户时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, userId: number, context: any) => {
        toast.dismiss('restore-user')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'restoreUser',
          userId
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('用户恢复失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 批量操作 Mutations ====================

/**
 * 批量删除用户
 */
export const useBatchDeleteUsers = (options?: Partial<UseMutationOptions<BatchUserOperationResponse, Error, number[]>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (userIds: number[]) => 
      userService.batchDeleteUsers({ user_ids: userIds }),
    ...createMutationOptions({
      onMutate: async (userIds: number[]) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.users.lists() })
        
        const previousData = queryClient.getQueriesData({ queryKey: queryKeys.users.lists() })
        
        // 乐观更新：从列表中移除选中的用户
        userIds.forEach(userId => {
          optimisticUpdateUtils.optimisticallyRemoveUser(queryClient, userId)
        })
        
        toast.loading(`正在批量删除 ${userIds.length} 个用户...`, { id: 'batch-delete' })
        
        return { previousData, userIds }
      },
      
      onSuccess: (data: BatchUserOperationResponse, userIds: number[], context: any) => {
        toast.dismiss('batch-delete')
        
        if (data.code === 0) {
          const { success_count, failed_count } = data.data
          
          if (failed_count === 0) {
            toast.success('批量删除成功', {
              description: `成功删除 ${success_count} 个用户`
            })
          } else {
            toast.warning('批量删除部分成功', {
              description: `成功删除 ${success_count} 个用户，${failed_count} 个用户删除失败`
            })
          }
          
          invalidationUtils.invalidateUserQueries(queryClient)
          invalidationUtils.invalidateStatsQueries(queryClient)
        } else {
          toast.error('批量删除失败', {
            description: data.message || '批量删除用户时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, userIds: number[], context: any) => {
        toast.dismiss('batch-delete')
        
        // 回滚乐观更新
        if (context?.previousData) {
          context.previousData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'batchDeleteUsers',
          userIds
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
 * 批量恢复用户
 */
export const useBatchRestoreUsers = (options?: Partial<UseMutationOptions<BatchUserOperationResponse, Error, number[]>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (userIds: number[]) => 
      userService.batchRestoreUsers({ user_ids: userIds }),
    ...createMutationOptions({
      onMutate: async (userIds: number[]) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.users.lists() })
        
        const previousData = queryClient.getQueriesData({ queryKey: queryKeys.users.lists() })
        
        toast.loading(`正在批量恢复 ${userIds.length} 个用户...`, { id: 'batch-restore' })
        
        return { previousData, userIds }
      },
      
      onSuccess: (data: BatchUserOperationResponse, userIds: number[], context: any) => {
        toast.dismiss('batch-restore')
        
        if (data.code === 0) {
          const { success_count, failed_count } = data.data
          
          if (failed_count === 0) {
            toast.success('批量恢复成功', {
              description: `成功恢复 ${success_count} 个用户`
            })
          } else {
            toast.warning('批量恢复部分成功', {
              description: `成功恢复 ${success_count} 个用户，${failed_count} 个用户恢复失败`
            })
          }
          
          invalidationUtils.invalidateUserQueries(queryClient)
          invalidationUtils.invalidateStatsQueries(queryClient)
        } else {
          toast.error('批量恢复失败', {
            description: data.message || '批量恢复用户时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, userIds: number[], context: any) => {
        toast.dismiss('batch-restore')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'batchRestoreUsers',
          userIds
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('批量恢复失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 专用更新 Mutations ====================

/**
 * 更新用户角色
 */
export const useUpdateUserRole = (options?: Partial<UseMutationOptions<StandardResponse, Error, { id: number; role: string }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => 
      userService.updateUserRole(id, role),
    ...createMutationOptions({
      onMutate: async ({ id, role }) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.users.detail(id) })
        await queryClient.cancelQueries({ queryKey: queryKeys.users.lists() })
        
        const previousUserData = queryClient.getQueryData(queryKeys.users.detail(id))
        const previousListData = queryClient.getQueriesData({ queryKey: queryKeys.users.lists() })
        
        // 乐观更新角色
        optimisticUpdateUtils.optimisticallyUpdateUser(queryClient, id, { role: role as any })
        
        toast.loading('正在更新用户角色...', { id: 'update-role' })
        
        return { previousUserData, previousListData, userId: id }
      },
      
      onSuccess: (data: StandardResponse, variables, context: any) => {
        toast.dismiss('update-role')
        
        if (data.code === 0) {
          toast.success('用户角色更新成功')
          invalidationUtils.invalidateUserQueries(queryClient, variables.id)
        } else {
          toast.error('用户角色更新失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('update-role')
        
        // 回滚更新
        if (context?.previousUserData) {
          queryClient.setQueryData(queryKeys.users.detail(context.userId), context.previousUserData)
        }
        if (context?.previousListData) {
          context.previousListData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'updateUserRole',
          userId: variables.id,
          role: variables.role
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('用户角色更新失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 更新用户状态
 */
export const useUpdateUserStatus = (options?: Partial<UseMutationOptions<StandardResponse, Error, { id: number; status: string }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      userService.updateUserStatus(id, status),
    ...createMutationOptions({
      onMutate: async ({ id, status }) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.users.detail(id) })
        await queryClient.cancelQueries({ queryKey: queryKeys.users.lists() })
        
        const previousUserData = queryClient.getQueryData(queryKeys.users.detail(id))
        const previousListData = queryClient.getQueriesData({ queryKey: queryKeys.users.lists() })
        
        // 乐观更新状态
        optimisticUpdateUtils.optimisticallyUpdateUser(queryClient, id, { status: status as any })
        
        toast.loading('正在更新用户状态...', { id: 'update-status' })
        
        return { previousUserData, previousListData, userId: id }
      },
      
      onSuccess: (data: StandardResponse, variables, context: any) => {
        toast.dismiss('update-status')
        
        if (data.code === 0) {
          toast.success('用户状态更新成功')
          invalidationUtils.invalidateUserQueries(queryClient, variables.id)
        } else {
          toast.error('用户状态更新失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('update-status')
        
        // 回滚更新
        if (context?.previousUserData) {
          queryClient.setQueryData(queryKeys.users.detail(context.userId), context.previousUserData)
        }
        if (context?.previousListData) {
          context.previousListData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'updateUserStatus',
          userId: variables.id,
          status: variables.status
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('用户状态更新失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 重置用户密码
 */
export const useResetUserPassword = (options?: Partial<UseMutationOptions<StandardResponse, Error, { id: number; newPassword: string }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: number; newPassword: string }) => 
      userService.resetUserPassword(id, newPassword),
    ...createMutationOptions({
      onMutate: async ({ id }) => {
        toast.loading('正在重置用户密码...', { id: 'reset-password' })
        return { userId: id }
      },
      
      onSuccess: (data: StandardResponse, variables, context: any) => {
        toast.dismiss('reset-password')
        
        if (data.code === 0) {
          toast.success('用户密码重置成功', {
            description: '新密码已生效'
          })
        } else {
          toast.error('用户密码重置失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('reset-password')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'resetUserPassword',
          userId: variables.id
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('用户密码重置失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 导出 ====================

export default {
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useRestoreUser,
  useBatchDeleteUsers,
  useBatchRestoreUsers,
  useUpdateUserRole,
  useUpdateUserStatus,
  useResetUserPassword,
}

// 导出工具函数
export {
  optimisticUpdateUtils,
  invalidationUtils,
}