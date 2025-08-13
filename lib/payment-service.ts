import {
  PaymentConfigResponse,
  CreatePaymentConfigRequest,
  UpdatePaymentConfigRequest,
  PaymentConfigsQueryParams,
  ApiResponse,
  PaymentConfigsApiResponse
} from './payment-types'
import { api } from './api'

/**
 * 支付配置服务 - 严格按照swagger API定义实现
 * API文档: /admin/payment/configs
 */
class PaymentService {
  // 使用统一的API客户端 (lib/api.ts)

  // 获取支付配置列表
  async getPaymentConfigs(params?: PaymentConfigsQueryParams): Promise<PaymentConfigsApiResponse> {
    // 严格按swagger：method, is_enabled, environment, limit, offset
    return api.get<PaymentConfigsApiResponse>('/admin/payment/configs', params)
  }

  // 创建支付配置
  async createPaymentConfig(data: CreatePaymentConfigRequest): Promise<ApiResponse<PaymentConfigResponse>> {
    return api.post<ApiResponse<PaymentConfigResponse>>('/admin/payment/configs', data)
  }

  // 更新支付配置
  async updatePaymentConfig(id: number, data: UpdatePaymentConfigRequest): Promise<ApiResponse<PaymentConfigResponse>> {
    return api.put<ApiResponse<PaymentConfigResponse>>(`/admin/payment/configs/${id}`, data)
  }

  // 删除支付配置
  async deletePaymentConfig(id: number): Promise<ApiResponse<void>> {
    return api.delete<ApiResponse<void>>(`/admin/payment/configs/${id}`)
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

  // 获取支付方法配置模式 - 从API获取
  async getPaymentMethodSchemas(): Promise<ApiResponse<unknown>> {
    return api.get<ApiResponse<unknown>>('/admin/payment/schemas')
  }

  // 获取特定支付方法的配置模式
  async getPaymentMethodSchema(method: string): Promise<ApiResponse<unknown>> {
    return api.get<ApiResponse<unknown>>(`/admin/payment/schemas/${method}`)
  }

  // 获取支付方式选项 - 基于swagger定义的method字段
  getPaymentMethods(): { value: string; label: string }[] {
    return [
      { value: 'epay', label: '易支付 (EPay)' },
      { value: 'crypto_btc', label: '加密货币 Bitcoin' },
      { value: 'crypto_eth', label: '加密货币 Ethereum' },
      { value: 'crypto_usdt', label: '加密货币 USDT' },
      { value: 'stripe', label: 'Stripe' },
      { value: 'paypal', label: 'PayPal' },
      { value: 'alipay', label: '支付宝' },
      { value: 'wechat_pay', label: '微信支付' },
    ]
  }


  // 获取支持的货币列表 (基于swagger示例 "CNY")
  getSupportedCurrencies(): { value: string; label: string }[] {
    return [
      { value: 'CNY', label: '人民币 (CNY)' },
      { value: 'USD', label: '美元 (USD)' },
      { value: 'EUR', label: '欧元 (EUR)' },
      { value: 'JPY', label: '日元 (JPY)' },
      { value: 'BTC', label: '比特币 (BTC)' },
      { value: 'ETH', label: '以太币 (ETH)' },
      { value: 'USDT', label: 'USDT' },
    ]
  }
}

// 导出单例实例
export const paymentService = new PaymentService()

// 导出类型以供其他文件使用
export type { PaymentService }