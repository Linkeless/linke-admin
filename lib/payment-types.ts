// 支付配置响应类型 (基于实际API返回的数据结构)
export interface PaymentConfigResponse {
  id: number
  gateway: string
  name: string
  method?: string // 注意：实际API响应中可能没有这个字段
  description?: string
  environment?: string
  is_enabled: boolean
  icon?: string
  min_amount: number
  max_amount: number
  fixed_fee: number // 实际API中的字段名
  percentage_fee: number // 实际API中的字段名
  fee_type?: string // 可能需要从 fixed_fee 和 percentage_fee 推断
  fee_value?: number // 可能需要从 fixed_fee 和 percentage_fee 推断
  fee_min?: number
  fee_max?: number
  supported_currencies: string
  sort_order: number
  created_at: string
  updated_at: string
  config?: string
}

// 创建支付配置请求类型 (基于 service.CreatePaymentConfigRequest)
export interface CreatePaymentConfigRequest {
  name: string
  gateway: string
  method: string
  config: string
  description?: string
  environment?: string
  is_enabled?: boolean
  icon?: string
  min_amount?: number
  max_amount?: number
  fee_type?: string
  fee_value?: number
  fee_min?: number
  fee_max?: number
  supported_currencies?: string
  sort_order?: number
}

// 更新支付配置请求类型 (基于 service.UpdatePaymentConfigRequest)
// 注意：gateway 和 method 字段不能更新，只有在创建时才能设置
export interface UpdatePaymentConfigRequest {
  name?: string
  config?: string
  description?: string
  environment?: string
  is_enabled?: boolean
  icon?: string
  min_amount?: number
  max_amount?: number
  fee_type?: string
  fee_value?: number
  fee_min?: number
  fee_max?: number
  supported_currencies?: string
  sort_order?: number
}

// 支付配置列表查询参数
export interface PaymentConfigsQueryParams {
  gateway?: string
  method?: string
  is_enabled?: boolean
  environment?: string
  limit?: number
  offset?: number
}

// 支付配置筛选选项
export interface PaymentConfigFilters {
  gateway: string
  method: string
  environment: string
  enabled: 'all' | 'enabled' | 'disabled'
}

// 费用类型枚举
export enum FeeType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed'
}

// 环境类型枚举
export enum Environment {
  PRODUCTION = 'production',
  SANDBOX = 'sandbox',
  DEVELOPMENT = 'development'
}

// 常用支付网关类型
export enum PaymentGateway {
  EPAY = 'epay',
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  WECHAT = 'wechat'
}

// 常用支付方式类型
export enum PaymentMethod {
  ALIPAY = 'alipay',
  WECHAT_PAY = 'wechat_pay',
  CREDIT_CARD = 'credit_card',
  BANK_TRANSFER = 'bank_transfer'
}

// API 响应基础类型
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

// 支付配置列表API响应类型 (基于实际API返回结构)
export interface PaymentConfigsApiResponse {
  code: number
  message: string
  data: PaymentConfigResponse[] // 配置列表直接在data中
  total: number // 总数在根级别
  limit: number // ���页数量在根级别
  offset: number // 偏移量在根级别
}

// 支付配置表格行类型
export type PaymentConfigTableRow = PaymentConfigResponse & {
  isSelected?: boolean
}

// 批量操作类型
export interface BatchOperation {
  action: 'enable' | 'disable' | 'delete'
  ids: number[]
}