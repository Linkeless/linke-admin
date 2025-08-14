'use client'

/**
 * 告警查询 Hooks
 * 
 * 基于 React Query 实现的告警数据查询钩子集合
 * 提供告警列表、告警统计等功能
 * 
 * 任务18实现：告警页面React Query迁移
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createQueryOptions, createMutationOptions, DataType } from '@/lib/cache-strategies'
import { reactQueryErrorUtils, errorUtils } from '@/lib/error-handler'
import { SubscriptionAlert, AlertStatistics } from '@/lib/subscription-types'

// ==================== 类型定义 ====================

/**
 * 告警查询参数
 */
export interface UseAlertsParams {
  status?: string
  severity?: string
  alert_type?: string
  limit?: number
  offset?: number
  enabled?: boolean
}

// ==================== 告警查询 Hooks ====================

/**
 * 获取告警列表和统计数据
 */
export const useAlerts = (params: UseAlertsParams = {}) => {
  const { enabled = true, ...queryParams } = params
  
  return useQuery({
    queryKey: ['alerts', 'list', queryParams],
    queryFn: async (): Promise<{ 
      items: SubscriptionAlert[]
      total: number
      statistics: AlertStatistics 
    }> => {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 模拟告警数据
      const mockAlerts: SubscriptionAlert[] = [
        {
          id: 1,
          user_id: 1001,
          subscription_id: 2001,
          alert_type: 'renewal_failed',
          severity: 'high',
          title: '用户订阅续费失败',
          message: '用户 john@example.com 的订阅续费失败，信用卡被拒绝',
          status: 'pending',
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T10:30:00Z',
          user: {
            id: 1001,
            email: 'john@example.com',
            username: 'john_doe',
            name: 'John Doe'
          },
          subscription: {
            id: 2001,
            uuid: 'sub_1234567890',
            status: 'past_due',
            subscription_plan: {
              name: '专业版月付'
            }
          }
        },
        {
          id: 2,
          user_id: 1002,
          subscription_id: 2002,
          alert_type: 'expiration_warning',
          severity: 'medium',
          title: '订阅即将过期',
          message: '用户 jane@example.com 的订阅将在3天后过期',
          status: 'pending',
          created_at: '2024-01-14T15:20:00Z',
          updated_at: '2024-01-14T15:20:00Z',
          user: {
            id: 1002,
            email: 'jane@example.com',
            username: 'jane_smith',
            name: 'Jane Smith'
          },
          subscription: {
            id: 2002,
            uuid: 'sub_2345678901',
            status: 'active',
            subscription_plan: {
              name: '基础版年付'
            }
          }
        },
        {
          id: 3,
          user_id: 1003,
          subscription_id: 2003,
          alert_type: 'traffic_limit',
          severity: 'critical',
          title: '流量使用超限',
          message: '用户 bob@example.com 已使用95%的月度流量配额',
          status: 'resolved',
          created_at: '2024-01-13T09:15:00Z',
          updated_at: '2024-01-13T12:45:00Z',
          resolved_at: '2024-01-13T12:45:00Z',
          user: {
            id: 1003,
            email: 'bob@example.com',
            username: 'bob_wilson',
            name: 'Bob Wilson'
          },
          subscription: {
            id: 2003,
            uuid: 'sub_3456789012',
            status: 'active',
            subscription_plan: {
              name: '企业版月付'
            }
          }
        },
        {
          id: 4,
          user_id: 1004,
          subscription_id: 2004,
          alert_type: 'payment_failed',
          severity: 'high',
          title: '支付失败',
          message: '用户 alice@company.com 的支付处理失败',
          status: 'pending',
          created_at: '2024-01-12T14:22:00Z',
          updated_at: '2024-01-12T14:22:00Z',
          user: {
            id: 1004,
            email: 'alice@company.com',
            username: 'alice_chen',
            name: 'Alice Chen'
          },
          subscription: {
            id: 2004,
            uuid: 'sub_4567890123',
            status: 'active',
            subscription_plan: {
              name: '企业版年付'
            }
          }
        },
        {
          id: 5,
          user_id: 1005,
          subscription_id: 2005,
          alert_type: 'usage_limit',
          severity: 'medium',
          title: '使用量异常',
          message: '用户 david@startup.com 的服务使用量异常增长',
          status: 'pending',
          created_at: '2024-01-11T11:45:00Z',
          updated_at: '2024-01-11T11:45:00Z',
          user: {
            id: 1005,
            email: 'david@startup.com',
            username: 'david_lee',
            name: 'David Lee'
          },
          subscription: {
            id: 2005,
            uuid: 'sub_5678901234',
            status: 'active',
            subscription_plan: {
              name: '专业版年付'
            }
          }
        }
      ]

      // 应用筛选
      let filteredAlerts = mockAlerts
      
      if (queryParams.status) {
        filteredAlerts = filteredAlerts.filter(alert => alert.status === queryParams.status)
      }
      
      if (queryParams.severity) {
        filteredAlerts = filteredAlerts.filter(alert => alert.severity === queryParams.severity)
      }
      
      if (queryParams.alert_type) {
        filteredAlerts = filteredAlerts.filter(alert => alert.alert_type === queryParams.alert_type)
      }

      // 分页
      const limit = queryParams.limit || 10
      const offset = queryParams.offset || 0
      const paginatedAlerts = filteredAlerts.slice(offset, offset + limit)

      // 模拟统计数据
      const mockStatistics: AlertStatistics = {
        total_alerts: 45,
        pending_alerts: 12,
        resolved_alerts: 30,
        critical_alerts: 3,
        high_priority_alerts: 8,
        by_type: {
          renewal_failed: 15,
          payment_failed: 8,
          expiration_warning: 12,
          traffic_limit: 7,
          usage_limit: 2,
          system_error: 1
        },
        by_severity: {
          low: 18,
          medium: 15,
          high: 9,
          critical: 3
        },
        recent_trend: [
          { date: '2024-01-10', count: 5 },
          { date: '2024-01-11', count: 8 },
          { date: '2024-01-12', count: 6 },
          { date: '2024-01-13', count: 10 },
          { date: '2024-01-14', count: 7 },
          { date: '2024-01-15', count: 9 }
        ]
      }

      return {
        items: paginatedAlerts,
        total: filteredAlerts.length,
        statistics: mockStatistics
      }
    },
    ...createQueryOptions(DataType.REALTIME, {
      enabled,
      staleTime: 30 * 1000, // 30秒数据有效期（告警需要实时性）
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'alerts',
          operation: 'alerts-list',
          params: queryParams
        })
      }
    })
  })
}

/**
 * 批量解决告警
 */
export const useBulkResolveAlerts = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ alertIds, note }: { alertIds: number[]; note?: string }) => {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return {
        code: 0,
        message: '批量解决告警成功',
        data: { resolved_count: alertIds.length }
      }
    },
    ...createMutationOptions({
      onMutate: async ({ alertIds, note }) => {
        // 取消相关查询
        await queryClient.cancelQueries({ queryKey: ['alerts', 'list'] })
        
        // 保存当前数据
        const previousData = queryClient.getQueriesData({ queryKey: ['alerts', 'list'] })
        
        // 乐观更新：将告警状态设置为已解决
        queryClient.setQueriesData(
          { queryKey: ['alerts', 'list'], exact: false },
          (oldData: any) => {
            if (!oldData?.items) return oldData
            
            return {
              ...oldData,
              items: oldData.items.map((alert: SubscriptionAlert) => 
                alertIds.includes(alert.id) 
                  ? { 
                      ...alert, 
                      status: 'resolved' as const, 
                      resolved_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    }
                  : alert
              ),
              statistics: {
                ...oldData.statistics,
                pending_alerts: Math.max(0, oldData.statistics.pending_alerts - alertIds.length),
                resolved_alerts: oldData.statistics.resolved_alerts + alertIds.length
              }
            }
          }
        )
        
        toast.loading(`正在解决 ${alertIds.length} 个告警...`, { id: 'bulk-resolve' })
        
        return { previousData }
      },
      
      onSuccess: (data, variables, context) => {
        toast.dismiss('bulk-resolve')
        
        if (data.code === 0) {
          toast.success('批量解决告警成功', {
            description: `成功解决 ${variables.alertIds.length} 个告警`
          })
          
          // 失效相关查询以获取最新数据
          queryClient.invalidateQueries({ queryKey: ['alerts'] })
        } else {
          toast.error('批量解决告警失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error, variables, context) => {
        toast.dismiss('bulk-resolve')
        
        // 回滚乐观更新
        if (context?.previousData) {
          context.previousData.forEach(([queryKey, data]: [any, any]) => {
            queryClient.setQueryData(queryKey, data)
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'bulkResolveAlerts',
          alertIds: variables.alertIds
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('批量解决告警失败', {
          description: userMessage
        })
      }
    })
  })
}

/**
 * 解决单个告警
 */
export const useResolveAlert = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ alertId, note }: { alertId: number; note?: string }) => {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      
      return {
        code: 0,
        message: '告警解决成功',
        data: { alert_id: alertId }
      }
    },
    ...createMutationOptions({
      onMutate: async ({ alertId }) => {
        toast.loading('正在解决告警...', { id: 'resolve-alert' })
        return { alertId }
      },
      
      onSuccess: (data, variables, context) => {
        toast.dismiss('resolve-alert')
        
        if (data.code === 0) {
          toast.success('告警解决成功')
          // 失效相关查询
          queryClient.invalidateQueries({ queryKey: ['alerts'] })
        } else {
          toast.error('告警解决失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error, variables, context) => {
        toast.dismiss('resolve-alert')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'resolveAlert',
          alertId: variables.alertId
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('告警解决失败', {
          description: userMessage
        })
      }
    })
  })
}

/**
 * 确认告警
 */
export const useAcknowledgeAlert = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ alertId, note }: { alertId: number; note?: string }) => {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      
      return {
        code: 0,
        message: '告警确认成功',
        data: { alert_id: alertId }
      }
    },
    ...createMutationOptions({
      onMutate: async ({ alertId }) => {
        toast.loading('正在确认告警...', { id: 'acknowledge-alert' })
        return { alertId }
      },
      
      onSuccess: (data, variables, context) => {
        toast.dismiss('acknowledge-alert')
        
        if (data.code === 0) {
          toast.success('告警确认成功')
          // 失效相关查询
          queryClient.invalidateQueries({ queryKey: ['alerts'] })
        } else {
          toast.error('告警确认失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error, variables, context) => {
        toast.dismiss('acknowledge-alert')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'acknowledgeAlert',
          alertId: variables.alertId
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('告警确认失败', {
          description: userMessage
        })
      }
    })
  })
}

/**
 * 抑制告警
 */
export const useSuppressAlert = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ alertId, note, duration }: { alertId: number; note?: string; duration?: number }) => {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      
      return {
        code: 0,
        message: '告警抑制成功',
        data: { alert_id: alertId, suppressed_until: duration ? new Date(Date.now() + duration * 60000).toISOString() : null }
      }
    },
    ...createMutationOptions({
      onMutate: async ({ alertId, duration }) => {
        const durationText = duration ? `${duration}分钟` : '永久'
        toast.loading(`正在抑制告警(${durationText})...`, { id: 'suppress-alert' })
        return { alertId, duration }
      },
      
      onSuccess: (data, variables, context) => {
        toast.dismiss('suppress-alert')
        
        if (data.code === 0) {
          const durationText = variables.duration ? `${variables.duration}分钟` : '永久'
          toast.success('告警抑制成功', {
            description: `告警已抑制${durationText}`
          })
          // 失效相关查询
          queryClient.invalidateQueries({ queryKey: ['alerts'] })
        } else {
          toast.error('告警抑制失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error, variables, context) => {
        toast.dismiss('suppress-alert')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'suppressAlert',
          alertId: variables.alertId
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('告警抑制失败', {
          description: userMessage
        })
      }
    })
  })
}

/**
 * 告警工具函数
 */
export const alertQueryUtils = {
  /**
   * 格式化告警严重程度
   */
  getSeverityConfig: (severity: string) => {
    const configs: Record<string, { color: string; text: string; variant: string }> = {
      low: { color: 'green', text: '低', variant: 'default' },
      medium: { color: 'yellow', text: '中', variant: 'outline' },
      high: { color: 'orange', text: '高', variant: 'destructive' },
      critical: { color: 'red', text: '紧急', variant: 'destructive' }
    }
    return configs[severity] || configs.medium
  },

  /**
   * 格式化告警类型
   */
  getTypeConfig: (type: string) => {
    const configs: Record<string, { text: string; color: string }> = {
      renewal_failed: { text: '续费失败', color: 'red' },
      payment_failed: { text: '支付失败', color: 'orange' },
      expiration_warning: { text: '即将过期', color: 'yellow' },
      traffic_limit: { text: '流量超限', color: 'blue' },
      usage_limit: { text: '使用超限', color: 'purple' },
      system_error: { text: '系统错误', color: 'red' }
    }
    return configs[type] || { text: type, color: 'gray' }
  },

  /**
   * 格式化日期
   */
  formatDate: (dateString: string): string => {
    return new Date(dateString).toLocaleString('zh-CN')
  }
}

// ==================== 默认导出 ====================

export default {
  useAlerts,
  useBulkResolveAlerts,
  useResolveAlert,
  alertQueryUtils
}