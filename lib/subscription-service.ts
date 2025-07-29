// 订阅管理API服务封装

import { api } from './api'
import type {
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
} from './subscription-types'

export class SubscriptionService {
  // 订阅计划相关API
  
  /**
   * 获取订阅计划列表
   */
  static async getPlans(filters: PlanFilters = {}): Promise<PaginatedResponse<SubscriptionPlan>> {
    const params = new URLSearchParams()
    
    if (filters.status) params.append('status', filters.status)
    if (filters.currency) params.append('currency', filters.currency)
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.offset) params.append('offset', filters.offset.toString())
    
    const response = await api.get<PaginatedResponse<SubscriptionPlan>>(`/admin/subscriptions/plans?${params.toString()}`)
    return response
  }

  /**
   * 创建订阅计划
   */
  static async createPlan(data: CreatePlanRequest): Promise<StandardResponse<SubscriptionPlan>> {
    const response = await api.post<StandardResponse<SubscriptionPlan>>('/admin/subscriptions/plans', data)
    return response
  }

  /**
   * 获取单个订阅计划详情
   */
  static async getPlan(id: number): Promise<StandardResponse<SubscriptionPlan>> {
    const response = await api.get<StandardResponse<SubscriptionPlan>>(`/admin/subscriptions/plans/${id}`)
    return response
  }

  /**
   * 更新订阅计划
   */
  static async updatePlan(id: number, data: UpdatePlanRequest): Promise<StandardResponse<SubscriptionPlan>> {
    const response = await api.put<StandardResponse<SubscriptionPlan>>(`/admin/subscriptions/plans/${id}`, data)
    return response
  }

  /**
   * 部分更新订阅计划
   */
  static async patchPlan(id: number, data: Partial<UpdatePlanRequest>): Promise<StandardResponse<SubscriptionPlan>> {
    const response = await api.patch<StandardResponse<SubscriptionPlan>>(`/admin/subscriptions/plans/${id}`, data)
    return response
  }

  /**
   * 删除订阅计划
   */
  static async deletePlan(id: number): Promise<StandardResponse<void>> {
    const response = await api.delete<StandardResponse<void>>(`/admin/subscriptions/plans/${id}`)
    return response
  }

  // 用户订阅相关API

  /**
   * 获取用户订阅列表
   */
  static async getUserSubscriptions(filters: SubscriptionFilters = {}): Promise<PaginatedResponse<UserSubscription>> {
    const params = new URLSearchParams()
    
    if (filters.user_id) params.append('user_id', filters.user_id.toString())
    if (filters.status) params.append('status', filters.status)
    if (filters.plan_id) params.append('plan_id', filters.plan_id.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.offset) params.append('offset', filters.offset.toString())
    
    const response = await api.get<PaginatedResponse<UserSubscription>>(`/admin/subscriptions/users?${params.toString()}`)
    return response
  }

  /**
   * 创建用户订阅
   */
  static async createUserSubscription(data: CreateSubscriptionRequest): Promise<StandardResponse<UserSubscription>> {
    const response = await api.post<StandardResponse<UserSubscription>>('/admin/subscriptions/users', data)
    return response
  }

  /**
   * 获取单个用户订阅详情
   */
  static async getUserSubscription(id: number): Promise<StandardResponse<UserSubscription>> {
    const response = await api.get<StandardResponse<UserSubscription>>(`/admin/subscriptions/users/${id}`)
    return response
  }

  /**
   * 更新用户订阅
   */
  static async updateUserSubscription(id: number, data: UpdateSubscriptionRequest): Promise<StandardResponse<UserSubscription>> {
    const response = await api.put<StandardResponse<UserSubscription>>(`/admin/subscriptions/users/${id}`, data)
    return response
  }

  /**
   * 部分更新用户订阅
   */
  static async patchUserSubscription(id: number, data: Partial<UpdateSubscriptionRequest>): Promise<StandardResponse<UserSubscription>> {
    const response = await api.patch<StandardResponse<UserSubscription>>(`/admin/subscriptions/users/${id}`, data)
    return response
  }

  /**
   * 删除用户订阅
   */
  static async deleteUserSubscription(id: number): Promise<StandardResponse<void>> {
    const response = await api.delete<StandardResponse<void>>(`/admin/subscriptions/users/${id}`)
    return response
  }

  /**
   * 续费用户订阅
   */
  static async renewUserSubscription(id: number): Promise<StandardResponse<UserSubscription>> {
    const response = await api.post<StandardResponse<UserSubscription>>(`/admin/subscriptions/users/${id}/renew`)
    return response
  }

  // 辅助方法

  /**
   * 切换计划状态
   */
  static async togglePlanStatus(id: number, status: 'active' | 'inactive'): Promise<StandardResponse<SubscriptionPlan>> {
    return this.patchPlan(id, { status })
  }

  /**
   * 取消用户订阅
   */
  static async cancelUserSubscription(id: number, reason?: string): Promise<StandardResponse<UserSubscription>> {
    return this.patchUserSubscription(id, { 
      status: 'cancelled',
      cancellation_reason: reason 
    })
  }

  /**
   * 恢复用户订阅
   */
  static async reactivateUserSubscription(id: number): Promise<StandardResponse<UserSubscription>> {
    return this.patchUserSubscription(id, { 
      status: 'active',
      cancellation_reason: undefined 
    })
  }

  /**
   * 设置自动续费
   */
  static async setAutoRenew(id: number, autoRenew: boolean): Promise<StandardResponse<UserSubscription>> {
    return this.patchUserSubscription(id, { auto_renew: autoRenew })
  }
}

// 导出默认实例
export const subscriptionService = SubscriptionService