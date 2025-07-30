import {
  PaymentConfigResponse,
  CreatePaymentConfigRequest,
  UpdatePaymentConfigRequest,
  PaymentConfigsQueryParams,
  ApiResponse,
  PaymentConfigsApiResponse
} from './payment-types'
import { getToken } from './api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1'

class PaymentService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // 添加认证 token
    const token = getToken()
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
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // 获取支付配置列表
  async getPaymentConfigs(params?: PaymentConfigsQueryParams): Promise<PaymentConfigsApiResponse> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }

    const queryString = searchParams.toString()
    const endpoint = `/admin/payments/configs${queryString ? `?${queryString}` : ''}`
    
    return this.request<PaymentConfigsApiResponse>(endpoint, {
      method: 'GET',
    })
  }

  // 创建支付配置
  async createPaymentConfig(data: CreatePaymentConfigRequest): Promise<ApiResponse<PaymentConfigResponse>> {
    return this.request<PaymentConfigResponse>('/admin/payments/configs', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // 更新支付配置
  async updatePaymentConfig(id: number, data: UpdatePaymentConfigRequest): Promise<ApiResponse<PaymentConfigResponse>> {
    return this.request<PaymentConfigResponse>(`/admin/payments/configs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // 删除支付配置
  async deletePaymentConfig(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/admin/payments/configs/${id}`, {
      method: 'DELETE',
    })
  }

  // 批量启用支付配置
  async batchEnableConfigs(ids: number[]): Promise<ApiResponse<void>> {
    const updatePromises = ids.map(id =>
      this.updatePaymentConfig(id, { is_enabled: true })
    )
    await Promise.all(updatePromises)
    return { code: 0, message: 'Batch enable successful', data: undefined }
  }

  // 批量禁用支付配置
  async batchDisableConfigs(ids: number[]): Promise<ApiResponse<void>> {
    const updatePromises = ids.map(id =>
      this.updatePaymentConfig(id, { is_enabled: false })
    )
    await Promise.all(updatePromises)
    return { code: 0, message: 'Batch disable successful', data: undefined }
  }

  // 批量删除支付配置
  async batchDeleteConfigs(ids: number[]): Promise<ApiResponse<void>> {
    const deletePromises = ids.map(id => this.deletePaymentConfig(id))
    await Promise.all(deletePromises)
    return { code: 0, message: 'Batch delete successful', data: undefined }
  }

  // 切换支付配置启用状态
  async toggleConfigStatus(id: number, enabled: boolean): Promise<ApiResponse<PaymentConfigResponse>> {
    return this.updatePaymentConfig(id, { is_enabled: enabled })
  }

  // 获取支付网关选项 (静态数据，可以后续从API获取)
  getPaymentGateways(): { value: string; label: string }[] {
    return [
      { value: 'epay', label: '易支付' },
      { value: 'stripe', label: 'Stripe' },
      { value: 'paypal', label: 'PayPal' },
      { value: 'wechat', label: '微信支付' },
    ]
  }

  // 获取支付方式选项 (静态数据，可以后续从API获取)
  getPaymentMethods(): { value: string; label: string }[] {
    return [
      { value: 'alipay', label: '支付宝' },
      { value: 'wechat_pay', label: '微信支付' },
      { value: 'credit_card', label: '信用卡' },
      { value: 'bank_transfer', label: '银行转账' },
    ]
  }

  // 获取环境选项
  getEnvironments(): { value: string; label: string }[] {
    return [
      { value: 'production', label: '生产环境' },
      { value: 'sandbox', label: '沙箱环境' },
      { value: 'development', label: '开发环境' },
    ]
  }

  // 获取费用类型选项
  getFeeTypes(): { value: string; label: string }[] {
    return [
      { value: 'percentage', label: '百分比' },
      { value: 'fixed', label: '固定金额' },
    ]
  }
}

// 导出单例实例
export const paymentService = new PaymentService()

// 导出类型以供其他文件使用
export type { PaymentService }