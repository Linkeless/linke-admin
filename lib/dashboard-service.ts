import { api } from './api'
import { StandardResponse } from './types'
import {
  DashboardOverview,
  UserStatsResponse,
  CacheMetricsResponse,
  PaymentRetryStatsResponse,
  InvoiceStatsResponse,
  CacheDashboardResponse,
  RevenueTrendData,
  UserGrowthData,
  StatsQueryParams,
  ChartDataPoint,
  DashboardService as IDashboardService,
  OrderStatsData,
  InviteCodeStatsData,
  TicketStatsData
} from './stats-types'

// ==================== 增强的错误处理和重试机制 ====================

interface RetryConfig {
  maxRetries: number
  initialDelay: number
  maxDelay: number
  backoffMultiplier: number
}

interface CircuitBreakerConfig {
  failureThreshold: number
  resetTimeout: number
  monitoringPeriod: number
}

interface CacheConfig {
  ttl: number // Time to live in milliseconds
  maxSize: number
}

interface CachedData<T> {
  data: T
  timestamp: number
  ttl: number
}

// 电路熔断器状态
enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

// 电路熔断器类
class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failures: number = 0
  private nextAttempt: number = 0
  private successCount: number = 0

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN')
      }
      this.state = CircuitState.HALF_OPEN
      this.successCount = 0
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failures = 0
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++
      if (this.successCount >= this.config.failureThreshold) {
        this.state = CircuitState.CLOSED
      }
    }
  }

  private onFailure(): void {
    this.failures++
    if (this.failures >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN
      this.nextAttempt = Date.now() + this.config.resetTimeout
    }
  }

  getState(): CircuitState {
    return this.state
  }

  getFailures(): number {
    return this.failures
  }
}

// 重试机制
class RetryManager {
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig,
    shouldRetry: (error: Error) => boolean = () => true
  ): Promise<T> {
    let lastError: Error
    let delay = config.initialDelay

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          await this.delay(delay)
          delay = Math.min(delay * config.backoffMultiplier, config.maxDelay)
        }
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        if (attempt === config.maxRetries || !shouldRetry(lastError)) {
          throw lastError
        }
      }
    }

    throw lastError!
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// 缓存管理器
class CacheManager {
  private cache = new Map<string, CachedData<any>>()
  private config: CacheConfig

  constructor(config: CacheConfig) {
    this.config = config
    this.startCleanupInterval()
  }

  get<T>(key: string): T | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  set<T>(key: string, data: T, ttl?: number): void {
    if (this.cache.size >= this.config.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.ttl
    })
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now()
      for (const [key, cached] of this.cache.entries()) {
        if (now - cached.timestamp > cached.ttl) {
          this.cache.delete(key)
        }
      }
    }, 60000) // Cleanup every minute
  }

  getStats() {
    const now = Date.now()
    let expired = 0
    let valid = 0

    for (const cached of this.cache.values()) {
      if (now - cached.timestamp > cached.ttl) {
        expired++
      } else {
        valid++
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
      maxSize: this.config.maxSize
    }
  }
}

// API健康检查管理器
class HealthCheckManager {
  private healthStatus = new Map<string, { isHealthy: boolean; lastCheck: number; failures: number }>()

  async checkEndpointHealth(endpoint: string, checkFn: () => Promise<any>): Promise<boolean> {
    const status = this.healthStatus.get(endpoint) || { isHealthy: true, lastCheck: 0, failures: 0 }
    const now = Date.now()

    // Check every 30 seconds
    if (now - status.lastCheck < 30000) {
      return status.isHealthy
    }

    try {
      await checkFn()
      status.isHealthy = true
      status.failures = 0
    } catch (error) {
      status.failures++
      status.isHealthy = status.failures < 3 // Mark unhealthy after 3 consecutive failures
    }

    status.lastCheck = now
    this.healthStatus.set(endpoint, status)
    return status.isHealthy
  }

  getHealthStatus(): Record<string, any> {
    const result: Record<string, any> = {}
    for (const [endpoint, status] of this.healthStatus.entries()) {
      result[endpoint] = {
        isHealthy: status.isHealthy,
        failures: status.failures,
        lastCheck: new Date(status.lastCheck).toISOString()
      }
    }
    return result
  }
}

export class DashboardService implements IDashboardService {
  private cache: CacheManager
  private circuitBreakers: Map<string, CircuitBreaker>
  private healthChecker: HealthCheckManager
  private retryConfig: RetryConfig
  private circuitBreakerConfig: CircuitBreakerConfig
  private requestDeduplication: Map<string, Promise<any>>

  constructor() {
    // Initialize configuration
    this.retryConfig = {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2
    }

    this.circuitBreakerConfig = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 10000 // 10 seconds
    }

    // Initialize components
    this.cache = new CacheManager({ ttl: 300000, maxSize: 100 }) // 5 minutes TTL, max 100 items
    this.circuitBreakers = new Map()
    this.healthChecker = new HealthCheckManager()
    this.requestDeduplication = new Map()
  }

  // 获取或创建电路熔断器
  private getCircuitBreaker(endpoint: string): CircuitBreaker {
    if (!this.circuitBreakers.has(endpoint)) {
      this.circuitBreakers.set(endpoint, new CircuitBreaker(this.circuitBreakerConfig))
    }
    return this.circuitBreakers.get(endpoint)!
  }

  // 请求去重
  private async deduplicateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.requestDeduplication.has(key)) {
      return this.requestDeduplication.get(key)!
    }

    const promise = requestFn().finally(() => {
      this.requestDeduplication.delete(key)
    })

    this.requestDeduplication.set(key, promise)
    return promise
  }

  // 执行带有缓存、重试和电路熔断的请求
  private async executeEnhancedRequest<T>(
    cacheKey: string,
    endpoint: string,
    requestFn: () => Promise<T>,
    cacheTTL?: number
  ): Promise<T> {
    // 1. 检查缓存
    const cached = this.cache.get<T>(cacheKey)
    if (cached) {
      return cached
    }

    // 2. 请求去重
    return this.deduplicateRequest(cacheKey, async () => {
      // 3. 健康检查
      const isHealthy = await this.healthChecker.checkEndpointHealth(endpoint, async () => {
        // Simple ping to check if endpoint is responsive
        await api.get('/admin/users/statistics')
      })

      if (!isHealthy) {
        console.warn(`Endpoint ${endpoint} is unhealthy, using fallback`)
        throw new Error(`Endpoint ${endpoint} is currently unhealthy`)
      }

      // 4. 电路熔断器执行
      const circuitBreaker = this.getCircuitBreaker(endpoint)
      const result = await circuitBreaker.execute(async () => {
        // 5. 重试机制执行
        return RetryManager.executeWithRetry(
          requestFn,
          this.retryConfig,
          (error) => {
            // 决定是否应该重试
            if (error.message.includes('Circuit breaker is OPEN')) {
              return false
            }
            if (error.message.includes('权限不足')) {
              return false
            }
            return true
          }
        )
      })

      // 6. 缓存结果
      this.cache.set(cacheKey, result, cacheTTL)
      return result
    })
  }

  // 获取系统健康状态
  async getSystemHealth(): Promise<{
    circuitBreakers: Record<string, { state: CircuitState; failures: number }>
    cache: ReturnType<CacheManager['getStats']>
    endpoints: Record<string, any>
  }> {
    const circuitBreakers: Record<string, { state: CircuitState; failures: number }> = {}
    for (const [endpoint, breaker] of this.circuitBreakers.entries()) {
      circuitBreakers[endpoint] = {
        state: breaker.getState(),
        failures: breaker.getFailures()
      }
    }

    return {
      circuitBreakers,
      cache: this.cache.getStats(),
      endpoints: this.healthChecker.getHealthStatus()
    }
  }

  // 清理缓存
  clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
    } else {
      // Clear specific keys matching pattern
      // This is a simple implementation, in production you might want a more sophisticated pattern matching
      this.cache.delete(pattern)
    }
  }

  // 预热缓存
  async warmupCache(): Promise<void> {
    try {
      // 预热关键数据
      await Promise.allSettled([
        this.getUserStats(),
        this.getCacheMetrics(),
        this.getInvoiceStats()
      ])
    } catch (error) {
      console.warn('Cache warmup failed:', error)
    }
  }
  
  // 获取用户统计 (实际存在的API) - 增强版本
  async getUserStats(): Promise<UserStatsResponse> {
    return this.executeEnhancedRequest(
      'user-stats',
      '/admin/users/statistics',
      async () => {
        const response: StandardResponse<UserStatsResponse> = await api.get('/admin/users/statistics')
        
        if (response.code === 0 && response.data) {
          return response.data
        }
        throw new Error(response.message || '获取用户统计失败')
      },
      180000 // 3 minutes cache
    )
  }

  // 获取缓存性能指标 - 增强版本
  async getCacheMetrics(): Promise<CacheMetricsResponse> {
    return this.executeEnhancedRequest(
      'cache-metrics',
      '/admin/cache/metrics',
      async () => {
        const response: StandardResponse<CacheMetricsResponse> = await api.get('/admin/cache/metrics')
        
        if (response.code === 0 && response.data) {
          return response.data
        }
        throw new Error(response.message || '获取缓存指标失败')
      },
      60000 // 1 minute cache
    )
  }

  // 获取缓存监控仪表板数据 - 增强版本
  async getCacheDashboard(): Promise<CacheDashboardResponse> {
    return this.executeEnhancedRequest(
      'cache-dashboard',
      '/admin/cache/monitor/dashboard',
      async () => {
        const response: StandardResponse<CacheDashboardResponse> = await api.get('/admin/cache/monitor/dashboard')
        
        if (response.code === 0 && response.data) {
          return response.data
        }
        throw new Error(response.message || '获取缓存仪表板数据失败')
      },
      120000 // 2 minutes cache
    )
  }

  // 获取支付重试统计 - 增强版本
  async getPaymentRetryStats(gateway: string, days: number = 30): Promise<PaymentRetryStatsResponse> {
    const cacheKey = `payment-retry-stats-${gateway}-${days}`
    return this.executeEnhancedRequest(
      cacheKey,
      '/admin/payment/retries/statistics',
      async () => {
        const response: StandardResponse<PaymentRetryStatsResponse> = await api.get('/admin/payment/retries/statistics', {
          gateway,
          days: days.toString()
        })
        
        if (response.code === 0 && response.data) {
          return response.data
        }
        throw new Error(response.message || '获取支付重试统计失败')
      },
      300000 // 5 minutes cache
    )
  }

  // 获取发票统计 - 增强版本
  async getInvoiceStats(fromDate?: string, toDate?: string): Promise<InvoiceStatsResponse> {
    const cacheKey = `invoice-stats-${fromDate || 'all'}-${toDate || 'all'}`
    return this.executeEnhancedRequest(
      cacheKey,
      '/invoice/statistics',
      async () => {
        const params: Record<string, string> = {}
        if (fromDate) params.from_date = fromDate
        if (toDate) params.to_date = toDate
        
        const response: StandardResponse<InvoiceStatsResponse> = await api.get('/invoice/statistics', params)
        
        if (response.code === 0 && response.data) {
          return response.data
        }
        throw new Error(response.message || '获取发票统计失败')
      },
      600000 // 10 minutes cache for invoice stats
    )
  }

  // 获取Dashboard概览数据 (基于实际可用的APIs) - 增强版本
  async getOverview(params?: StatsQueryParams): Promise<DashboardOverview> {
    const cacheKey = `dashboard-overview-${JSON.stringify(params || {})}`
    
    try {
      return await this.executeEnhancedRequest(
        cacheKey,
        '/dashboard/overview',
        async () => {
          console.log('获取Dashboard概览数据...')
          
          // 并行获取所有统计数据 - 使用增强的错误处理
          const [userStats, cacheMetrics, cacheDashboard, invoiceStats] = await Promise.allSettled([
            this.getUserStats(),
            this.getCacheMetrics(),
            this.getCacheDashboard(),
            this.getInvoiceStats(params?.start_date, params?.end_date)
          ])

          // 获取实际数据，提供更详细的错误信息
          const users = userStats.status === 'fulfilled' 
            ? userStats.value 
            : (() => {
                console.warn('用户统计获取失败:', userStats.reason)
                return this.getDefaultUserStats()
              })()
              
          const invoices = invoiceStats.status === 'fulfilled' 
            ? invoiceStats.value 
            : (() => {
                console.warn('发票统计获取失败:', invoiceStats.reason)
                return null
              })()

          const cacheMetricsData = cacheMetrics.status === 'fulfilled' 
            ? cacheMetrics.value 
            : (() => {
                console.warn('缓存指标获取失败:', cacheMetrics.reason)
                return null
              })()
              
          const cacheDashboardData = cacheDashboard.status === 'fulfilled' 
            ? cacheDashboard.value 
            : (() => {
                console.warn('缓存仪表板获取失败:', cacheDashboard.reason)
                return null
              })()

          // 构建概览数据，如果某个API失败则使用默认值
          const overview: DashboardOverview = {
            users,
            cache: {
              metrics: cacheMetricsData,
              dashboard: cacheDashboardData
            },
            invoices,
            // 可以添加支付重试统计，但需要指定gateway
            payments: null,
            // 计算字段，基于现有数据生成
            orders: this.generateOrderStats(invoices),
            inviteCodes: this.generateInviteCodeStats(users),
            tickets: this.generateTicketStats(users)
          }

          console.log('Dashboard概览数据获取成功')
          return overview
        },
        180000 // 3 minutes cache for overview
      )
    } catch (error) {
      console.error('获取Dashboard概览数据失败:', error)
      
      // 提供降级数据
      const fallbackData: DashboardOverview = {
        users: this.getDefaultUserStats(),
        cache: { metrics: null, dashboard: null },
        invoices: null,
        payments: null,
        orders: { total_orders: 0, paid_orders: 0, pending_orders: 0, total_revenue: 0, conversion_rate: 0 },
        inviteCodes: { total_codes: 0, used_codes: 0, unused_codes: 0, usage_rate: 0 },
        tickets: { total_tickets: 0, open_tickets: 0, resolved_tickets: 0, pending_tickets: 0 }
      }
      
      console.log('使用降级数据')
      return fallbackData
    }
  }

  // 获取收入趋势数据 (基于发票统计数据模拟) - 增强版本
  async getRevenueTrend(params?: StatsQueryParams): Promise<RevenueTrendData> {
    const cacheKey = `revenue-trend-${JSON.stringify(params || {})}`
    
    try {
      return await this.executeEnhancedRequest(
        cacheKey,
        '/revenue/trend',
        async () => {
          // 基于发票统计获取收入数据
          const invoiceStats = await this.getInvoiceStats(params?.start_date, params?.end_date)
          
          // 模拟趋势数据 - 实际项目中应该有专门的趋势接口
          const baseRevenue = invoiceStats?.total_amount || 0
          const daily: ChartDataPoint[] = this.generateMockTrendData('daily', baseRevenue)
          const weekly: ChartDataPoint[] = this.generateMockTrendData('weekly', baseRevenue)
          const monthly: ChartDataPoint[] = this.generateMockTrendData('monthly', baseRevenue)

          return { daily, weekly, monthly }
        },
        300000 // 5 minutes cache
      )
    } catch (error) {
      console.error('获取收入趋势数据失败:', error)
      // 返回空数据而不是抛出错误
      return {
        daily: [],
        weekly: [],
        monthly: []
      }
    }
  }

  // 获取用户增长数据 (基于用户统计数据模拟) - 增强版本
  async getUserGrowth(params?: StatsQueryParams): Promise<UserGrowthData[]> {
    const cacheKey = `user-growth-${JSON.stringify(params || {})}`
    
    try {
      return await this.executeEnhancedRequest(
        cacheKey,
        '/users/growth',
        async () => {
          const userStats = await this.getUserStats()
          
          // 模拟用户增长数据 - 实际项目中应该有专门的增长接口
          return this.generateMockUserGrowthData(userStats)
        },
        240000 // 4 minutes cache
      )
    } catch (error) {
      console.error('获取用户增长数据失败:', error)
      return []
    }
  }

  // 获取默认用户统计数据 (当API失败时使用)
  private getDefaultUserStats(): UserStatsResponse {
    return {
      total_users: 0,
      active_users: 0,
      new_users_today: 0,
      new_users_this_week: 0,
      new_users_this_month: 0,
      users_by_role: {},
      users_by_provider: {},
      users_by_status: {}
    }
  }

  // 构建查询参数
  private buildQueryParams(params?: StatsQueryParams): Record<string, string> {
    if (!params) return {}
    
    const queryParams: Record<string, string> = {}
    
    if (params.period) {
      queryParams.period = params.period
    }
    if (params.start_date) {
      queryParams.start_date = params.start_date
    }
    if (params.end_date) {
      queryParams.end_date = params.end_date
    }
    
    return queryParams
  }

  // 生成模拟趋势数据
  private generateMockTrendData(period: string, totalRevenue: number): ChartDataPoint[] {
    const data: ChartDataPoint[] = []
    const now = new Date()
    let days = 7
    
    switch (period) {
      case 'daily':
        days = 7
        break
      case 'weekly':
        days = 4 * 7 // 4 weeks
        break
      case 'monthly':
        days = 12 * 30 // 12 months
        break
    }

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      
      // 简单的模拟数据，实际应该从后端获取
      const value = totalRevenue * (0.5 + Math.random() * 0.5) / days
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(value * 100) / 100
      })
    }

    return data
  }

  // 生成模拟用户增长数据
  private generateMockUserGrowthData(userStats: UserStatsResponse): UserGrowthData[] {
    const data: UserGrowthData[] = []
    const now = new Date()
    const days = 30

    let cumulativeUsers = userStats.total_users - userStats.new_users_this_month

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      
      // 简单的模拟每日新增用户
      const dailyNewUsers = Math.floor(userStats.new_users_this_month / days * (0.5 + Math.random()))
      cumulativeUsers += dailyNewUsers
      
      data.push({
        date: date.toISOString().split('T')[0],
        new_users: dailyNewUsers,
        total_users: cumulativeUsers,
        active_users: Math.floor(cumulativeUsers * 0.85) // 假设85%的用户是活跃的
      })
    }

    return data
  }

  // 基于发票数据生成订单统计
  private generateOrderStats(invoices: InvoiceStatsResponse | null): OrderStatsData {
    if (!invoices) {
      return {
        total_orders: 0,
        paid_orders: 0,
        pending_orders: 0,
        total_revenue: 0,
        conversion_rate: 0
      }
    }

    const total_orders = invoices.total_invoices
    const paid_orders = invoices.paid_invoices
    const pending_orders = invoices.unpaid_invoices
    
    return {
      total_orders,
      paid_orders,
      pending_orders,
      total_revenue: invoices.total_amount,
      conversion_rate: total_orders > 0 ? paid_orders / total_orders : 0
    }
  }

  // 基于用户数据生成邀请码统计 (模拟)
  private generateInviteCodeStats(users: UserStatsResponse): InviteCodeStatsData {
    // 基于用户数量模拟邀请码数据
    const total_codes = Math.max(100, Math.floor(users.total_users * 0.3))
    const used_codes = Math.floor(total_codes * 0.65) // 65%使用率
    const unused_codes = total_codes - used_codes
    
    return {
      total_codes,
      used_codes,
      unused_codes,
      usage_rate: total_codes > 0 ? used_codes / total_codes : 0
    }
  }

  // 基于用户数据生成工单统计 (模拟)
  private generateTicketStats(users: UserStatsResponse): TicketStatsData {
    // 基于用户数量模拟工单数据
    const total_tickets = Math.max(5, Math.floor(users.total_users * 0.05)) // 5%用户会提工单
    const resolved_tickets = Math.floor(total_tickets * 0.75) // 75%已解决
    const open_tickets = Math.floor((total_tickets - resolved_tickets) * 0.6) // 60%待处理
    const pending_tickets = total_tickets - resolved_tickets - open_tickets
    
    return {
      total_tickets,
      open_tickets,
      resolved_tickets,
      pending_tickets
    }
  }
}

// 导出单例实例
export const dashboardService = new DashboardService()