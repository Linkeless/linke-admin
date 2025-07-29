// 订阅管理相关的TypeScript类型定义

// 订阅计划相关类型
export interface SubscriptionPlan {
  id: number
  name: string
  code: string
  description: string
  price: number
  currency: string
  billing_cycle: 'monthly' | 'yearly' | 'quarterly'
  billing_interval: number
  trial_period_days: number
  status: 'active' | 'inactive' | 'archived'
  is_visible: boolean
  sort_order: number
  is_popular: boolean
  is_recommended: boolean
  setup_fee: number
  cancellation_fee: number
  traffic_limit: number
  traffic_limit_gb: number
  traffic_limit_text: string
  traffic_reset_cycle: string
  created_at: string
  updated_at: string
  // 可选字段 - 在实际API响应中可能不存在
  features?: string // JSON字符串
  limits?: string // JSON字符串
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
  description: string
  price: number
  currency: string
  billing_cycle: 'monthly' | 'yearly' | 'quarterly'
  billing_interval: number
  traffic_limit: number
  traffic_reset_cycle: string
  trial_period_days: number
  setup_fee: number
  cancellation_fee: number
  status: 'active' | 'inactive'
  is_visible: boolean
  is_popular: boolean
  is_recommended: boolean
  sort_order: number
  features: string
  limits: string
}

export type UpdatePlanRequest = Partial<CreatePlanRequest>

export interface CreateSubscriptionRequest {
  user_id: number
  subscription_plan_id: number
  start_date?: string
  end_date?: string
  use_trial?: boolean
  skip_payment?: boolean
  notes?: string
  server_group_ids?: number[]
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

// API响应类型
export interface PaginatedResponse<T> {
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
  active: { color: 'green', text: '激活', variant: 'default' as const },
  inactive: { color: 'gray', text: '未激活', variant: 'secondary' as const },
  archived: { color: 'red', text: '已归档', variant: 'destructive' as const }
} as const

// 计费周期配置
export const BILLING_CYCLE_CONFIG = {
  monthly: { text: '月付', interval: 1 },
  quarterly: { text: '季付', interval: 3 },
  yearly: { text: '年付', interval: 12 }
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