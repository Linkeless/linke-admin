import { api } from './api'
import { StandardResponse } from './types'
import {
  DashboardOverview,
  UserStatsResponse,
  OrderStatsResponse,
  InviteCodeStatsResponse,
  TicketStatsResponse,
  ReferralCampaignStatsResponse,
  RevenueTrendData,
  UserGrowthData,
  StatsQueryParams,
  ChartDataPoint,
  DashboardService as IDashboardService
} from './stats-types'

export class DashboardService implements IDashboardService {
  
  // 获取用户统计
  async getUserStats(params?: StatsQueryParams): Promise<UserStatsResponse> {
    const queryParams = this.buildQueryParams(params)
    const response: StandardResponse<UserStatsResponse> = await api.get('/admin/users/stats', queryParams)
    
    if (response.code === 0 && response.data) {
      return response.data
    }
    throw new Error(response.message || '获取用户统计失败')
  }

  // 获取订单统计
  async getOrderStats(params?: StatsQueryParams): Promise<OrderStatsResponse> {
    const queryParams = this.buildQueryParams(params)
    const response: StandardResponse<OrderStatsResponse> = await api.get('/admin/orders/stats', queryParams)
    
    if (response.code === 0 && response.data) {
      return response.data
    }
    throw new Error(response.message || '获取订单统计失败')
  }

  // 获取邀请码统计
  async getInviteCodeStats(): Promise<InviteCodeStatsResponse> {
    const response: StandardResponse<InviteCodeStatsResponse> = await api.get('/admin/invite-codes/stats')
    
    if (response.code === 0 && response.data) {
      return response.data
    }
    throw new Error(response.message || '获取邀请码统计失败')
  }

  // 获取工单统计
  async getTicketStats(params?: StatsQueryParams): Promise<TicketStatsResponse> {
    const queryParams = this.buildQueryParams(params)
    const response: StandardResponse<TicketStatsResponse> = await api.get('/admin/tickets/stats', queryParams)
    
    if (response.code === 0 && response.data) {
      return response.data
    }
    throw new Error(response.message || '获取工单统计失败')
  }

  // 获取推荐活动统计 (需要campaignId)
  async getReferralCampaignStats(campaignId: number): Promise<ReferralCampaignStatsResponse> {
    const response: StandardResponse<ReferralCampaignStatsResponse> = await api.get(`/admin/referral-campaigns/${campaignId}/stats`)
    
    if (response.code === 0 && response.data) {
      return response.data
    }
    throw new Error(response.message || '获取推荐活动统计失败')
  }

  // 获取Dashboard概览数据
  async getOverview(params?: StatsQueryParams): Promise<DashboardOverview> {
    try {
      // 并行获取所有统计数据
      const [users, orders, inviteCodes, tickets] = await Promise.all([
        this.getUserStats(params),
        this.getOrderStats(params),
        this.getInviteCodeStats(),
        this.getTicketStats(params)
      ])

      return {
        users,
        orders,
        inviteCodes,
        tickets
      }
    } catch (error) {
      console.error('获取Dashboard概览数据失败:', error)
      throw error
    }
  }

  // 获取收入趋势数据 (基于订单统计数据模拟)
  async getRevenueTrend(params?: StatsQueryParams): Promise<RevenueTrendData> {
    try {
      // 获取不同时间周期的数据
      const [dailyStats, weeklyStats, monthlyStats] = await Promise.all([
        this.getOrderStats({ ...params, period: 'today' }),
        this.getOrderStats({ ...params, period: 'week' }),
        this.getOrderStats({ ...params, period: 'month' })
      ])

      // 模拟趋势数据 - 实际项目中应该有专门的趋势接口
      const daily: ChartDataPoint[] = this.generateMockTrendData('daily', dailyStats.total_revenue)
      const weekly: ChartDataPoint[] = this.generateMockTrendData('weekly', weeklyStats.total_revenue)
      const monthly: ChartDataPoint[] = this.generateMockTrendData('monthly', monthlyStats.total_revenue)

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
  async getUserGrowth(params?: StatsQueryParams): Promise<UserGrowthData[]> {
    try {
      const userStats = await this.getUserStats(params)
      
      // 模拟用户增长数据 - 实际项目中应该有专门的增长接口
      return this.generateMockUserGrowthData(userStats)
    } catch (error) {
      console.error('获取用户增长数据失败:', error)
      return []
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