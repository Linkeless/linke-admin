// 订阅管理相关的TypeScript类型定义

// 服务器组信息类型（用于显示）
export interface ServerGroupInfo {
  id: number
  name: string
  description?: string
  status?: 'active' | 'inactive'
}

// 订阅计划响应类型 - 匹配 entities.SubscriptionPlanResponse
export interface SubscriptionPlan {
  id: number
  name: string
  code: string
  description?: string
  price: number
  currency: string
  billing_cycle: 'monthly' | 'yearly' | 'lifetime'
  billing_interval: number
  trial_period_days: number
  status: 'active' | 'inactive' | 'archived'
  is_visible: boolean
  sort_order: number
  is_popular: boolean
  is_recommended: boolean
  setup_fee: number
  cancellation_fee: number
  traffic_limit: number // 字节为单位
  traffic_limit_gb: number // GB为单位（计算得出）
  traffic_limit_text: string // 人类可读格式
  traffic_reset_cycle: 'monthly' | 'never'
  created_at: string
  updated_at: string
  features?: string // JSON字符串
  limits?: string // JSON字符串
  // 服务器组相关字段
  default_server_group_ids?: number[] // 默认服务器组ID数组
  server_groups?: ServerGroupInfo[] // 服务器组详细信息（用于显示）
}

// 用户订阅相关类型
export interface UserSubscription {
  id: number
  user_id: number
  subscription_plan_id: number
  uuid: string
  status: 'active' | 'inactive' | 'cancelled' | 'expired' | 'trialing' | 'past_due'
  start_date: string
  end_date: string
  current_period_start: string
  current_period_end: string
  trial_end_date?: string
  next_billing_date?: string
  price: number
  currency: string
  billing_cycle: string
  billing_interval: number
  auto_renew: boolean
  cancel_at_period_end: boolean
  cancelled_at?: string
  cancellation_reason?: string
  renewal_attempts: number
  renewal_fail_reason?: string
  last_renewal_failed?: string
  last_used_at?: string
  is_in_trial: boolean
  is_expired: boolean
  days_left: number
  created_at: string
  updated_at: string
  // 关联数据
  user?: {
    id: number
    email: string
    username: string
    name: string
    avatar?: string
  }
  subscription_plan?: SubscriptionPlan
}

// API请求类型
export interface CreatePlanRequest {
  name: string
  code: string
  description?: string
  price: number
  currency: string
  billing_cycle: 'monthly' | 'yearly' | 'lifetime'
  billing_interval?: number
  traffic_limit: number // 必填：流量限制（字节）
  traffic_reset_cycle: 'monthly' | 'never' // 必填：流量重置周期
  trial_period_days?: number
  setup_fee?: number
  cancellation_fee?: number
  is_visible?: boolean
  is_popular?: boolean
  is_recommended?: boolean
  sort_order?: number
  features?: string
  limits?: string
  default_server_group_ids: number[] // 新增：默认服务器组ID数组（必填）
}

export type UpdatePlanRequest = Partial<CreatePlanRequest>

export interface CreateSubscriptionRequest {
  user_id: number
  subscription_plan_id: number
  reason?: string
  notes?: string
  start_date?: string
  use_trial?: boolean
  skip_payment?: boolean
  send_notification?: boolean
  server_group_ids?: number[]
  custom_traffic_limit?: number
  custom_traffic_reset_cycle?: string
  disable_traffic_limit?: boolean
}

export interface UpdateSubscriptionRequest {
  auto_renew?: boolean
  cancel_at_period_end?: boolean  
  cancellation_reason?: string
  end_date?: string
  notes?: string
  server_group_ids?: number[]
  status?: 'active' | 'paused' | 'cancelled' | 'expired' | 'trial'
}

// 筛选器类型
export interface PlanFilters {
  status?: 'active' | 'inactive' | 'archived'
  currency?: string
  limit?: number
  offset?: number
}

export interface SubscriptionFilters {
  user_id?: number
  status?: 'active' | 'inactive' | 'cancelled' | 'expired' | 'trialing' | 'past_due'
  plan_id?: number
  limit?: number
  offset?: number
}

// API响应类型 - 匹配实际API结构
export interface PaginatedResponse<T> {
  code: number
  message: string
  data: {
    items: T[]
    pagination: {
      limit: number
      page: number
      total: number
      total_pages?: number
    }
  }
}

// 旧格式（向后兼容）
export interface LegacyPaginatedResponse<T> {
  code: number
  message: string
  data: T[]
  total: number
  limit: number
  offset: number
}

export interface StandardResponse<T> {
  code: number
  message: string
  data: T
}

// 状态配置
export const SUBSCRIPTION_STATUS_CONFIG = {
  active: { color: 'green', text: '活跃', variant: 'default' as const },
  inactive: { color: 'gray', text: '未激活', variant: 'secondary' as const },
  expired: { color: 'red', text: '已过期', variant: 'destructive' as const },
  cancelled: { color: 'orange', text: '已取消', variant: 'outline' as const },
  trialing: { color: 'blue', text: '试用中', variant: 'default' as const },
  past_due: { color: 'yellow', text: '逾期', variant: 'outline' as const }
} as const

export const PLAN_STATUS_CONFIG = {
  active: { color: 'green', text: 'Active', variant: 'default' as const },
  inactive: { color: 'gray', text: '未激活', variant: 'secondary' as const },
  archived: { color: 'red', text: '已归档', variant: 'destructive' as const }
} as const

// 计费周期配置
export const BILLING_CYCLE_CONFIG = {
  monthly: { text: '月付', interval: 1 },
  yearly: { text: '年付', interval: 12 },
  lifetime: { text: '终身', interval: 0 }
} as const

// 货币配置
export const CURRENCY_CONFIG = {
  USD: { symbol: '$', name: '美元' },
  EUR: { symbol: '€', name: '欧元' },
  CNY: { symbol: '¥', name: '人民币' },
  GBP: { symbol: '£', name: '英镑' },
  JPY: { symbol: '¥', name: '日元' }
} as const

// 工具函数类型
export type StatusVariant = 'default' | 'secondary' | 'destructive' | 'outline'
export type SubscriptionStatus = keyof typeof SUBSCRIPTION_STATUS_CONFIG
export type PlanStatus = keyof typeof PLAN_STATUS_CONFIG
export type BillingCycle = keyof typeof BILLING_CYCLE_CONFIG
export type Currency = keyof typeof CURRENCY_CONFIG