// 优惠码响应类型 (基于 model.CouponResponse)
export interface CouponResponse {
  id: number
  code: string
  name: string
  type: 'percentage' | 'fixed_amount'
  value: number
  currency: string
  status: 'active' | 'inactive' | 'expired'
  
  // 使用限制
  max_uses: number
  used_count: number
  max_uses_per_user: number
  
  // 有效期
  valid_from?: string
  valid_until?: string
  
  // 适用范围
  applicable_plans?: string
  min_order_amount?: number
  
  // 其他配置
  description?: string
  is_public: boolean
  
  // 时间戳
  created_at: string
  updated_at: string
}

// 创建优惠码请求类型 (基于 service.CreateCouponRequest)
export interface CreateCouponRequest {
  code: string
  name: string
  type: 'percentage' | 'fixed_amount'
  value: number
  currency?: string
  
  // 使用限制
  max_uses?: number
  max_uses_per_user?: number
  
  // 有效期
  valid_from?: string
  valid_until?: string
  
  // 适用范围
  applicable_plans?: string
  min_order_amount?: number
  
  // 其他配置
  description?: string
  is_public?: boolean
}

// 更新优惠码请求类型 (基于 service.UpdateCouponRequest)
export interface UpdateCouponRequest {
  name?: string
  type?: 'percentage' | 'fixed_amount'
  status?: 'active' | 'inactive' | 'expired'
  
  // 使用限制
  max_uses?: number
  max_uses_per_user?: number
  
  // 有效期
  valid_from?: string
  valid_until?: string
  
  // 适用范围
  applicable_plans?: string
  min_order_amount?: number
  
  // 其他配置
  description?: string
  is_public?: boolean
}

// 优惠码查询参数 (基于接口文档参数)
export interface CouponQueryParams {
  status?: 'active' | 'inactive' | 'expired'
  type?: 'percentage' | 'fixed_amount'
  is_public?: boolean
  search?: string
  sort_by?: 'created_at' | 'code' | 'name' | 'used_count' | 'valid_from' | 'valid_until'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// 优惠码统计响应
export interface CouponStatsResponse {
  total_coupons: number
  active_coupons: number
  expired_coupons: number
  inactive_coupons: number
  total_usage: number
  total_discount_amount: number
  avg_usage_rate: number
}

// 优惠码使用记录 (基于 model.CouponUsageResponse)
export interface CouponUsageResponse {
  id: number
  coupon_id: number
  coupon?: CouponResponse
  user_id: number
  user?: {
    id: number
    email: string
    username?: string
  }
  order_id: number
  discount_amount: number
  currency: string
  created_at: string
}

// 优惠码使用记录查询参数
export interface CouponUsageQueryParams {
  coupon_id?: number
  user_id?: number
  order_id?: number
  start_date?: string
  end_date?: string
  limit?: number
  offset?: number
}

// 批量操作请求
export interface BatchCouponRequest {
  admin_confirmed: boolean
  operation: 'activate' | 'deactivate' | 'delete' | 'export'
  coupon_ids: number[]
  reason?: string
}

// 优惠码列表API响应
export interface CouponsApiResponse {
  code: number
  message: string
  data: {
    items: CouponResponse[]
    pagination: {
      page: number
      limit: number
      total: number
    }
  }
}

// 优惠码使用记录API响应  
export interface CouponUsagesApiResponse {
  code: number
  message: string
  data: {
    items: CouponUsageResponse[]
    pagination: {
      page: number
      limit: number
      total: number
    }
  }
}

// API 响应基础类型
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

// 优惠码表格行类型
export type CouponTableRow = CouponResponse & {
  isSelected?: boolean
}

// 优惠码筛选状态
export interface CouponFilters {
  status: string
  type: string
  is_public: string
  search: string
  valid_from: string
  valid_until: string
}

// 优惠码类型枚举
export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount'
}

// 优惠码状态枚举
export enum CouponStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired'
}