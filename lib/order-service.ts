import {
  SubscriptionOrderResponse,
  OrderQueryParams,
  OrderStatsResponse,
  OrderAnalyticsParams,
  CancelOrderRequest,
  CreateSubscriptionOrderRequest,
  OrdersApiResponse,
  ApiResponse
} from './order-types'
import { getToken } from './api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1'

class OrderService {
  // 通用请求方法
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // 添加认证 token
    const token = getToken()
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (token) {
      defaultHeaders.Authorization = `Bearer ${token}`
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // === 管理员接口 ===

  // 获取订单列表 (管理员) - 带分页和筛选
  async getOrders(params?: OrderQueryParams): Promise<OrdersApiResponse> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }
    const queryString = searchParams.toString()
    const endpoint = `/admin/subscriptions/orders${queryString ? `?${queryString}` : ''}`
    
    return this.request<OrdersApiResponse>(endpoint, {
      method: 'GET',
    })
  }

  // 获取单个订单详情 (管理员)
  async getOrderById(id: number): Promise<ApiResponse<SubscriptionOrderResponse>> {
    return this.request<ApiResponse<SubscriptionOrderResponse>>(`/admin/subscriptions/orders/${id}`, {
      method: 'GET',
    })
  }

  // 获取订单统计 (管理员)
  async getOrderAnalytics(params?: OrderAnalyticsParams): Promise<ApiResponse<OrderStatsResponse>> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }
    
    const queryString = searchParams.toString()
    const endpoint = `/admin/subscriptions/analytics/orders${queryString ? `?${queryString}` : ''}`
    
    return this.request<ApiResponse<OrderStatsResponse>>(endpoint, {
      method: 'GET',
    })
  }

  // 取消订单 (管理员)
  async cancelOrder(id: number, data: CancelOrderRequest): Promise<ApiResponse<SubscriptionOrderResponse>> {
    return this.request<ApiResponse<SubscriptionOrderResponse>>(`/admin/subscriptions/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // === 用户端接口 ===

  // 创建订阅订单 (用户)
  async createSubscriptionOrder(data: CreateSubscriptionOrderRequest): Promise<ApiResponse<SubscriptionOrderResponse>> {
    return this.request<ApiResponse<SubscriptionOrderResponse>>('/subscription/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // 获取当前用户的订单列表 (用户)
  async getMyOrders(params?: { limit?: number; offset?: number }): Promise<OrdersApiResponse> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }
    const queryString = searchParams.toString()
    const endpoint = `/subscription/orders/my${queryString ? `?${queryString}` : ''}`
    
    return this.request<OrdersApiResponse>(endpoint, {
      method: 'GET',
    })
  }

  // 获取订单详情 (用户)
  async getMyOrderById(id: number): Promise<ApiResponse<SubscriptionOrderResponse>> {
    return this.request<ApiResponse<SubscriptionOrderResponse>>(`/subscription/orders/${id}`, {
      method: 'GET',
    })
  }

  // === 工具方法 ===

  // 获取订单状态选项 (静态数据)
  getOrderStatuses(): { value: string; label: string; color: string }[] {
    return [
      { value: 'pending', label: '待支付', color: 'yellow' },
      { value: 'paid', label: '已支付', color: 'green' },
      { value: 'completed', label: '已完成', color: 'green' },
      { value: 'failed', label: '支付失败', color: 'red' },
      { value: 'cancelled', label: '已取消', color: 'gray' },
      { value: 'refunded', label: '已退款', color: 'blue' },
    ]
  }

  // 获取订单类型选项 (静态数据)
  getOrderTypes(): { value: string; label: string }[] {
    return [
      { value: 'new', label: '新订单' },
      { value: 'renewal', label: '续费' },
      { value: 'upgrade', label: '升级' },
      { value: 'downgrade', label: '降级' },
    ]
  }

  // 获取支付方式选项 (静态数据)
  getPaymentMethods(): { value: string; label: string }[] {
    return [
      { value: 'credit_card', label: '信用卡' },
      { value: 'alipay', label: '支付宝' },
      { value: 'wechat', label: '微信支付' },
      { value: 'paypal', label: 'PayPal' },
    ]
  }

  // 获取支付网关选项 (静态数据)
  getPaymentGateways(): { value: string; label: string }[] {
    return [
      { value: 'stripe', label: 'Stripe' },
      { value: 'epay', label: '易支付' },
      { value: 'paypal', label: 'PayPal' },
    ]
  }

  // 获取退款状态选项 (静态数据)
  getRefundStatuses(): { value: string; label: string; color: string }[] {
    return [
      { value: 'none', label: '无退款', color: 'gray' },
      { value: 'partial', label: '部分退款', color: 'yellow' },
      { value: 'full', label: '全额退款', color: 'blue' },
      { value: 'processing', label: '退款处理中', color: 'orange' },
    ]
  }
}

// 导出单例实例
export const orderService = new OrderService()