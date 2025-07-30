import {
  SubscriptionOrderResponse,
  OrderQueryParams,
  OrderStatsResponse,
  BulkUpdateRequest,
  RefundRequest,
  UpdateOrderStatusRequest,
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

  // 获取订单列表 (带分页和筛选)
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
    const endpoint = `/admin/orders${queryString ? `?${queryString}` : ''}`
    
    return this.request<OrdersApiResponse>(endpoint, {
      method: 'GET',
    })
  }

  // 获取单个订单详情
  async getOrderById(id: number): Promise<ApiResponse<SubscriptionOrderResponse>> {
    return this.request<ApiResponse<SubscriptionOrderResponse>>(`/admin/orders/${id}`, {
      method: 'GET',
    })
  }

  // 获取订单统计
  async getOrderStats(period: string = 'month', startDate?: string, endDate?: string): Promise<ApiResponse<OrderStatsResponse>> {
    const searchParams = new URLSearchParams()
    searchParams.append('period', period)
    
    if (startDate) searchParams.append('start_date', startDate)
    if (endDate) searchParams.append('end_date', endDate)
    
    const queryString = searchParams.toString()
    const endpoint = `/admin/orders/stats${queryString ? `?${queryString}` : ''}`
    
    return this.request<ApiResponse<OrderStatsResponse>>(endpoint, {
      method: 'GET',
    })
  }

  // 批量操作订单
  async bulkUpdateOrders(data: BulkUpdateRequest): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>('/admin/orders/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // 处理订单退款
  async refundOrder(id: number, data: RefundRequest): Promise<ApiResponse<SubscriptionOrderResponse>> {
    return this.request<ApiResponse<SubscriptionOrderResponse>>(`/admin/orders/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // 更新订单状态
  async updateOrderStatus(id: number, data: UpdateOrderStatusRequest): Promise<ApiResponse<SubscriptionOrderResponse>> {
    return this.request<ApiResponse<SubscriptionOrderResponse>>(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // 获取订单状态选项 (静态数据)
  getOrderStatuses(): { value: string; label: string; color: string }[] {
    return [
      { value: 'pending', label: '待支付', color: 'yellow' },
      { value: 'paid', label: '已支付', color: 'green' },
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
}

// 导出单例实例
export const orderService = new OrderService()