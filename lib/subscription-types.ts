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
  visible?: boolean
  popular?: boolean
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

// 订阅告警相关类型
export interface SubscriptionAlert {
  id: number
  user_id: number
  subscription_id: number
  alert_type: 'renewal_failed' | 'payment_failed' | 'expiration_warning' | 'usage_limit' | 'traffic_limit' | 'system_error'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  status: 'pending' | 'resolved' | 'ignored'
  metadata?: string // JSON字符串
  created_at: string
  updated_at: string
  resolved_at?: string
  resolved_by?: number
  // 关联数据
  user?: {
    id: number
    email: string
    username: string
    name: string
  }
  subscription?: {
    id: number
    uuid: string
    status: string
    subscription_plan?: {
      name: string
    }
  }
}

// 告警统计类型
export interface AlertStatistics {
  total_alerts: number
  pending_alerts: number
  resolved_alerts: number
  critical_alerts: number
  high_priority_alerts: number
  by_type: Record<string, number>
  by_severity: Record<string, number>
  recent_trend: {
    date: string
    count: number
  }[]
}

// 订阅分析相关类型
export interface SubscriptionAnalytics {
  overview: {
    total_subscriptions: number
    active_subscriptions: number
    trial_subscriptions: number
    expired_subscriptions: number
    cancelled_subscriptions: number
    total_revenue: number
    monthly_recurring_revenue: number
    annual_recurring_revenue: number
    average_revenue_per_user: number
    churn_rate: number
    growth_rate: number
  }
  trends: {
    date: string
    new_subscriptions: number
    cancelled_subscriptions: number
    revenue: number
    active_users: number
  }[]
  plan_distribution: {
    plan_id: number
    plan_name: string
    subscription_count: number
    revenue: number
    percentage: number
  }[]
  user_metrics: {
    lifetime_value: number
    average_subscription_duration: number
    retention_rate: {
      period: string
      rate: number
    }[]
  }
}

// 订单分析类型
export interface OrderAnalytics {
  overview: {
    total_orders: number
    completed_orders: number
    pending_orders: number
    failed_orders: number
    total_revenue: number
    average_order_value: number
    conversion_rate: number
  }
  trends: {
    date: string
    order_count: number
    revenue: number
    conversion_rate: number
  }[]
  payment_methods: {
    method: string
    count: number
    revenue: number
    percentage: number
  }[]
  geographic_distribution: {
    country: string
    order_count: number
    revenue: number
    percentage: number
  }[]
}

// 订单详情类型
export interface OrderDetail {
  id: number
  user_id: number
  subscription_plan_id: number
  order_number: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded'
  amount: number
  currency: string
  payment_method: string
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
  billing_address?: string
  created_at: string
  updated_at: string
  completed_at?: string
  cancelled_at?: string
  refunded_at?: string
  notes?: string
  // 关联数据
  user?: {
    id: number
    email: string
    username: string
    name: string
  }
  subscription_plan?: {
    id: number
    name: string
    price: number
    currency: string
    billing_cycle: string
  }
  payment_transactions?: PaymentTransaction[]
}

// 支付交易类型
export interface PaymentTransaction {
  id: number
  order_id: number
  transaction_id: string
  payment_method: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  gateway_response?: string
  created_at: string
  updated_at: string
}

// API请求类型
export interface AlertFilters {
  user_id?: number
  subscription_id?: number
  alert_type?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
  status?: 'pending' | 'resolved' | 'ignored'
  limit?: number
  offset?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface BulkResolveAlertsRequest {
  alert_ids: number[]
  resolution_note?: string
}

export interface OrderFilters {
  user_id?: number
  subscription_plan_id?: number
  status?: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded'
  payment_method?: string
  date_from?: string
  date_to?: string
  limit?: number
  offset?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface AnalyticsFilters {
  date_from?: string
  date_to?: string
  plan_id?: number
  user_id?: number
  granularity?: 'daily' | 'weekly' | 'monthly' | 'yearly'
}

// 配置常量
export const ALERT_TYPE_CONFIG = {
  renewal_failed: { text: '续费失败', color: 'red', icon: 'AlertCircle' },
  payment_failed: { text: '支付失败', color: 'red', icon: 'CreditCard' },
  expiration_warning: { text: '即将过期', color: 'yellow', icon: 'Clock' },
  usage_limit: { text: '使用限制', color: 'orange', icon: 'Gauge' },
  traffic_limit: { text: '流量限制', color: 'orange', icon: 'Activity' },
  system_error: { text: '系统错误', color: 'red', icon: 'AlertTriangle' }
} as const

export const ALERT_SEVERITY_CONFIG = {
  low: { text: '低', color: 'blue', variant: 'outline' as const },
  medium: { text: '中', color: 'yellow', variant: 'default' as const },
  high: { text: '高', color: 'orange', variant: 'default' as const },
  critical: { text: '紧急', color: 'red', variant: 'destructive' as const }
} as const

export const ORDER_STATUS_CONFIG = {
  pending: { text: '待处理', color: 'yellow', variant: 'outline' as const },
  completed: { text: '已完成', color: 'green', variant: 'default' as const },
  failed: { text: '失败', color: 'red', variant: 'destructive' as const },
  cancelled: { text: '已取消', color: 'gray', variant: 'secondary' as const },
  refunded: { text: '已退款', color: 'orange', variant: 'outline' as const }
} as const

// 工具函数类型
export type StatusVariant = 'default' | 'secondary' | 'destructive' | 'outline'
export type SubscriptionStatus = keyof typeof SUBSCRIPTION_STATUS_CONFIG
export type PlanStatus = keyof typeof PLAN_STATUS_CONFIG
export type BillingCycle = keyof typeof BILLING_CYCLE_CONFIG
export type Currency = keyof typeof CURRENCY_CONFIG
export type AlertType = keyof typeof ALERT_TYPE_CONFIG
export type AlertSeverity = keyof typeof ALERT_SEVERITY_CONFIG
export type OrderStatus = keyof typeof ORDER_STATUS_CONFIG