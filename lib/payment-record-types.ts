// 支付记录响应类型 (基于支付交易记录)
export interface PaymentRecordResponse {
  id: number
  payment_number: string
  transaction_id?: string
  
  // 关联订单信息
  order_id: number
  order_number?: string
  order?: {
    id: number
    order_number: string
    order_type: 'new' | 'renewal' | 'upgrade' | 'downgrade'
  }
  
  // 用户信息
  user_id: number
  user?: {
    id: number
    email: string
    username?: string
  }
  
  // 支付信息
  payment_method: string
  payment_gateway: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded'
  
  // 金额信息
  amount: number
  fee_amount: number
  refund_amount?: number
  net_amount: number
  currency: string
  
  // 支付时间
  paid_at?: string
  expired_at?: string
  
  // 退款信息
  refunded_at?: string
  refund_reason?: string
  
  // 附加信息
  description?: string
  metadata?: string
  gateway_response?: string
  failure_reason?: string
  
  // 时间戳
  created_at: string
  updated_at: string
}

// 支付记录查询参数
export interface PaymentRecordQueryParams {
  user_id?: number
  order_id?: number
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded'
  payment_method?: string
  payment_gateway?: string
  min_amount?: number
  max_amount?: number
  start_date?: string
  end_date?: string
  search?: string
  sort_by?: 'created_at' | 'paid_at' | 'amount' | 'net_amount'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// 支付记录统计响应
export interface PaymentStatsResponse {
  total_payments: number
  completed_payments: number
  pending_payments: number
  failed_payments: number
  refunded_payments: number
  total_amount: number
  total_fees: number
  total_refunded: number
  net_amount: number
  success_rate: number
}

// 退款请求
export interface PaymentRefundRequest {
  admin_confirmed: boolean
  amount?: number
  reason: string
  refund_method?: string
  notes?: string
  notify_user?: boolean
}

// 更新支付状态请求
export interface UpdatePaymentStatusRequest {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded'
  reason?: string
  notes?: string
  notify_user?: boolean
  admin_confirmed: boolean
}

// 批量操作请求
export interface BatchPaymentRequest {
  admin_confirmed: boolean
  operation: 'refund' | 'cancel' | 'retry' | 'export'
  payment_ids: number[]
  reason?: string
  notes?: string
}

// 支付记录列表API响应
export interface PaymentRecordsApiResponse {
  code: number
  message: string
  data: PaymentRecordResponse[]
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

// 支付记录表格行类型
export type PaymentRecordTableRow = PaymentRecordResponse & {
  isSelected?: boolean
}

// 支付筛选状态
export interface PaymentFilters {
  status: string
  payment_method: string
  payment_gateway: string
  search: string
  start_date: string
  end_date: string
}