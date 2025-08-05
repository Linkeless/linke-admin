import {
  RetryStrategy,
  CreateRetryStrategyRequest,
  UpdateRetryStrategyRequest,
  RetryRecord,
  PaymentRetryHistory,
  ManualRetryRequest,
  RetryConfig,
  UpdateRetryConfigRequest,
  RetryStats,
  RetryOverview,
  RetryStrategiesQueryParams,
  RetryRecordsQueryParams,
  ApiResponse,
  PaginatedApiResponse,
  RetryStrategiesApiResponse,
  RetryRecordsApiResponse,
  RetryRecordDetail,
  StrategyPerformance,
  RealtimeMonitoringData,
  ErrorConditionOption,
  PaymentMethodOption,
  RetryIntervalPreset
} from './payment-retry-types'
import { getToken } from './api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1'

class PaymentRetryService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // 添加认证 token
    const token = getToken()
    if (token) {
      defaultHeaders.Authorization = `Bearer ${token}`
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // ========== 重试策略相关API ==========

  // 获取重试策略列表
  async getRetryStrategies(params?: RetryStrategiesQueryParams): Promise<RetryStrategiesApiResponse> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }

    const queryString = searchParams.toString()
    const endpoint = `/admin/payments/retry/strategies${queryString ? `?${queryString}` : ''}`
    
    return this.request<RetryStrategiesApiResponse>(endpoint, {
      method: 'GET',
    })
  }

  // 获取单个重试策略
  async getRetryStrategy(id: string): Promise<ApiResponse<RetryStrategy>> {
    return this.request<ApiResponse<RetryStrategy>>(`/admin/payments/retry/strategies/${id}`, {
      method: 'GET',
    })
  }

  // 创建重试策略
  async createRetryStrategy(data: CreateRetryStrategyRequest): Promise<ApiResponse<RetryStrategy>> {
    return this.request<ApiResponse<RetryStrategy>>('/admin/payments/retry/strategies', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // 更新重试策略
  async updateRetryStrategy(id: string, data: UpdateRetryStrategyRequest): Promise<ApiResponse<RetryStrategy>> {
    return this.request<ApiResponse<RetryStrategy>>(`/admin/payments/retry/strategies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // 删除重试策略
  async deleteRetryStrategy(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/admin/payments/retry/strategies/${id}`, {
      method: 'DELETE',
    })
  }

  // 批量启用重试策略
  async batchEnableStrategies(ids: string[]): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>('/admin/payments/retry/strategies/batch/enable', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    })
  }

  // 批量禁用重试策略
  async batchDisableStrategies(ids: string[]): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>('/admin/payments/retry/strategies/batch/disable', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    })
  }

  // 批量删除重试策略
  async batchDeleteStrategies(ids: string[]): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>('/admin/payments/retry/strategies/batch/delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    })
  }

  // 获取策略效果分析
  async getStrategyPerformance(id: string, days: number = 30): Promise<ApiResponse<StrategyPerformance>> {
    return this.request<ApiResponse<StrategyPerformance>>(
      `/admin/payments/retry/strategies/${id}/performance?days=${days}`,
      { method: 'GET' }
    )
  }

  // ========== 重试记录相关API ==========

  // 获取重试记录列表
  async getRetryRecords(params?: RetryRecordsQueryParams): Promise<RetryRecordsApiResponse> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }

    const queryString = searchParams.toString()
    const endpoint = `/admin/payments/retry/records${queryString ? `?${queryString}` : ''}`
    
    return this.request<RetryRecordsApiResponse>(endpoint, {
      method: 'GET',
    })
  }

  // 获取支付重试历史
  async getPaymentRetryHistory(paymentId: string): Promise<ApiResponse<PaymentRetryHistory>> {
    return this.request<ApiResponse<PaymentRetryHistory>>(
      `/admin/payments/retry/${paymentId}/history`,
      { method: 'GET' }
    )
  }

  // 获取重试记录详情
  async getRetryRecordDetail(recordId: string): Promise<ApiResponse<RetryRecordDetail>> {
    return this.request<ApiResponse<RetryRecordDetail>>(
      `/admin/payments/retry/records/${recordId}/detail`,
      { method: 'GET' }
    )
  }

  // 手动重试支付
  async manualRetryPayment(data: ManualRetryRequest): Promise<ApiResponse<RetryRecord>> {
    return this.request<ApiResponse<RetryRecord>>(
      `/admin/payments/retry/${data.payment_id}`,
      {
        method: 'POST',
        body: JSON.stringify({
          strategy_id: data.strategy_id,
          force: data.force,
          reason: data.reason,
        }),
      }
    )
  }

  // 取消重试
  async cancelRetry(paymentId: string, reason?: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(
      `/admin/payments/retry/${paymentId}/cancel`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    )
  }

  // ========== 重试配置相关API ==========

  // 获取重试配置
  async getRetryConfig(): Promise<ApiResponse<RetryConfig>> {
    return this.request<ApiResponse<RetryConfig>>('/admin/payments/retry/config', {
      method: 'GET',
    })
  }

  // 更新重试配置
  async updateRetryConfig(data: UpdateRetryConfigRequest): Promise<ApiResponse<RetryConfig>> {
    return this.request<ApiResponse<RetryConfig>>('/admin/payments/retry/config', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // ========== 统计和监控相关API ==========

  // 获取重试统计
  async getRetryStats(days: number = 30): Promise<ApiResponse<RetryStats>> {
    return this.request<ApiResponse<RetryStats>>(
      `/admin/payments/retry/stats?days=${days}`,
      { method: 'GET' }
    )
  }

  // 获取重试概览
  async getRetryOverview(): Promise<ApiResponse<RetryOverview>> {
    return this.request<ApiResponse<RetryOverview>>('/admin/payments/retry/overview', {
      method: 'GET',
    })
  }

  // 获取实时监控数据
  async getRealtimeMonitoringData(): Promise<ApiResponse<RealtimeMonitoringData>> {
    return this.request<ApiResponse<RealtimeMonitoringData>>(
      '/admin/payments/retry/monitoring/realtime',
      { method: 'GET' }
    )
  }

  // ========== 配置选项相关API ==========

  // 获取错误条件选项
  async getErrorConditions(): Promise<ApiResponse<ErrorConditionOption[]>> {
    return this.request<ApiResponse<ErrorConditionOption[]>>(
      '/admin/payments/retry/error-conditions',
      { method: 'GET' }
    )
  }

  // 获取支付方式选项
  async getPaymentMethods(): Promise<ApiResponse<PaymentMethodOption[]>> {
    return this.request<ApiResponse<PaymentMethodOption[]>>(
      '/admin/payments/retry/payment-methods',
      { method: 'GET' }
    )
  }

  // 获取重试间隔预设
  getRetryIntervalPresets(): RetryIntervalPreset[] {
    return [
      {
        name: '快速重试',
        description: '适用于网络临时故障，短时间内多次重试',
        intervals: [30, 60, 120, 300] // 30秒, 1分钟, 2分钟, 5分钟
      },
      {
        name: '标准重试',
        description: '适用于一般支付失败，逐步增加重试间隔',
        intervals: [300, 900, 1800, 3600] // 5分钟, 15分钟, 30分钟, 1小时
      },
      {
        name: '延迟重试',
        description: '适用于账户余额不足等问题，给用户充足时间处理',
        intervals: [1800, 3600, 7200, 14400] // 30分钟, 1小时, 2小时, 4小时
      },
      {
        name: '长期重试',
        description: '适用于系统维护等长期问题',
        intervals: [3600, 7200, 14400, 28800, 86400] // 1小时, 2小时, 4小时, 8小时, 24小时
      },
      {
        name: '自定义',
        description: '根据具体业务需求自定义重试间隔',
        intervals: []
      }
    ]
  }

  // 获取错误类型选项 (静态数据)
  getErrorTypeOptions(): { value: string; label: string; description: string }[] {
    return [
      { value: 'network_error', label: '网络错误', description: '网络连接问题导致的失败' },
      { value: 'timeout', label: '超时', description: '请求超时导致的失败' },
      { value: 'gateway_error', label: '网关错误', description: '支付网关返回错误' },
      { value: 'insufficient_funds', label: '余额不足', description: '账户余额不足' },
      { value: 'card_declined', label: '卡片被拒', description: '银行卡被拒绝' },
      { value: 'authentication_failed', label: '认证失败', description: '身份认证失败' },
      { value: 'rate_limit', label: '频率限制', description: '请求频率超过限制' },
      { value: 'system_error', label: '系统错误', description: '内部系统错误' },
      { value: 'unknown', label: '未知错误', description: '未知类型的错误' }
    ]
  }

  // 获取重试状态选项 (静态数据)
  getRetryStatusOptions(): { value: string; label: string; color: string }[] {
    return [
      { value: 'pending', label: '等待中', color: 'blue' },
      { value: 'in_progress', label: '进行中', color: 'yellow' },
      { value: 'success', label: '已成功', color: 'green' },
      { value: 'failed', label: '已失败', color: 'red' },
      { value: 'cancelled', label: '已取消', color: 'gray' }
    ]
  }

  // 获取时间范围选项 (静态数据)
  getTimeRangeOptions(): { value: string; label: string }[] {
    return [
      { value: '1h', label: '最近1小时' },
      { value: '6h', label: '最近6小时' },
      { value: '24h', label: '最近24小时' },
      { value: '7d', label: '最近7天' },
      { value: '30d', label: '最近30天' },
      { value: 'custom', label: '自定义时间' }
    ]
  }

  // ========== 工具方法 ==========

  // 格式化重试间隔显示
  formatRetryInterval(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}秒`
    } else if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}分钟`
    } else if (seconds < 86400) {
      return `${Math.floor(seconds / 3600)}小时`
    } else {
      return `${Math.floor(seconds / 86400)}天`
    }
  }

  // 计算下次重试时间
  calculateNextRetryTime(currentAttempt: number, retryIntervals: number[]): Date | null {
    if (currentAttempt >= retryIntervals.length) {
      return null // 已达到最大重试次数
    }
    
    const intervalSeconds = retryIntervals[currentAttempt - 1] || retryIntervals[retryIntervals.length - 1]
    return new Date(Date.now() + intervalSeconds * 1000)
  }

  // 验证重试策略配置
  validateRetryStrategy(strategy: CreateRetryStrategyRequest | UpdateRetryStrategyRequest): string[] {
    const errors: string[] = []

    if ('name' in strategy && (!strategy.name || strategy.name.trim().length === 0)) {
      errors.push('策略名称不能为空')
    }

    if ('max_attempts' in strategy && strategy.max_attempts !== undefined) {
      if (strategy.max_attempts < 1 || strategy.max_attempts > 10) {
        errors.push('最大重试次数必须在1-10之间')
      }
    }

    if ('retry_intervals' in strategy && strategy.retry_intervals !== undefined) {
      if (strategy.retry_intervals.length === 0) {
        errors.push('重试间隔不能为空')
      }
      
      for (const interval of strategy.retry_intervals) {
        if (interval < 10 || interval > 86400) {
          errors.push('重试间隔必须在10秒-24小时之间')
        }
      }
    }

    if ('payment_methods' in strategy && strategy.payment_methods !== undefined) {
      if (strategy.payment_methods.length === 0) {
        errors.push('至少需要选择一种支付方式')
      }
    }

    if ('error_conditions' in strategy && strategy.error_conditions !== undefined) {
      if (strategy.error_conditions.length === 0) {
        errors.push('至少需要选择一种错误条件')
      }
    }

    return errors
  }

  // 计算策略性能评分
  calculatePerformanceScore(performance: StrategyPerformance): number {
    const successRateWeight = 0.4
    const efficiencyWeight = 0.3
    const costSavedWeight = 0.3

    const successRateScore = performance.success_rate * 100
    const efficiencyScore = Math.max(0, 100 - (performance.average_attempts - 1) * 25)
    const costSavedScore = Math.min(100, performance.cost_saved / 1000 * 10)

    return Math.round(
      successRateScore * successRateWeight +
      efficiencyScore * efficiencyWeight +
      costSavedScore * costSavedWeight
    )
  }
}

// 导出单例实例
export const paymentRetryService = new PaymentRetryService()

// 导出类型以供其他文件使用
export type { PaymentRetryService }