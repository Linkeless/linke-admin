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
  DashboardService as IDashboardService
} from './stats-types'

export class DashboardService implements IDashboardService {
  
  // 获取用户统计 (实际存在的API)
  async getUserStats(): Promise<UserStatsResponse> {
    const response: StandardResponse<UserStatsResponse> = await api.get('/admin/users/statistics')
    
    if (response.code === 0 && response.data) {
      return response.data
    }
    throw new Error(response.message || '获取用户统计失败')
  }

  // 获取缓存性能指标
  async getCacheMetrics(): Promise<CacheMetricsResponse> {
    const response: StandardResponse<CacheMetricsResponse> = await api.get('/admin/cache/metrics')
    
    if (response.code === 0 && response.data) {
      return response.data
    }
    throw new Error(response.message || '获取缓存指标失败')
  }

  // 获取缓存监控仪表板数据
  async getCacheDashboard(): Promise<CacheDashboardResponse> {
    const response: StandardResponse<CacheDashboardResponse> = await api.get('/admin/cache/monitor/dashboard')
    
    if (response.code === 0 && response.data) {
      return response.data
    }
    throw new Error(response.message || '获取缓存仪表板数据失败')
  }

  // 获取支付重试统计
  async getPaymentRetryStats(gateway: string, days: number = 30): Promise<PaymentRetryStatsResponse> {
    const response: StandardResponse<PaymentRetryStatsResponse> = await api.get('/admin/payment/retries/statistics', {
      gateway,
      days: days.toString()
    })
    
    if (response.code === 0 && response.data) {
      return response.data
    }
    throw new Error(response.message || '获取支付重试统计失败')
  }

  // 获取发票统计
  async getInvoiceStats(fromDate?: string, toDate?: string): Promise<InvoiceStatsResponse> {
    const params: Record<string, string> = {}
    if (fromDate) params.from_date = fromDate
    if (toDate) params.to_date = toDate
    
    const response: StandardResponse<InvoiceStatsResponse> = await api.get('/invoice/statistics', params)
    
    if (response.code === 0 && response.data) {
      return response.data
    }
    throw new Error(response.message || '获取发票统计失败')
  }

  // 获取Dashboard概览数据 (基于实际可用的APIs)
  async getOverview(params?: StatsQueryParams): Promise<DashboardOverview> {
    try {
      // 并行获取所有统计数据
      const [userStats, cacheMetrics, cacheDashboard, invoiceStats] = await Promise.allSettled([
        this.getUserStats(),
        this.getCacheMetrics(),
        this.getCacheDashboard(),
        this.getInvoiceStats(params?.start_date, params?.end_date)
      ])

      // 构建概览数据，如果某个API失败则使用默认值
      return {
        users: userStats.status === 'fulfilled' ? userStats.value : this.getDefaultUserStats(),
        cache: {
          metrics: cacheMetrics.status === 'fulfilled' ? cacheMetrics.value : null,
          dashboard: cacheDashboard.status === 'fulfilled' ? cacheDashboard.value : null
        },
        invoices: invoiceStats.status === 'fulfilled' ? invoiceStats.value : null,
        // 可以添加支付重试统计，但需要指定gateway
        payments: null
      }
    } catch (error) {
      console.error('获取Dashboard概览数据失败:', error)
      throw error
    }
  }

  // 获取收入趋势数据 (基于发票统计数据模拟)
  async getRevenueTrend(params?: StatsQueryParams): Promise<RevenueTrendData> {
    try {
      // 基于发票统计获取收入数据
      const invoiceStats = await this.getInvoiceStats(params?.start_date, params?.end_date)
      
      // 模拟趋势数据 - 实际项目中应该有专门的趋势接口
      const baseRevenue = invoiceStats?.total_amount || 0
      const daily: ChartDataPoint[] = this.generateMockTrendData('daily', baseRevenue)
      const weekly: ChartDataPoint[] = this.generateMockTrendData('weekly', baseRevenue)
      const monthly: ChartDataPoint[] = this.generateMockTrendData('monthly', baseRevenue)

      return { daily, weekly, monthly }
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

  // 获取用户增长数据 (基于用户统计数据模拟)
  async getUserGrowth(_params?: StatsQueryParams): Promise<UserGrowthData[]> {
    try {
      const userStats = await this.getUserStats()
      
      // 模拟用户增长数据 - 实际项目中应该有专门的增长接口
      return this.generateMockUserGrowthData(userStats)
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
}

// 导出单例实例
export const dashboardService = new DashboardService()