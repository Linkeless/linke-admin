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
  // 订阅计划相关API (临时模拟数据 - 等待后端API实现)
  
  /**
   * 获取订阅计划列表
   * API: GET /admin/subscriptions/plans
   */
  static async getPlans(filters: PlanFilters = {}): Promise<PaginatedResponse<SubscriptionPlan>> {
    const queryParams = new URLSearchParams()
    
    if (filters.status) queryParams.append('status', filters.status)
    if (filters.currency) queryParams.append('currency', filters.currency)
    if (filters.visible !== undefined) queryParams.append('visible', filters.visible.toString())
    if (filters.popular !== undefined) queryParams.append('popular', filters.popular.toString())
    if (filters.limit) queryParams.append('limit', filters.limit.toString())
    if (filters.offset) queryParams.append('offset', filters.offset.toString())
    
    const queryString = queryParams.toString()
    const url = queryString ? `/admin/subscriptions/plans?${queryString}` : '/admin/subscriptions/plans'
    
    const response = await api.get<PaginatedResponse<SubscriptionPlan>>(url)
    return response
  }

  /**
   * 创建订阅计划
   * API: POST /admin/subscriptions/plans
   */
  static async createPlan(data: CreatePlanRequest): Promise<StandardResponse<SubscriptionPlan>> {
    const response = await api.post<StandardResponse<SubscriptionPlan>>('/admin/subscriptions/plans', data)
    return response
  }

  /**
   * 获取单个订阅计划详情
   * API: GET /admin/subscriptions/plans/{id}
   */
  static async getPlan(id: number): Promise<StandardResponse<SubscriptionPlan>> {
    const response = await api.get<StandardResponse<SubscriptionPlan>>(`/admin/subscriptions/plans/${id}`)
    return response
  }

  /**
   * 更新订阅计划
   * API: PUT /admin/subscriptions/plans/{id}
   */
  static async updatePlan(id: number, data: UpdatePlanRequest): Promise<StandardResponse<SubscriptionPlan>> {
    const response = await api.put<StandardResponse<SubscriptionPlan>>(`/admin/subscriptions/plans/${id}`, data)
    return response
  }

  /**
   * 部分更新订阅计划
   * API: PATCH /admin/subscriptions/plans/{id}
   */
  static async patchPlan(id: number, data: Partial<UpdatePlanRequest>): Promise<StandardResponse<SubscriptionPlan>> {
    const response = await api.patch<StandardResponse<SubscriptionPlan>>(`/admin/subscriptions/plans/${id}`, data)
    return response
  }

  /**
   * 删除订阅计划
   * API: DELETE /admin/subscriptions/plans/{id}
   */
  static async deletePlan(id: number): Promise<StandardResponse<void>> {
    const response = await api.delete<StandardResponse<void>>(`/admin/subscriptions/plans/${id}`)
    return response
  }

  // 用户订阅相关API (基于swagger.json实际端点)

  /**
   * 获取用户订阅列表
   * API: GET /admin/subscriptions/users
   */
  static async getUserSubscriptions(filters: SubscriptionFilters = {}): Promise<PaginatedResponse<UserSubscription>> {
    const queryParams = new URLSearchParams()
    
    if (filters.user_id) queryParams.append('user_id', filters.user_id.toString())
    if (filters.status) queryParams.append('status', filters.status)
    if (filters.limit) queryParams.append('limit', filters.limit.toString())
    if (filters.offset) queryParams.append('offset', filters.offset.toString())
    
    const queryString = queryParams.toString()
    const url = queryString ? `/admin/subscriptions/users?${queryString}` : '/admin/subscriptions/users'
    
    const response = await api.get<PaginatedResponse<UserSubscription>>(url)
    return response
  }

  /**
   * 创建订阅订单
   * API: POST /subscription/orders
   */
  static async createSubscriptionOrder(data: {
    user_id: number
    subscription_plan_id: number
    order_type: 'new' | 'renewal' | 'upgrade' | 'downgrade'
    payment_gateway: string
    payment_method: string
    coupon_code?: string
    return_url?: string
    use_default_payment?: boolean
    metadata?: string
  }): Promise<StandardResponse<any>> {
    const response = await api.post<StandardResponse<any>>('/subscription/orders', data)
    return response
  }

  /**
   * 快速购买订阅
   * API: POST /subscription/quick-purchase
   */
  static async quickPurchaseSubscription(data: {
    user_id: number
    plan_id: number
    payment_gateway: string
    payment_method: string
    coupon_code?: string
    return_url?: string
    use_default_payment?: boolean
    client_ip?: string
    metadata?: string
  }): Promise<StandardResponse<any>> {
    const response = await api.post<StandardResponse<any>>('/subscription/quick-purchase', data)
    return response
  }

  /**
   * 创建用户订阅 (直接管理员创建)
   * API: POST /admin/subscriptions/users
   */
  static async createUserSubscription(data: CreateSubscriptionRequest): Promise<StandardResponse<UserSubscription>> {
    const requestData = {
      user_id: data.user_id,
      subscription_plan_id: data.subscription_plan_id,
      reason: data.reason || '管理员创建订阅',
      notes: data.notes || undefined,
      start_date: data.start_date || undefined,
      use_trial: data.use_trial || false,
      skip_payment: data.skip_payment !== undefined ? data.skip_payment : true, // 管理员创建默认跳过支付
      send_notification: data.send_notification !== undefined ? data.send_notification : true,
      server_group_ids: data.server_group_ids || undefined,
      custom_traffic_limit: data.custom_traffic_limit || undefined,
      custom_traffic_reset_cycle: data.custom_traffic_reset_cycle || undefined,
      disable_traffic_limit: data.disable_traffic_limit || false
    }
    const response = await api.post<StandardResponse<UserSubscription>>('/admin/subscriptions/users', requestData)
    return response
  }

  /**
   * 获取单个用户订阅详情
   * API: GET /admin/subscriptions/users/{id}
   */
  static async getUserSubscription(id: number): Promise<StandardResponse<UserSubscription>> {
    const response = await api.get<StandardResponse<UserSubscription>>(`/admin/subscriptions/users/${id}`)
    return response
  }

  /**
   * 更新用户订阅
   * API: PUT /admin/subscriptions/users/{id}
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
   * 删除用户订阅 (API暂未提供此端点)
   * 注意: 根据swagger.json分析，没有DELETE /admin/subscriptions/users/{id}端点
   * 建议使用取消订阅功能替代
   */
  static async deleteUserSubscription(id: number): Promise<StandardResponse<void>> {
    throw new Error('删除用户订阅的API端点暂未提供，建议使用取消订阅功能')
  }

  /**
   * 续费用户订阅 (API暂未提供此端点)
   * 注意: 根据swagger.json分析，没有/renew端点，但有/extend端点可以延长订阅
   */
  static async renewUserSubscription(id: number): Promise<StandardResponse<UserSubscription>> {
    throw new Error('续费订阅的API端点暂未提供，建议使用延长订阅功能')
  }

  // 辅助方法

  /**
   * 切换计划状态
   * API: POST /admin/subscriptions/plans/{id}/toggle-status
   */
  static async togglePlanStatus(id: number): Promise<StandardResponse<SubscriptionPlan>> {
    const response = await api.post<StandardResponse<SubscriptionPlan>>(`/admin/subscriptions/plans/${id}/toggle-status`)
    return response
  }

  /**
   * 取消用户订阅
   * API: POST /admin/subscriptions/users/{id}/cancel
   */
  static async cancelUserSubscription(id: number, reason?: string, cancelAtPeriodEnd: boolean = false): Promise<StandardResponse<void>> {
    const payload = {
      cancel_at_period_end: cancelAtPeriodEnd,
      reason: reason || '管理员操作'
    }
    const response = await api.post<StandardResponse<void>>(`/admin/subscriptions/users/${id}/cancel`, payload)
    return response
  }

  /**
   * 恢复用户订阅
   * API: POST /admin/subscriptions/users/{id}/resume
   */
  static async reactivateUserSubscription(id: number): Promise<StandardResponse<UserSubscription>> {
    const payload = {
      adjust_billing_date: true
    }
    const response = await api.post<StandardResponse<UserSubscription>>(`/admin/subscriptions/users/${id}/resume`, payload)
    return response
  }

  /**
   * 设置自动续费
   */
  static async setAutoRenew(id: number, autoRenew: boolean): Promise<StandardResponse<UserSubscription>> {
    return this.patchUserSubscription(id, { auto_renew: autoRenew })
  }

  // 实际可用的API方法 (基于swagger.json)

  /**
   * 暂停用户订阅
   * API: POST /admin/subscriptions/users/{id}/pause
   */
  static async pauseSubscription(id: number, reason: string = '管理员暂停', maxPauseDuration?: number): Promise<StandardResponse<UserSubscription>> {
    const payload = {
      reason: reason,
      ...(maxPauseDuration && { max_pause_duration: maxPauseDuration })
    }
    const response = await api.post<StandardResponse<UserSubscription>>(`/admin/subscriptions/users/${id}/pause`, payload)
    return response
  }

  /**
   * 恢复用户订阅 (实际API)
   * API: POST /admin/subscriptions/users/{id}/resume
   */
  static async resumeSubscription(id: number, adjustBillingDate: boolean = true): Promise<StandardResponse<UserSubscription>> {
    const payload = {
      adjust_billing_date: adjustBillingDate
    }
    const response = await api.post<StandardResponse<UserSubscription>>(`/admin/subscriptions/users/${id}/resume`, payload)
    return response
  }

  /**
   * 取消用户订阅 (实际API)
   * API: POST /subscriptions/{id}/cancel
   */
  static async cancelSubscription(id: number, reason?: string): Promise<StandardResponse<UserSubscription>> {
    const payload = reason ? { reason } : {}
    const response = await api.post<StandardResponse<UserSubscription>>(`/subscriptions/${id}/cancel`, payload)
    return response
  }

  /**
   * 获取订阅流量统计 (实际API)
   * API: GET /subscriptions/{id}/traffic-stats
   */
  static async getSubscriptionTrafficStats(id: number): Promise<StandardResponse<any>> {
    const response = await api.get<StandardResponse<any>>(`/subscriptions/${id}/traffic-stats`)
    return response
  }

  /**
   * 获取当前用户的订阅 (实际API)
   * API: GET /subscriptions/my
   */
  static async getMySubscriptions(params?: { status?: string; limit?: number; offset?: number }): Promise<PaginatedResponse<UserSubscription>> {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    
    const queryString = queryParams.toString()
    const url = queryString ? `/subscriptions/my?${queryString}` : '/subscriptions/my'
    
    const response = await api.get<PaginatedResponse<UserSubscription>>(url)
    return response
  }

  /**
   * 获取当前用户的活跃订阅 (实际API)
   * API: GET /subscriptions/my/active
   */
  static async getMyActiveSubscriptions(): Promise<StandardResponse<UserSubscription[]>> {
    const response = await api.get<StandardResponse<UserSubscription[]>>('/subscriptions/my/active')
    return response
  }

  // 新的API方法 (基于swagger.json最新分析)

  /**
   * 延长用户订阅
   * API: POST /admin/subscriptions/users/{id}/extend
   */
  static async extendUserSubscription(id: number, extendByDays: number, reason: string, sendNotification: boolean = true): Promise<StandardResponse<UserSubscription>> {
    const payload = {
      extend_by_days: extendByDays,
      reason: reason,
      send_notification: sendNotification
    }
    const response = await api.post<StandardResponse<UserSubscription>>(`/admin/subscriptions/users/${id}/extend`, payload)
    return response
  }

  /**
   * 重置用户流量使用量
   * API: POST /admin/subscriptions/users/{id}/reset-traffic
   */
  static async resetUserTraffic(id: number, reason: string, sendNotification: boolean = true): Promise<StandardResponse<UserSubscription>> {
    const payload = {
      reason: reason,
      send_notification: sendNotification,
      usage_type: 'traffic'
    }
    const response = await api.post<StandardResponse<UserSubscription>>(`/admin/subscriptions/users/${id}/reset-traffic`, payload)
    return response
  }

  /**
   * 批量操作用户订阅
   * API: POST /admin/subscriptions/bulk/action
   */
  static async bulkSubscriptionAction(
    action: 'pause' | 'resume' | 'cancel' | 'extend' | 'reset_traffic',
    subscriptionIds: number[],
    options: {
      extendByDays?: number
      reason?: string
    } = {}
  ): Promise<StandardResponse<any>> {
    const payload = {
      action: action,
      subscription_ids: subscriptionIds,
      ...(options.extendByDays && { extend_by_days: options.extendByDays }),
      ...(options.reason && { reason: options.reason })
    }
    const response = await api.post<StandardResponse<any>>('/admin/subscriptions/bulk/action', payload)
    return response
  }
}

// 导出默认实例
export const subscriptionService = SubscriptionService