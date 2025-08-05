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
   * 获取订阅计划列表 (模拟数据)
   * TODO: 等待后端实现 /admin/subscription-plans API
   */
  static async getPlans(filters: PlanFilters = {}): Promise<PaginatedResponse<SubscriptionPlan>> {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟订阅计划数据 (匹配实际类型定义)
    const mockPlans: SubscriptionPlan[] = [
      {
        id: 1,
        name: '基础套餐',
        code: 'basic_plan',
        description: '适合个人用户的基础订阅套餐',
        price: 9.99,
        currency: 'USD',
        billing_cycle: 'monthly',
        billing_interval: 1,
        trial_period_days: 7,
        status: 'active',
        is_visible: true,
        sort_order: 1,
        is_popular: false,
        is_recommended: true,
        setup_fee: 0,
        cancellation_fee: 0,
        traffic_limit: 100 * 1024 * 1024 * 1024, // 100GB in bytes
        traffic_limit_gb: 100,
        traffic_limit_text: '100GB/月',
        traffic_reset_cycle: 'monthly',
        features: JSON.stringify(['基础流量', '3台设备', '7天试用']),
        limits: JSON.stringify({ device_limit: 3, concurrent_connections: 5 }),
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        name: '专业套餐',
        code: 'pro_plan',
        description: '适合专业用户的高级订阅套餐',
        price: 19.99,
        currency: 'USD',
        billing_cycle: 'monthly',
        billing_interval: 1,
        trial_period_days: 14,
        status: 'active',
        is_visible: true,
        sort_order: 2,
        is_popular: true,
        is_recommended: true,
        setup_fee: 0,
        cancellation_fee: 0,
        traffic_limit: 500 * 1024 * 1024 * 1024, // 500GB in bytes
        traffic_limit_gb: 500,
        traffic_limit_text: '500GB/月',
        traffic_reset_cycle: 'monthly',
        features: JSON.stringify(['大流量', '10台设备', '14天试用', '优先支持']),
        limits: JSON.stringify({ device_limit: 10, concurrent_connections: 20 }),
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T10:30:00Z'
      },
      {
        id: 3,
        name: '企业套餐',
        code: 'enterprise_plan',
        description: '适合企业用户的无限制订阅套餐',
        price: 49.99,
        currency: 'USD',
        billing_cycle: 'monthly',
        billing_interval: 1,
        trial_period_days: 30,
        status: 'active',
        is_visible: true,
        sort_order: 3,
        is_popular: false,
        is_recommended: false,
        setup_fee: 0,
        cancellation_fee: 0,
        traffic_limit: -1, // 无限制
        traffic_limit_gb: -1,
        traffic_limit_text: '无限流量',
        traffic_reset_cycle: 'monthly',
        features: JSON.stringify(['无限流量', '无限设备', '30天试用', '24/7技术支持', '专属客服']),
        limits: JSON.stringify({ device_limit: -1, concurrent_connections: -1 }),
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T10:30:00Z'
      }
    ]
    
    // 应用过滤器
    let filteredPlans = mockPlans
    if (filters.status) {
      filteredPlans = filteredPlans.filter(plan => plan.status === filters.status)
    }
    if (filters.currency) {
      filteredPlans = filteredPlans.filter(plan => plan.currency === filters.currency)
    }
    
    // 应用分页
    const offset = filters.offset || 0
    const limit = filters.limit || 10
    const paginatedPlans = filteredPlans.slice(offset, offset + limit)
    
    return {
      code: 0,
      message: 'success',
      data: paginatedPlans,
      total: filteredPlans.length,
      limit: limit,
      offset: offset
    }
  }

  /**
   * 创建订阅计划 (模拟数据)
   * TODO: 等待后端实现创建计划API
   */
  static async createPlan(data: CreatePlanRequest): Promise<StandardResponse<SubscriptionPlan>> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const newPlan: SubscriptionPlan = {
      id: Date.now(), // 模拟生成ID
      name: data.name,
      description: data.description,
      price: data.price,
      currency: data.currency || 'USD',
      duration_days: data.duration_days,
      data_limit_gb: data.data_limit_gb,
      device_limit: data.device_limit,
      trial_days: data.trial_days || 0,
      status: 'active',
      features: data.features || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    return {
      code: 0,
      message: '订阅计划创建成功',
      data: newPlan
    }
  }

  /**
   * 获取单个订阅计划详情 (模拟数据)
   * TODO: 等待后端实现获取计划详情API
   */
  static async getPlan(id: number): Promise<StandardResponse<SubscriptionPlan>> {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // 模拟查找计划
    const mockPlan: SubscriptionPlan = {
      id: id,
      name: '基础套餐',
      description: '适合个人用户的基础订阅套餐',
      price: 9.99,
      currency: 'USD',
      duration_days: 30,
      data_limit_gb: 100,
      device_limit: 3,
      trial_days: 7,
      status: 'active',
      features: ['基础流量', '3台设备', '7天试用'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T10:30:00Z'
    }
    
    return {
      code: 0,
      message: 'success',
      data: mockPlan
    }
  }

  /**
   * 更新订阅计划 (模拟数据)
   * TODO: 等待后端实现更新计划API
   */
  static async updatePlan(id: number, data: UpdatePlanRequest): Promise<StandardResponse<SubscriptionPlan>> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const updatedPlan: SubscriptionPlan = {
      id: id,
      name: data.name || '更新的计划',
      description: data.description || '更新的描述',
      price: data.price || 9.99,
      currency: data.currency || 'USD',
      duration_days: data.duration_days || 30,
      data_limit_gb: data.data_limit_gb || 100,
      device_limit: data.device_limit || 3,
      trial_days: data.trial_days || 0,
      status: data.status || 'active',
      features: data.features || [],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: new Date().toISOString()
    }
    
    return {
      code: 0,
      message: '订阅计划更新成功',
      data: updatedPlan
    }
  }

  /**
   * 部分更新订阅计划 (模拟数据)
   * TODO: 等待后端实现部分更新计划API
   */
  static async patchPlan(id: number, data: Partial<UpdatePlanRequest>): Promise<StandardResponse<SubscriptionPlan>> {
    return this.updatePlan(id, data as UpdatePlanRequest)
  }

  /**
   * 删除订阅计划 (模拟数据)
   * TODO: 等待后端实现删除计划API
   */
  static async deletePlan(id: number): Promise<StandardResponse<void>> {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    return {
      code: 0,
      message: '订阅计划删除成功'
    }
  }

  // 用户订阅相关API (基于swagger.json实际端点)

  /**
   * 获取用户订阅列表 (模拟数据 - 实际API不支持管理端批量获取)
   * 实际API: /subscriptions/my (只能获取当前用户的订阅)
   * TODO: 等待后端实现 /admin/subscriptions 管理端点
   */
  static async getUserSubscriptions(filters: SubscriptionFilters = {}): Promise<PaginatedResponse<UserSubscription>> {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟用户订阅数据 (匹配实际类型定义)
    const mockSubscriptions: UserSubscription[] = [
      {
        id: 1,
        user_id: 1001,
        subscription_plan_id: 1,
        uuid: 'sub_001_' + Date.now(),
        status: 'active',
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-31T23:59:59Z',
        current_period_start: '2024-01-01T00:00:00Z',
        current_period_end: '2024-01-31T23:59:59Z',
        next_billing_date: '2024-02-01T00:00:00Z',
        price: 9.99,
        currency: 'USD',
        billing_cycle: 'monthly',
        billing_interval: 1,
        auto_renew: true,
        cancel_at_period_end: false,
        trial_ends_at: '2024-01-08T00:00:00Z',
        usage_reset_date: '2024-02-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        user_id: 1002,
        subscription_plan_id: 2,
        uuid: 'sub_002_' + Date.now(),
        status: 'active',
        start_date: '2024-01-05T00:00:00Z',
        end_date: '2024-02-05T23:59:59Z',
        current_period_start: '2024-01-05T00:00:00Z',
        current_period_end: '2024-02-05T23:59:59Z',
        next_billing_date: '2024-02-05T00:00:00Z',
        price: 19.99,
        currency: 'USD',
        billing_cycle: 'monthly',
        billing_interval: 1,
        auto_renew: false,
        cancel_at_period_end: true,
        usage_reset_date: '2024-02-05T00:00:00Z',
        created_at: '2024-01-05T00:00:00Z',
        updated_at: '2024-01-05T00:00:00Z'
      },
      {
        id: 3,
        user_id: 1003,
        subscription_plan_id: 3,
        uuid: 'sub_003_' + Date.now(),
        status: 'cancelled',
        start_date: '2024-01-10T00:00:00Z',
        end_date: '2024-01-20T23:59:59Z',
        current_period_start: '2024-01-10T00:00:00Z',
        current_period_end: '2024-01-20T23:59:59Z',
        price: 49.99,
        currency: 'USD',
        billing_cycle: 'monthly',
        billing_interval: 1,
        auto_renew: false,
        cancel_at_period_end: true,
        cancelled_at: '2024-01-20T15:45:00Z',
        cancellation_reason: '用户主动取消',
        usage_reset_date: '2024-02-10T00:00:00Z',
        created_at: '2024-01-10T00:00:00Z',
        updated_at: '2024-01-20T15:45:00Z'
      }
    ]
    
    // 应用过滤器
    let filteredSubscriptions = mockSubscriptions
    if (filters.user_id) {
      filteredSubscriptions = filteredSubscriptions.filter(sub => sub.user_id === filters.user_id)
    }
    if (filters.status) {
      filteredSubscriptions = filteredSubscriptions.filter(sub => sub.status === filters.status)
    }
    if (filters.plan_id) {
      filteredSubscriptions = filteredSubscriptions.filter(sub => sub.plan_id === filters.plan_id)
    }
    
    // 应用分页
    const offset = filters.offset || 0
    const limit = filters.limit || 10
    const paginatedSubscriptions = filteredSubscriptions.slice(offset, offset + limit)
    
    return {
      code: 0,
      message: 'success',
      data: paginatedSubscriptions,
      total: filteredSubscriptions.length,
      limit: limit,
      offset: offset
    }
  }

  /**
   * 创建用户订阅
   */
  static async createUserSubscription(data: CreateSubscriptionRequest): Promise<StandardResponse<UserSubscription>> {
    const response = await api.post<StandardResponse<UserSubscription>>('/admin/subscriptions/users', data)
    return response
  }

  /**
   * 获取单个用户订阅详情 (使用实际API)
   * 实际API: /subscriptions/{id}
   */
  static async getUserSubscription(id: number): Promise<StandardResponse<UserSubscription>> {
    const response = await api.get<StandardResponse<UserSubscription>>(`/subscriptions/${id}`)
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

  // 实际可用的API方法 (基于swagger.json)

  /**
   * 暂停用户订阅 (实际API)
   * API: POST /admin/subscriptions/{id}/pause
   */
  static async pauseSubscription(id: number): Promise<StandardResponse<UserSubscription>> {
    const response = await api.post<StandardResponse<UserSubscription>>(`/admin/subscriptions/${id}/pause`)
    return response
  }

  /**
   * 恢复用户订阅 (实际API)
   * API: POST /admin/subscriptions/{id}/resume
   */
  static async resumeSubscription(id: number): Promise<StandardResponse<UserSubscription>> {
    const response = await api.post<StandardResponse<UserSubscription>>(`/admin/subscriptions/${id}/resume`)
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
}

// 导出默认实例
export const subscriptionService = SubscriptionService