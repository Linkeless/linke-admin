'use client'

/**
 * 设置变更 Hooks
 * 
 * 基于 React Query 实现的设置数据变更钩子集合
 * 支持设置更新、配置变更等操作，包含乐观更新机制
 * 遵循统一的缓存策略和错误处理机制
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'
import { settingsService } from '@/lib/settings-service'
import { queryKeys, CacheInvalidationUtils } from '@/lib/query-keys'
import { createMutationOptions } from '@/lib/cache-strategies'
import { globalErrorHandler, reactQueryErrorUtils, errorUtils } from '@/lib/error-handler'
import {
  Setting,
  SystemSettings,
  AppearanceSettings,
  NotificationSettings,
  SecuritySettings,
  UserPreferences,
  UpdateSettingRequest,
  BatchUpdateSettingsRequest,
  UpdateSettingResponse,
  BatchUpdateResponse,
  ResetSettingsRequest,
  ImportSettingsRequest,
  SettingsPreset,
  ApplyPresetRequest
} from '@/lib/settings-types'
import { StandardResponse } from '@/lib/types'

// ==================== 类型定义 ====================

/**
 * 设置变更操作上下文
 */
interface SettingsMutationContext {
  operation: string
  settingKey?: string
  previousData?: any
  backupData?: any
}

/**
 * 批量更新结果增强
 */
interface EnhancedBatchUpdateResult {
  updated: string[]
  failed: { key: string; error: string }[]
  total: number
  successRate: number
  failureCount: number
}

// ==================== 工具函数 ====================

/**
 * 设置缓存失效工具函数
 */
const settingsInvalidationUtils = {
  /**
   * 失效设置相关的所有查询
   */
  invalidateSettingsQueries: async (queryClient: any, category?: string) => {
    // 失效所有设置查询
    await queryClient.invalidateQueries({ 
      queryKey: [...queryKeys.cache.all, 'settings'] 
    })
    
    // 如果指定了类别，还需要失效特定类别的查询
    if (category) {
      await queryClient.invalidateQueries({ 
        queryKey: [...queryKeys.cache.all, 'settings', category] 
      })
    }
  },

  /**
   * 失效用户偏好相关查询
   */
  invalidateUserPreferences: async (queryClient: any) => {
    await queryClient.invalidateQueries({ 
      queryKey: [...queryKeys.cache.all, 'settings', 'preferences'] 
    })
    await queryClient.invalidateQueries({ 
      queryKey: queryKeys.auth.profile() 
    })
  }
}

/**
 * 乐观更新工具函数
 */
const optimisticUpdateUtils = {
  /**
   * 乐观更新单个设置
   */
  optimisticallyUpdateSetting: (queryClient: any, key: string, newValue: any) => {
    // 更新设置列表中的项目
    queryClient.setQueriesData(
      { queryKey: [...queryKeys.cache.all, 'settings', 'list'], exact: false },
      (oldData: any) => {
        if (!oldData?.data?.data) return oldData
        
        return {
          ...oldData,
          data: {
            ...oldData.data,
            data: oldData.data.data.map((setting: Setting) => 
              setting.key === key 
                ? { 
                    ...setting, 
                    value: newValue,
                    updated_at: new Date().toISOString(),
                    hasCustomValue: !settingsService.isSettingValueEqual(
                      newValue, 
                      setting.default_value, 
                      setting.type
                    )
                  }
                : setting
            )
          }
        }
      }
    )

    // 更新设置详情
    queryClient.setQueryData(
      [...queryKeys.cache.all, 'settings', 'detail', key], 
      (oldData: any) => {
        if (!oldData?.data) return oldData
        
        return {
          ...oldData,
          data: {
            ...oldData.data,
            value: newValue,
            updated_at: new Date().toISOString(),
            hasCustomValue: !settingsService.isSettingValueEqual(
              newValue, 
              oldData.data.default_value, 
              oldData.data.type
            )
          }
        }
      }
    )
  },

  /**
   * 批量乐观更新设置
   */
  optimisticallyUpdateSettings: (queryClient: any, settings: Record<string, any>) => {
    queryClient.setQueriesData(
      { queryKey: [...queryKeys.cache.all, 'settings', 'list'], exact: false },
      (oldData: any) => {
        if (!oldData?.data?.data) return oldData
        
        return {
          ...oldData,
          data: {
            ...oldData.data,
            data: oldData.data.data.map((setting: Setting) => {
              if (settings[setting.key] !== undefined) {
                return {
                  ...setting,
                  value: settings[setting.key],
                  updated_at: new Date().toISOString(),
                  hasCustomValue: !settingsService.isSettingValueEqual(
                    settings[setting.key], 
                    setting.default_value, 
                    setting.type
                  )
                }
              }
              return setting
            })
          }
        }
      }
    )
  }
}

// ==================== 单个设置更新 Mutations ====================

/**
 * 更新单个设置
 */
export const useUpdateSetting = (options?: Partial<UseMutationOptions<UpdateSettingResponse, Error, { key: string; request: UpdateSettingRequest }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ key, request }: { key: string; request: UpdateSettingRequest }) => 
      settingsService.updateSetting(key, request),
    ...createMutationOptions({
      onMutate: async ({ key, request }: { key: string; request: UpdateSettingRequest }) => {
        // 取消相关查询
        await queryClient.cancelQueries({ queryKey: [...queryKeys.cache.all, 'settings'] })
        
        // 保存当前数据用于回滚
        const previousSettingData = queryClient.getQueryData([...queryKeys.cache.all, 'settings', 'detail', key])
        const previousListData = queryClient.getQueriesData({ queryKey: [...queryKeys.cache.all, 'settings', 'list'] })
        
        // 乐观更新
        optimisticUpdateUtils.optimisticallyUpdateSetting(queryClient, key, request.value)
        
        toast.loading(`正在更新设置 "${key}"...`, { id: 'update-setting' })
        
        return { 
          previousSettingData, 
          previousListData, 
          settingKey: key,
          operation: 'update-single'
        }
      },
      
      onSuccess: (data: UpdateSettingResponse, variables, context: any) => {
        toast.dismiss('update-setting')
        
        if (data.code === 0 && data.data) {
          toast.success('设置更新成功', {
            description: `设置 "${variables.key}" 已更新`
          })
          
          // 失效相关查询以获取最新数据
          settingsInvalidationUtils.invalidateSettingsQueries(queryClient, data.data.category)
          
          // 如果是用户偏好设置，还需要失效用户相关查询
          if (variables.key.startsWith('user_') || variables.key.includes('preference')) {
            settingsInvalidationUtils.invalidateUserPreferences(queryClient)
          }
        } else {
          toast.error('设置更新失败', {
            description: data.message || '更新设置时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('update-setting')
        
        // 回滚乐观更新
        if (context?.previousSettingData) {
          queryClient.setQueryData(
            [...queryKeys.cache.all, 'settings', 'detail', context.settingKey], 
            context.previousSettingData
          )
        }
        if (context?.previousListData) {
          context.previousListData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'updateSetting',
          settingKey: variables.key,
          value: variables.request.value
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('设置更新失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 批量设置更新 Mutations ====================

/**
 * 批量更新设置
 */
export const useBatchUpdateSettings = (options?: Partial<UseMutationOptions<BatchUpdateResponse, Error, BatchUpdateSettingsRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (request: BatchUpdateSettingsRequest) => settingsService.batchUpdateSettings(request),
    ...createMutationOptions({
      onMutate: async (request: BatchUpdateSettingsRequest) => {
        await queryClient.cancelQueries({ queryKey: [...queryKeys.cache.all, 'settings'] })
        
        // 保存当前数据
        const previousData = {
          listQueries: queryClient.getQueriesData({ queryKey: [...queryKeys.cache.all, 'settings', 'list'] }),
          detailQueries: Object.keys(request.settings).map(key => ({
            key,
            data: queryClient.getQueryData([...queryKeys.cache.all, 'settings', 'detail', key])
          }))
        }
        
        // 乐观更新
        optimisticUpdateUtils.optimisticallyUpdateSettings(queryClient, request.settings)
        
        const settingsCount = Object.keys(request.settings).length
        toast.loading(`正在批量更新 ${settingsCount} 个设置...`, { id: 'batch-update-settings' })
        
        return { 
          previousData, 
          settingsKeys: Object.keys(request.settings),
          operation: 'batch-update'
        }
      },
      
      onSuccess: (data: BatchUpdateResponse, variables, context: any) => {
        toast.dismiss('batch-update-settings')
        
        if (data.code === 0 && data.data) {
          const result: EnhancedBatchUpdateResult = {
            ...data.data,
            successRate: (data.data.updated.length / data.data.total) * 100,
            failureCount: data.data.failed.length
          }
          
          if (result.failureCount === 0) {
            toast.success('批量更新成功', {
              description: `成功更新 ${result.updated.length} 个设置`
            })
          } else {
            toast.warning('批量更新部分成功', {
              description: `成功更新 ${result.updated.length} 个设置，${result.failureCount} 个失败`
            })
          }
          
          // 失效相关查询
          settingsInvalidationUtils.invalidateSettingsQueries(queryClient)
        } else {
          toast.error('批量更新失败', {
            description: data.message || '批量更新设置时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('batch-update-settings')
        
        // 回滚乐观更新
        if (context?.previousData) {
          // 恢复列表数据
          context.previousData.listQueries.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
          
          // 恢复详情数据
          context.previousData.detailQueries.forEach(({ key, data }: any) => {
            if (data) {
              queryClient.setQueryData([...queryKeys.cache.all, 'settings', 'detail', key], data)
            }
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'batchUpdateSettings',
          settingsCount: Object.keys(variables.settings).length
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

// ==================== 分类设置更新 Mutations ====================

/**
 * 更新系统设置
 */
export const useUpdateSystemSettings = (options?: Partial<UseMutationOptions<StandardResponse<SystemSettings>, Error, Partial<SystemSettings>>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (settings: Partial<SystemSettings>) => settingsService.updateSystemSettings(settings),
    ...createMutationOptions({
      onMutate: async (settings: Partial<SystemSettings>) => {
        await queryClient.cancelQueries({ queryKey: [...queryKeys.cache.all, 'settings', 'system'] })
        
        const previousData = queryClient.getQueryData([...queryKeys.cache.all, 'settings', 'system'])
        
        // 乐观更新系统设置
        queryClient.setQueryData(
          [...queryKeys.cache.all, 'settings', 'system'],
          (oldData: any) => oldData ? {
            ...oldData,
            data: { ...oldData.data, ...settings }
          } : oldData
        )
        
        toast.loading('正在更新系统设置...', { id: 'update-system-settings' })
        
        return { previousData, operation: 'update-system' }
      },
      
      onSuccess: (data: StandardResponse<SystemSettings>, variables, context: any) => {
        toast.dismiss('update-system-settings')
        
        if (data.code === 0) {
          toast.success('系统设置更新成功', {
            description: '系统配置已生效'
          })
          
          settingsInvalidationUtils.invalidateSettingsQueries(queryClient, 'system')
        } else {
          toast.error('系统设置更新失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('update-system-settings')
        
        // 回滚数据
        if (context?.previousData) {
          queryClient.setQueryData([...queryKeys.cache.all, 'settings', 'system'], context.previousData)
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'updateSystemSettings',
          settingsCount: Object.keys(variables).length
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('系统设置更新失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 更新外观设置
 */
export const useUpdateAppearanceSettings = (options?: Partial<UseMutationOptions<StandardResponse<AppearanceSettings>, Error, Partial<AppearanceSettings>>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (settings: Partial<AppearanceSettings>) => settingsService.updateAppearanceSettings(settings),
    ...createMutationOptions({
      onMutate: async (settings: Partial<AppearanceSettings>) => {
        await queryClient.cancelQueries({ queryKey: [...queryKeys.cache.all, 'settings', 'appearance'] })
        
        const previousData = queryClient.getQueryData([...queryKeys.cache.all, 'settings', 'appearance'])
        
        // 乐观更新外观设置
        queryClient.setQueryData(
          [...queryKeys.cache.all, 'settings', 'appearance'],
          (oldData: any) => oldData ? {
            ...oldData,
            data: { ...oldData.data, ...settings }
          } : oldData
        )
        
        toast.loading('正在更新外观设置...', { id: 'update-appearance-settings' })
        
        return { previousData, operation: 'update-appearance' }
      },
      
      onSuccess: (data: StandardResponse<AppearanceSettings>, variables, context: any) => {
        toast.dismiss('update-appearance-settings')
        
        if (data.code === 0) {
          toast.success('外观设置更新成功', {
            description: '界面样式已应用'
          })
          
          settingsInvalidationUtils.invalidateSettingsQueries(queryClient, 'appearance')
          
          // 如果更新了主题，可能需要触发页面重新渲染
          if ('theme' in variables) {
            // 这里可以触发主题变更事件
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('themeChange', { 
                detail: { theme: variables.theme } 
              }))
            }
          }
        } else {
          toast.error('外观设置更新失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('update-appearance-settings')
        
        if (context?.previousData) {
          queryClient.setQueryData([...queryKeys.cache.all, 'settings', 'appearance'], context.previousData)
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'updateAppearanceSettings',
          settingsCount: Object.keys(variables).length
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('外观设置更新失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 更新通知设置
 */
export const useUpdateNotificationSettings = (options?: Partial<UseMutationOptions<StandardResponse<NotificationSettings>, Error, Partial<NotificationSettings>>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (settings: Partial<NotificationSettings>) => settingsService.updateNotificationSettings(settings),
    ...createMutationOptions({
      onMutate: async (settings: Partial<NotificationSettings>) => {
        await queryClient.cancelQueries({ queryKey: [...queryKeys.cache.all, 'settings', 'notifications'] })
        
        const previousData = queryClient.getQueryData([...queryKeys.cache.all, 'settings', 'notifications'])
        
        queryClient.setQueryData(
          [...queryKeys.cache.all, 'settings', 'notifications'],
          (oldData: any) => oldData ? {
            ...oldData,
            data: { ...oldData.data, ...settings }
          } : oldData
        )
        
        toast.loading('正在更新通知设置...', { id: 'update-notification-settings' })
        
        return { previousData, operation: 'update-notifications' }
      },
      
      onSuccess: (data: StandardResponse<NotificationSettings>, variables, context: any) => {
        toast.dismiss('update-notification-settings')
        
        if (data.code === 0) {
          toast.success('通知设置更新成功', {
            description: '通知配置已生效'
          })
          
          settingsInvalidationUtils.invalidateSettingsQueries(queryClient, 'notification')
        } else {
          toast.error('通知设置更新失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('update-notification-settings')
        
        if (context?.previousData) {
          queryClient.setQueryData([...queryKeys.cache.all, 'settings', 'notifications'], context.previousData)
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'updateNotificationSettings',
          settingsCount: Object.keys(variables).length
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('通知设置更新失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 更新用户偏好设置
 */
export const useUpdateUserPreferences = (options?: Partial<UseMutationOptions<StandardResponse<UserPreferences>, Error, Partial<UserPreferences>>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (preferences: Partial<UserPreferences>) => settingsService.updateUserPreferences(preferences),
    ...createMutationOptions({
      onMutate: async (preferences: Partial<UserPreferences>) => {
        await queryClient.cancelQueries({ queryKey: [...queryKeys.cache.all, 'settings', 'preferences'] })
        
        const previousData = queryClient.getQueryData([...queryKeys.cache.all, 'settings', 'preferences'])
        
        queryClient.setQueryData(
          [...queryKeys.cache.all, 'settings', 'preferences'],
          (oldData: any) => oldData ? {
            ...oldData,
            data: { ...oldData.data, ...preferences }
          } : oldData
        )
        
        toast.loading('正在更新用户偏好...', { id: 'update-user-preferences' })
        
        return { previousData, operation: 'update-preferences' }
      },
      
      onSuccess: (data: StandardResponse<UserPreferences>, variables, context: any) => {
        toast.dismiss('update-user-preferences')
        
        if (data.code === 0) {
          toast.success('用户偏好更新成功', {
            description: '个性化设置已保存'
          })
          
          settingsInvalidationUtils.invalidateUserPreferences(queryClient)
          
          // 如果更新了界面相关设置，触发相应事件
          const interfaceSettings = ['theme', 'language', 'sidebar_collapsed']
          if (interfaceSettings.some(key => key in variables)) {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('preferencesChange', { 
                detail: variables 
              }))
            }
          }
        } else {
          toast.error('用户偏好更新失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('update-user-preferences')
        
        if (context?.previousData) {
          queryClient.setQueryData([...queryKeys.cache.all, 'settings', 'preferences'], context.previousData)
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'updateUserPreferences',
          settingsCount: Object.keys(variables).length
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('用户偏好更新失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 设置管理 Mutations ====================

/**
 * 重置设置到默认值
 */
export const useResetSettings = (options?: Partial<UseMutationOptions<StandardResponse<{ reset_count: number }>, Error, ResetSettingsRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (request: ResetSettingsRequest) => settingsService.resetSettings(request),
    ...createMutationOptions({
      onMutate: async (request: ResetSettingsRequest) => {
        await queryClient.cancelQueries({ queryKey: [...queryKeys.cache.all, 'settings'] })
        
        // 保存当前数据用于回滚
        const previousData = {
          allSettings: queryClient.getQueriesData({ queryKey: [...queryKeys.cache.all, 'settings'] })
        }
        
        const targetText = request.category ? 
          `${settingsService.getCategoryDisplayName(request.category)}分类` :
          request.keys?.length ? `${request.keys.length} 个设置` : '所有设置'
        
        toast.loading(`正在重置${targetText}...`, { id: 'reset-settings' })
        
        return { previousData, operation: 'reset', request }
      },
      
      onSuccess: (data: StandardResponse<{ reset_count: number }>, variables, context: any) => {
        toast.dismiss('reset-settings')
        
        if (data.code === 0 && data.data) {
          const targetText = variables.category ? 
            `${settingsService.getCategoryDisplayName(variables.category)}分类` :
            variables.keys?.length ? `${variables.keys.length} 个设置` : '设置'
          
          toast.success('设置重置成功', {
            description: `${targetText}已重置为默认值，共重置 ${data.data.reset_count} 项`
          })
          
          // 失效所有设置查询
          settingsInvalidationUtils.invalidateSettingsQueries(queryClient)
        } else {
          toast.error('设置重置失败', {
            description: data.message || '重置设置时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('reset-settings')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'resetSettings',
          request: variables
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('设置重置失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 导入设置
 */
export const useImportSettings = (options?: Partial<UseMutationOptions<BatchUpdateResponse, Error, ImportSettingsRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (request: ImportSettingsRequest) => settingsService.importSettings(request),
    ...createMutationOptions({
      onMutate: async (request: ImportSettingsRequest) => {
        await queryClient.cancelQueries({ queryKey: [...queryKeys.cache.all, 'settings'] })
        
        const settingsCount = Object.keys(request.settings).length
        toast.loading(`正在导入 ${settingsCount} 个设置...`, { id: 'import-settings' })
        
        return { operation: 'import', settingsCount }
      },
      
      onSuccess: (data: BatchUpdateResponse, variables, context: any) => {
        toast.dismiss('import-settings')
        
        if (data.code === 0 && data.data) {
          if (data.data.failed.length === 0) {
            toast.success('设置导入成功', {
              description: `成功导入 ${data.data.updated.length} 个设置`
            })
          } else {
            toast.warning('设置导入部分成功', {
              description: `成功导入 ${data.data.updated.length} 个设置，${data.data.failed.length} 个失败`
            })
          }
          
          settingsInvalidationUtils.invalidateSettingsQueries(queryClient)
        } else {
          toast.error('设置导入失败', {
            description: data.message || '导入设置时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('import-settings')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'importSettings',
          settingsCount: Object.keys(variables.settings).length
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('设置导入失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 预设管理 Mutations ====================

/**
 * 创建设置预设
 */
export const useCreateSettingsPreset = (options?: Partial<UseMutationOptions<StandardResponse<SettingsPreset>, Error, Omit<SettingsPreset, 'id' | 'created_at'>>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (preset: Omit<SettingsPreset, 'id' | 'created_at'>) => settingsService.createSettingsPreset(preset),
    ...createMutationOptions({
      onMutate: async (preset) => {
        toast.loading('正在创建设置预设...', { id: 'create-preset' })
        return { operation: 'create-preset', presetName: preset.name }
      },
      
      onSuccess: (data: StandardResponse<SettingsPreset>, variables, context: any) => {
        toast.dismiss('create-preset')
        
        if (data.code === 0 && data.data) {
          toast.success('设置预设创建成功', {
            description: `预设 "${data.data.name}" 已创建`
          })
          
          // 失效预设列表查询
          queryClient.invalidateQueries({ 
            queryKey: [...queryKeys.cache.all, 'settings', 'presets'] 
          })
        } else {
          toast.error('设置预设创建失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('create-preset')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'createSettingsPreset',
          presetName: variables.name
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('设置预设创建失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 应用设置预设
 */
export const useApplySettingsPreset = (options?: Partial<UseMutationOptions<BatchUpdateResponse, Error, ApplyPresetRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (request: ApplyPresetRequest) => settingsService.applySettingsPreset(request),
    ...createMutationOptions({
      onMutate: async (request: ApplyPresetRequest) => {
        await queryClient.cancelQueries({ queryKey: [...queryKeys.cache.all, 'settings'] })
        
        // 保存当前数据用于回滚
        const previousData = {
          allSettings: queryClient.getQueriesData({ queryKey: [...queryKeys.cache.all, 'settings'] })
        }
        
        toast.loading('正在应用设置预设...', { id: 'apply-preset' })
        
        return { previousData, operation: 'apply-preset', presetId: request.preset_id }
      },
      
      onSuccess: (data: BatchUpdateResponse, variables, context: any) => {
        toast.dismiss('apply-preset')
        
        if (data.code === 0 && data.data) {
          if (data.data.failed.length === 0) {
            toast.success('预设应用成功', {
              description: `成功应用 ${data.data.updated.length} 个设置`
            })
          } else {
            toast.warning('预设应用部分成功', {
              description: `成功应用 ${data.data.updated.length} 个设置，${data.data.failed.length} 个失败`
            })
          }
          
          settingsInvalidationUtils.invalidateSettingsQueries(queryClient)
        } else {
          toast.error('预设应用失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('apply-preset')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'applySettingsPreset',
          presetId: variables.preset_id
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('预设应用失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 删除设置预设
 */
export const useDeleteSettingsPreset = (options?: Partial<UseMutationOptions<StandardResponse<void>, Error, string>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (presetId: string) => settingsService.deleteSettingsPreset(presetId),
    ...createMutationOptions({
      onMutate: async (presetId: string) => {
        toast.loading('正在删除设置预设...', { id: 'delete-preset' })
        return { operation: 'delete-preset', presetId }
      },
      
      onSuccess: (data: StandardResponse<void>, presetId, context: any) => {
        toast.dismiss('delete-preset')
        
        if (data.code === 0) {
          toast.success('设置预设删除成功', {
            description: '预设已从列表中移除'
          })
          
          queryClient.invalidateQueries({ 
            queryKey: [...queryKeys.cache.all, 'settings', 'presets'] 
          })
        } else {
          toast.error('设置预设删除失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, presetId, context: any) => {
        toast.dismiss('delete-preset')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'deleteSettingsPreset',
          presetId
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('设置预设删除失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 清除设置缓存
 */
export const useClearSettingsCache = (options?: Partial<UseMutationOptions<StandardResponse<{ success: boolean; message: string }>, Error, void>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => settingsService.clearSettingsCache(),
    ...createMutationOptions({
      onMutate: async () => {
        toast.loading('正在清除设置缓存...', { id: 'clear-settings-cache' })
        return { operation: 'clear-cache' }
      },
      
      onSuccess: (data: StandardResponse<{ success: boolean; message: string }>, variables, context: any) => {
        toast.dismiss('clear-settings-cache')
        
        if (data.code === 0 && data.data?.success) {
          toast.success('设置缓存清除成功', {
            description: '系统将重新加载最新设置'
          })
          
          // 失效所有设置查询
          settingsInvalidationUtils.invalidateSettingsQueries(queryClient)
        } else {
          toast.error('设置缓存清除失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('clear-settings-cache')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'clearSettingsCache'
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('设置缓存清除失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 导出 ====================

export default {
  // 单个设置更新
  useUpdateSetting,
  
  // 批量更新
  useBatchUpdateSettings,
  
  // 分类设置更新
  useUpdateSystemSettings,
  useUpdateAppearanceSettings,
  useUpdateNotificationSettings,
  useUpdateUserPreferences,
  
  // 设置管理
  useResetSettings,
  useImportSettings,
  useClearSettingsCache,
  
  // 预设管理
  useCreateSettingsPreset,
  useApplySettingsPreset,
  useDeleteSettingsPreset
}

// 导出工具函数
export {
  settingsInvalidationUtils,
  optimisticUpdateUtils
}