// ==================== 统计数据类型定义 ====================

// 用户统计
export interface UserStatsResponse {
  total_users: number
  active_users: number
  new_users_today: number
  new_users_this_week: number
  new_users_this_month: number
  users_by_role: {
    [key: string]: number // user, admin, system
  }
  users_by_provider: {
    [key: string]: number // local, google, github, telegram
  }
  users_by_status: {
    [key: string]: number // active, inactive, suspended, banned
  }
}

// 订单统计
export interface OrderStatsResponse {
  total_orders: number
  pending_orders: number
  paid_orders: number
  failed_orders: number
  cancelled_orders: number
  refunded_orders: number
  total_revenue: number
  total_refunded: number
  avg_order_value: number
  conversion_rate: number
}

// 邀请码统计  
export interface InviteCodeStatsResponse {
  total_codes: number
  used_codes: number
  unused_codes: number
  usage_rate: number
  total_conversions: number
}

// 工单统计
export interface TicketStatsResponse {
  total_tickets: number
  open_tickets: number
  in_progress_tickets: number
  resolved_tickets: number
  closed_tickets: number
  avg_response_time: number // in hours
  avg_resolution_time: number // in hours
  tickets_by_priority: {
    low: number
    medium: number
    high: number
    urgent: number
  }
  tickets_by_category: {
    [key: string]: number
  }
}

// 推荐活动统计
export interface ReferralCampaignStatsResponse {
  total_referrals: number
  total_conversions: number  
  conversion_rate: number
  total_rewards_paid: number
  total_reward_budget: number
  avg_reward_per_conversion: number
  referrals_by_status: {
    pending: number
    completed: number
    failed: number
  }
}

// 时间周期枚举
export type StatsPeriod = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all'

// 统计查询参数
export interface StatsQueryParams {
  period?: StatsPeriod
  start_date?: string // YYYY-MM-DD
  end_date?: string // YYYY-MM-DD
}

// ==================== Dashboard组合数据类型 ====================

// Dashboard概览数据
export interface DashboardOverview {
  users: UserStatsResponse
  orders: OrderStatsResponse
  inviteCodes: InviteCodeStatsResponse
  tickets: TicketStatsResponse
  // referrals 可能需要campaignId，先不包含在overview中
}

// Chart数据类型
export interface ChartDataPoint {
  date: string
  value: number
  label?: string
}

export interface PieChartData {
  name: string
  value: number
  color?: string
}

// Revenue趋势数据
export interface RevenueTrendData {
  daily: ChartDataPoint[]
  weekly: ChartDataPoint[]
  monthly: ChartDataPoint[]
}

// 用户增长趋势数据
export interface UserGrowthData {
  date: string
  new_users: number
  total_users: number
  active_users: number
}

// ==================== Dashboard Service接口 ====================

export interface DashboardService {
  // 获取概览数据
  getOverview(params?: StatsQueryParams): Promise<DashboardOverview>
  
  // 获取用户统计
  getUserStats(params?: StatsQueryParams): Promise<UserStatsResponse>
  
  // 获取订单统计
  getOrderStats(params?: StatsQueryParams): Promise<OrderStatsResponse>
  
  // 获取邀请码统计
  getInviteCodeStats(): Promise<InviteCodeStatsResponse>
  
  // 获取工单统计
  getTicketStats(params?: StatsQueryParams): Promise<TicketStatsResponse>
  
  // 获取收入趋势数据
  getRevenueTrend(params?: StatsQueryParams): Promise<RevenueTrendData>
  
  // 获取用户增长数据
  getUserGrowth(params?: StatsQueryParams): Promise<UserGrowthData[]>
}