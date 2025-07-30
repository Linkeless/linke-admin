// 订单响应类型 (基于 SubscriptionOrderResponse)
export interface SubscriptionOrderResponse {
  id: number
  order_number: string
  order_type: 'new' | 'renewal' | 'upgrade' | 'downgrade'
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded'
  
  // 用户信息
  user_id: number
  user?: {
    id: number
    email: string
    username?: string
  }
  
  // 订阅信息
  subscription_plan_id: number
  subscription_plan?: {
    id: number
    name: string
    price: number
  }
  user_subscription_id?: number
  
  // 金额信息
  amount: number
  setup_fee: number
  discount_amount: number
  discount_type?: string
  discount_value?: number
  total_amount: number
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
  refunded_at?: string
  
  // 发票信息
  invoice_number?: string
  invoice_status?: string
  invoiced_at?: string
  
  // 账期信息
  billing_period_start: string
  billing_period_end: string
  
  // 时间戳
  created_at: string
  updated_at: string
  paid_at?: string
}

// 订单查询参数
export interface OrderQueryParams {
  user_id?: number
  status?: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded'
  order_type?: 'new' | 'renewal' | 'upgrade' | 'downgrade'
  payment_method?: string
  payment_gateway?: string
  min_amount?: number
  max_amount?: number
  start_date?: string
  end_date?: string
  coupon_code?: string
  search?: string
  sort_by?: 'created_at' | 'paid_at' | 'amount' | 'total_amount'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// 订单统计响应
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

// 批量操作请求
export interface BulkUpdateRequest {
  admin_confirmed: boolean
  operation: 'cancel' | 'refund' | 'export'
  order_ids: number[]
  reason?: string
  notes?: string
}

// 退款请求
export interface RefundRequest {
  admin_confirmed: boolean
  amount?: number
  reason: string
  refund_method?: string
  notes?: string
  notify_user?: boolean
}

// 更新订单状态请求
export interface UpdateOrderStatusRequest {
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded'
  reason?: string
  notes?: string
  notify_user?: boolean
  admin_confirmed: boolean
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