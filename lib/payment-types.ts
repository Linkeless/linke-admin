// 支付配置响应类型 (严格按照 swagger dto.PaymentConfigResponse 定义)
export interface PaymentConfigResponse {
  id: number // Config ID
  name: string // Display name
  method: string // Payment method identifier (如 "epay")
  url: string // API endpoint URL
  pid: string // Partner/Merchant ID
  key: string // API key/secret
  is_enabled: boolean // Enabled status
  min_amount: number // Minimum amount
  max_amount: number // Maximum amount
  fixed_fee: number // Fixed fee
  percentage_fee: number // Percentage fee
  supported_currencies: string // Supported currencies
  sort_order: number // Sort order
  notify_url: string // Callback URL
  return_url: string // Return URL
  created_at: string // Creation time
  updated_at: string // Update time
  methods: unknown[] // Payment methods array (entities.Method[])
}

// 创建支付配置请求类型 (严格按照 swagger dto.CreatePaymentConfigRequest 定义)
export interface CreatePaymentConfigRequest {
  // 必填字段 - swagger required: ["key", "method", "name", "pid", "url"]
  name: string // 配置名称
  method: string // 支付方式标识符 (如 "epay")
  url: string // API地址
  pid: string // 商户/合作方ID
  key: string // API密钥
  // 可选字段
  is_enabled?: boolean // 启用状态
  min_amount?: number // 最小金额
  max_amount?: number // 最大金额
  fixed_fee?: number // 固定费用
  percentage_fee?: number // 百分比费用
  supported_currencies?: string // 支持的货币
  notify_url?: string // 通知回调URL
  return_url?: string // 返回URL
  sort_order?: number // 排序顺序
  methods?: unknown[] // 支付方式数组
}

// 更新支付配置请求类型 (严格按照 swagger dto.UpdatePaymentConfigRequest 定义)
export interface UpdatePaymentConfigRequest {
  name?: string // 配置名称
  key?: string // API密钥
  url?: string // API地址
  pid?: string // 商户/合作方ID
  is_enabled?: boolean // 启用状态
  min_amount?: number // 最小金额
  max_amount?: number // 最大金额
  fixed_fee?: number // 固定费用
  percentage_fee?: number // 百分比费用
  supported_currencies?: string // 支持的货币
  notify_url?: string // 通知回调URL
  return_url?: string // 返回URL
  sort_order?: number // 排序顺序
  methods?: unknown[] // 支付方式数组
}

// 支付配置列表查询参数 (基于swagger API参数)
export interface PaymentConfigsQueryParams {
  method?: string // Filter by payment method
  is_enabled?: boolean // Filter by enabled status
  limit?: number // Pagination limit
  offset?: number // Pagination offset
}

// 支付配置筛选选项
export interface PaymentConfigFilters {
  method: string // 支付方式过滤
  enabled: 'all' | 'enabled' | 'disabled' // 启用状态过滤
}

// 费用类型枚举
export enum FeeType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed'
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
  data: PaymentConfigResponse[]
  total: number
  limit: number
  offset: number
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