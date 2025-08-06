// 订单响应类型 (基于 SubscriptionOrderResponse)
export interface SubscriptionOrderResponse {
  id: number
  order_number: string
  order_type: 'new' | 'renewal' | 'upgrade' | 'downgrade'
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded'
  
  // 用户信息
  user_id?: number
  user?: {
    id: number
    email: string
    username?: string
  }
  
  // 订阅信息
  subscription_plan_id?: number
  subscription_plan?: {
    id: number
    name: string
    price: number
  }
  subscription_order_id?: number
  subscription_order?: {
    // Basic subscription order info
    id: number
    [key: string]: unknown
  }
  
  // 金额信息
  amount: number
  discount_amount: number
  discount_type?: string
  discount_value?: number
  currency: string
  
  // 优惠券信息
  coupon_code?: string
  
  // 支付信息
  payment_method: string
  payment_gateway: string
  payment_status?: string
  transaction_id?: string
  
  // 退款信息
  refund_amount?: number
  refund_reason?: string
  refund_status?: string
  refundable_amount?: number
  refunded_at?: string
  
  // 发票信息
  invoice_number?: string
  invoice_status?: string
  invoiced_at?: string
  
  // 备注信息
  remark?: string
  
  // 账期信息
  billing_period_start: string
  billing_period_end: string
  
  // 时间戳
  created_at: string
  updated_at?: string
  paid_at?: string
}

// 订单查询参数 (基于 swagger API 规格)
export interface OrderQueryParams {
  user_id?: number
  status?: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded'
  order_type?: 'new' | 'renewal' | 'upgrade' | 'downgrade'
  date_from?: string // YYYY-MM-DD format
  date_to?: string   // YYYY-MM-DD format
  limit?: number
  offset?: number
}

// 订单统计请求参数
export interface OrderAnalyticsParams {
  from_date?: string // YYYY-MM-DD format
  to_date?: string   // YYYY-MM-DD format
}

// 订单统计响应 (基于 swagger API)
export interface OrderStatsResponse {
  total_orders: number
  paid_orders: number
  pending_orders: number
  failed_orders: number
  cancelled_orders: number
  refunded_orders: number
  total_revenue: number
  total_refunded: number
  avg_order_value: number
  conversion_rate: number
}

// 取消订单请求 (基于 swagger API)
export interface CancelOrderRequest {
  reason?: string
}

// 创建订单请求 (基于 swagger API)
export interface CreateSubscriptionOrderRequest {
  user_id: number
  subscription_plan_id: number
  order_type: 'new' | 'renewal' | 'upgrade' | 'downgrade'
  payment_method: string
  payment_gateway: string
  coupon_code?: string
  payment_method_id?: number
  return_url?: string
  use_default_payment?: boolean
  metadata?: string
}

// 订单列表API响应
export interface OrdersApiResponse {
  code: number
  message: string
  data: SubscriptionOrderResponse[]
  total: number
  limit: number
  offset: number
}

// API 响应基础类型
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}