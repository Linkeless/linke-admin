// ==================== 统计数据类型定义 ====================

// 用户统计 (基于实际API: /admin/users/statistics)
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

// 缓存指标 (基于实际API: /admin/cache/metrics)
export interface CacheMetricsResponse {
  global_metrics: CacheMetrics
  prefix_metrics: {
    [key: string]: CacheMetrics
  }
  top_prefixes: CachePrefixMetricSummary[]
  timestamp: string
}

export interface CacheMetrics {
  hits: number
  misses: number
  hitRate: number
  sets: number
  deletes: number
  evictions: number
  memoryUsed: number
  keyCount: number
}

export interface CachePrefixMetricSummary {
  prefix: string
  metrics: CacheMetrics
}

// 缓存监控仪表板 (基于实际API: /admin/cache/monitor/dashboard)
export interface CacheDashboardResponse {
  health: CacheHealthResponse
  metrics: CacheMetricsResponse
  performance: CachePerformanceResponse
  invalidation: CacheInvalidationResponse
  alerts: string[]
  warming: CacheWarmingResponse
}

export interface CacheHealthResponse {
  status: string
  components: {
    [key: string]: string
  }
  issues: string[]
  uptime: number
}

export interface CacheMetricsResponse {
  realtime: CacheMetrics
  historical: CacheHistoricalMetrics[]
}

export interface CacheHistoricalMetrics {
  timestamp: string
  metrics: CacheMetrics
}

export interface CachePerformanceResponse {
  latency: {
    avg: number
    p50: number
    p95: number
    p99: number
  }
  throughput: {
    reads_per_second: number
    writes_per_second: number
  }
  trends: {
    [key: string]: number[]
  }
}

export interface CacheInvalidationResponse {
  total_invalidations: number
  recent_invalidations: CacheInvalidationEvent[]
  patterns: {
    [key: string]: number
  }
}

export interface CacheInvalidationEvent {
  timestamp: string
  pattern: string
  keys_invalidated: number
  reason: string
}

export interface CacheWarmingResponse {
  status: string
  progress: number
  estimated_completion: string
  last_run: string
}

// 支付重试统计 (基于实际API: /admin/payment/retries/statistics)
export interface PaymentRetryStatsResponse {
  total_retries: number
  successful_retries: number
  failed_retries: number
  pending_retries: number
  success_rate: number
  avg_retry_attempts: number
  retries_by_gateway: {
    [key: string]: number
  }
  retries_by_status: {
    [key: string]: number
  }
}

// 发票统计 (基于实际API: /invoice/statistics)
export interface InvoiceStatsResponse {
  total_invoices: number
  paid_invoices: number
  unpaid_invoices: number
  overdue_invoices: number
  total_amount: number
  paid_amount: number
  unpaid_amount: number
  overdue_amount: number
  avg_invoice_amount: number
  invoices_by_status: {
    [key: string]: number
  }
  monthly_revenue: {
    [key: string]: number
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

// Dashboard概览数据 (基于实际可用的APIs)
export interface DashboardOverview {
  users: UserStatsResponse
  cache: {
    metrics: CacheMetricsResponse | null
    dashboard: CacheDashboardResponse | null
  }
  invoices: InvoiceStatsResponse | null
  payments: PaymentRetryStatsResponse | null
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
  
  // 获取用户统计 (实际API)
  getUserStats(): Promise<UserStatsResponse>
  
  // 获取缓存指标
  getCacheMetrics(): Promise<CacheMetricsResponse>
  
  // 获取缓存监控仪表板数据
  getCacheDashboard(): Promise<CacheDashboardResponse>
  
  // 获取支付重试统计
  getPaymentRetryStats(gateway: string, days?: number): Promise<PaymentRetryStatsResponse>
  
  // 获取发票统计
  getInvoiceStats(fromDate?: string, toDate?: string): Promise<InvoiceStatsResponse>
  
  // 获取收入趋势数据
  getRevenueTrend(params?: StatsQueryParams): Promise<RevenueTrendData>
  
  // 获取用户增长数据
  getUserGrowth(params?: StatsQueryParams): Promise<UserGrowthData[]>
}